import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Send, ArrowLeft, Search, CheckCheck, Check,
  RefreshCw, Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import { PageSpinner, EmptyState, InlineAlert } from '../components/ui';
import {
  fetchConversationsApi, fetchMessagesApi, sendMessageApi, markConversationReadApi,
} from '../services/api';
import { formatDateTime } from '../utils/formatters';
import AppLayout from '../layouts/AppLayout';

export default function Messages() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { socket, isConnected, joinConversation, leaveConversation, sendTyping, refreshUnreadCounts } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(location.state?.conversationId || null);
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activeConversationIdRef = useRef(activeConversationId);

  useEffect(() => { activeConversationIdRef.current = activeConversationId; }, [activeConversationId]);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };

  const loadConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      setError(null);
      const res = await fetchConversationsApi();
      if (res.success) {
        setConversations(res.data || []);
        if (!activeConversationIdRef.current && res.data?.length > 0 && window.innerWidth >= 768) {
          setActiveConversationId(res.data[0].id);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadMessages = useCallback(async (convId) => {
    if (!convId) return;
    try {
      setLoadingMessages(true);
      const res = await fetchMessagesApi(convId, { limit: 100 });
      if (res.success) {
        setMessages(res.data?.messages || []);
        setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, unreadCount: 0 } : c));
        refreshUnreadCounts();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
      setTimeout(scrollToBottom, 50);
    }
  }, [refreshUnreadCounts]);

  useEffect(() => {
    if (!activeConversationId) return;
    joinConversation(activeConversationId);
    loadMessages(activeConversationId);
    return () => { leaveConversation(activeConversationId); };
  }, [activeConversationId, joinConversation, leaveConversation, loadMessages]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      if (newMsg.conversationId === activeConversationIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(scrollToBottom, 50);
        markConversationReadApi(newMsg.conversationId).catch(() => {});
      }
      setConversations((prev) => prev.map((conv) => {
        if (conv.id !== newMsg.conversationId) return conv;
        const isCurrentActive = conv.id === activeConversationIdRef.current;
        return {
          ...conv,
          lastMessage: newMsg,
          unreadCount: isCurrentActive ? 0 : (conv.unreadCount || 0) + 1,
          updatedAt: newMsg.createdAt,
        };
      }));
    };

    const handleMessagesRead = ({ conversationId, readBy }) => {
      if (readBy !== user?.id && conversationId === activeConversationIdRef.current) {
        setMessages((prev) => prev.map((msg) => msg.senderId === user?.id ? { ...msg, isRead: true } : msg));
      }
    };

    const handleUserTyping = ({ conversationId, userId }) => {
      if (conversationId === activeConversationIdRef.current && userId !== user?.id) {
        setTypingUsers((prev) => ({ ...prev, [conversationId]: true }));
      }
    };

    const handleUserStopTyping = ({ conversationId, userId }) => {
      if (conversationId === activeConversationIdRef.current && userId !== user?.id) {
        setTypingUsers((prev) => ({ ...prev, [conversationId]: false }));
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('messages:read', handleMessagesRead);
    socket.on('user:typing', handleUserTyping);
    socket.on('user:stop_typing', handleUserStopTyping);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('messages:read', handleMessagesRead);
      socket.off('user:typing', handleUserTyping);
      socket.off('user:stop_typing', handleUserStopTyping);
    };
  }, [socket, user?.id]);

  const handleInputChange = (e) => {
    setInputContent(e.target.value);
    if (activeConversationId) {
      sendTyping(activeConversationId, true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => sendTyping(activeConversationId, false), 1500);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputContent.trim() || !activeConversationId || sendingMessage) return;
    const content = inputContent.trim();
    setInputContent('');
    sendTyping(activeConversationId, false);
    try {
      setSendingMessage(true);
      const res = await sendMessageApi(activeConversationId, content);
      if (res.success && res.data) {
        setMessages((prev) => prev.some((m) => m.id === res.data.id) ? prev : [...prev, res.data]);
        setTimeout(scrollToBottom, 50);
        setConversations((prev) => prev.map((c) =>
          c.id === activeConversationId ? { ...c, lastMessage: res.data, updatedAt: res.data.createdAt } : c
        ));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const otherUser = activeConversation?.otherParticipant;

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    const name = c.otherParticipant?.name || '';
    const farm = c.otherParticipant?.farmerProfile?.farmName || '';
    const biz = c.otherParticipant?.buyerProfile?.businessName || '';
    return name.toLowerCase().includes(q) || farm.toLowerCase().includes(q) || biz.toLowerCase().includes(q);
  });

  const fmt = (d) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col fade-in"
          style={{ maxHeight: 'calc(100vh - 64px)' }}>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/40 text-brand-800 dark:text-lime-400 border border-brand-200/50 dark:border-brand-800 flex items-center justify-center shadow-sm">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-ink font-heading tracking-tight">{t('messages.title')}</h1>
                <p className="text-xs text-ink-muted">{t('messages.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isConnected ? 'bg-success-soft text-success border-success-edge' : 'bg-warning-soft text-warning border-warning-edge'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-warning'}`} />
                {isConnected ? (i18n.language === 'en' ? 'Live Direct Link' : t('common.active')) : 'Connecting...'}
              </span>
              <button
                type="button"
                onClick={loadConversations}
                className="w-9 h-9 flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-muted rounded-xl border border-line transition-colors cursor-pointer"
                title={t('common.refresh')}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {error && (
            <InlineAlert type="error" message={error} onDismiss={() => setError(null)} className="mb-4" />
          )}

          {/* Two-pane */}
          <div className="flex-1 bg-surface border border-line rounded-2xl overflow-hidden flex flex-col md:flex-row min-h-0 h-[calc(100vh-230px)] shadow-card">
            {/* Left: conversation list */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-line flex flex-col bg-surface-muted/30 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-3.5 border-b border-line bg-surface">
                <div className="relative">
                  <Search className="w-4 h-4 text-ink-subtle absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder={t('messages.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 bg-surface-muted border border-line rounded-xl text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-line/60">
                {loadingConversations ? (
                  <div className="py-12 flex flex-col items-center gap-2 text-xs text-ink-muted">
                    <RefreshCw className="w-5 h-5 animate-spin text-brand-700 dark:text-lime-400" />
                    {t('common.loading')}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="py-12 px-6 text-center text-xs text-ink-muted space-y-2">
                    <MessageSquare className="w-6 h-6 mx-auto text-ink-subtle" />
                    <p className="font-semibold text-ink">{t('messages.noConversations')}</p>
                    <p>{t('messages.noConversationsDesc')}</p>
                    <button
                      type="button"
                      onClick={() => navigate('/marketplace')}
                      className="mt-2 px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                    >
                      {t('footer.browseProduce')}
                    </button>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const other = conv.otherParticipant;
                    const isActive = conv.id === activeConversationId;
                    const lastMsg = conv.lastMessage;
                    const isUnread = (conv.unreadCount || 0) > 0;
                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => setActiveConversationId(conv.id)}
                        className={`w-full text-left p-4 transition-all flex items-start gap-3 cursor-pointer ${
                          isActive ? 'bg-brand-50/80 dark:bg-brand-900/40 border-l-4 border-brand-800 dark:border-lime-400' : 'hover:bg-surface-muted/60 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className="w-11 h-11 rounded-xl bg-brand-800 text-white flex items-center justify-center font-bold text-sm uppercase shadow-sm">
                            {other?.name ? other.name.slice(0, 2) : 'U'}
                          </div>
                          {isConnected && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-lime-500 border-2 border-surface rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-bold text-ink truncate font-heading">{other?.name || 'User'}</span>
                            <span className="text-[10px] text-ink-subtle shrink-0 font-medium">{lastMsg?.createdAt ? fmt(lastMsg.createdAt) : ''}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              other?.role === 'FARMER' ? 'bg-lime-500/15 text-lime-700 dark:text-lime-400 border border-lime-500/30' : 'bg-info-soft text-info border border-info-edge'
                            }`}>{other?.role === 'FARMER' ? t('auth.roleFarmer') : t('auth.roleBuyer')}</span>
                            <span className="text-[11px] text-ink-muted truncate">
                              {other?.farmerProfile?.farmName || other?.buyerProfile?.businessName || ''}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className={`text-xs truncate ${isUnread ? 'font-bold text-ink' : 'text-ink-muted'}`}>
                              {lastMsg?.senderId === user?.id && <span className="text-ink-subtle font-medium">You: </span>}
                              {lastMsg?.content || t('messages.title')}
                            </p>
                            {isUnread && (
                              <span className="ml-1.5 min-w-[18px] h-[18px] px-1 bg-brand-800 dark:bg-lime-500 text-white dark:text-brand-950 text-[10px] font-extrabold rounded-full flex items-center justify-center shrink-0">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: active chat */}
            <div className={`flex-1 flex flex-col bg-surface ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
              {activeConversation ? (
                <>
                  {/* Chat header */}
                  <div className="px-5 py-3.5 border-b border-line bg-surface-muted/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveConversationId(null)}
                        className="md:hidden p-1.5 text-ink-muted hover:text-ink rounded-lg hover:bg-surface-muted cursor-pointer"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div className="w-10 h-10 rounded-xl bg-brand-800 text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 shadow-sm">
                        {otherUser?.name ? otherUser.name.slice(0, 2) : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-ink font-heading">{otherUser?.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            otherUser?.role === 'FARMER' ? 'bg-lime-500/15 text-lime-700 dark:text-lime-400 border border-lime-500/30' : 'bg-info-soft text-info border border-info-edge'
                          }`}>{otherUser?.role === 'FARMER' ? t('auth.roleFarmer') : t('auth.roleBuyer')}</span>
                        </div>
                        <p className="text-[11px] text-ink-muted">
                          {otherUser?.farmerProfile?.farmName || otherUser?.buyerProfile?.businessName || otherUser?.email}
                        </p>
                      </div>
                    </div>
                    {typingUsers[activeConversationId] && (
                      <div className="flex items-center gap-1.5 text-xs text-brand-800 dark:text-lime-400 font-bold animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 text-lime-500" /> {t('messages.typing')}
                      </div>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-canvas">
                    {loadingMessages ? (
                      <PageSpinner message={t('common.loading')} />
                    ) : messages.length === 0 ? (
                      <div className="py-12 text-center text-xs text-ink-muted space-y-2">
                        <MessageSquare className="w-6 h-6 mx-auto text-ink-subtle" />
                        <p className="font-semibold text-ink">{t('messages.noConversations')}</p>
                        <p>{t('messages.noConversationsDesc')}</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.senderId === user?.id;
                        return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[80%] sm:max-w-md rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words shadow-card ${
                              isMe ? 'bg-brand-800 text-white rounded-br-xs' : 'bg-surface text-ink border border-line rounded-bl-xs'
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            <div className={`flex items-center gap-1 mt-1 text-[10px] text-ink-subtle px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <span>{fmt(msg.createdAt)}</span>
                              {isMe && (
                                msg.isRead
                                  ? <CheckCheck className="w-3.5 h-3.5 text-lime-500" title="Read" />
                                  : <Check className="w-3.5 h-3.5 text-ink-subtle" title="Delivered" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Composer */}
                  <form
                    onSubmit={handleSendMessage}
                    className="p-3.5 border-t border-line bg-surface flex items-center gap-2.5"
                  >
                    <input
                      type="text"
                      placeholder={t('messages.typePlaceholder', { name: otherUser?.name || 'trader' })}
                      value={inputContent}
                      onChange={handleInputChange}
                      disabled={sendingMessage}
                      className="flex-1 h-11 px-4 bg-surface-muted border border-line rounded-xl text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand-500 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!inputContent.trim() || sendingMessage}
                      className="w-11 h-11 bg-lime-500 hover:bg-lime-400 text-brand-950 font-bold disabled:bg-surface-sunken disabled:text-ink-subtle rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-ink-muted">
                  <div className="w-14 h-14 rounded-2xl bg-surface-muted text-ink-subtle flex items-center justify-center mb-3 border border-line">
                    <MessageSquare className="w-7 h-7 text-brand-800 dark:text-lime-400" />
                  </div>
                  <h3 className="text-base font-bold text-ink mb-1 font-heading">{t('messages.selectConversation')}</h3>
                  <p className="text-xs max-w-xs">{t('messages.selectConversationDesc')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
