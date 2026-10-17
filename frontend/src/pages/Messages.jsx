import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  User,
  Search,
  ShieldCheck,
  CheckCheck,
  Check,
  Circle,
  Sprout,
  Store,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../context/SocketContext';
import {
  fetchConversationsApi,
  fetchMessagesApi,
  sendMessageApi,
  markConversationReadApi,
} from '../services/api';
import Navbar from '../components/Navbar';

export default function Messages() {
  const { user } = useAuth();
  const {
    socket,
    isConnected,
    joinConversation,
    leaveConversation,
    sendTyping,
    refreshUnreadCounts,
  } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(
    location.state?.conversationId || null
  );
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

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // Scroll to bottom of chat history
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      setError(null);
      const res = await fetchConversationsApi();
      if (res.success) {
        setConversations(res.data || []);
        // Auto-select first conversation if none selected and on desktop
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

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when active conversation changes
  const loadMessages = useCallback(async (convId) => {
    if (!convId) return;
    try {
      setLoadingMessages(true);
      const res = await fetchMessagesApi(convId, { limit: 100 });
      if (res.success) {
        setMessages(res.data?.messages || []);
        // Mark conversation as read in local list & global counts
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
        );
        refreshUnreadCounts();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
      setTimeout(scrollToBottom, 50);
    }
  }, [refreshUnreadCounts]);

  // Manage conversation room joining and messages fetching
  useEffect(() => {
    if (!activeConversationId) return;

    joinConversation(activeConversationId);
    loadMessages(activeConversationId);

    return () => {
      leaveConversation(activeConversationId);
    };
  }, [activeConversationId, joinConversation, leaveConversation, loadMessages]);

  // Socket event listeners for real-time messages & typing
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      if (newMsg.conversationId === activeConversationIdRef.current) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(scrollToBottom, 50);

        // Acknowledge read if recipient is currently focused on this chat
        markConversationReadApi(newMsg.conversationId).catch(() => {});
      }

      // Update conversations list lastMessage and unreadCount
      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv.id === newMsg.conversationId) {
            const isCurrentActive = conv.id === activeConversationIdRef.current;
            return {
              ...conv,
              lastMessage: newMsg,
              unreadCount: isCurrentActive ? 0 : (conv.unreadCount || 0) + 1,
              updatedAt: newMsg.createdAt,
            };
          }
          return conv;
        });
      });
    };

    const handleMessagesRead = ({ conversationId, readBy }) => {
      if (readBy !== user?.id && conversationId === activeConversationIdRef.current) {
        setMessages((prev) =>
          prev.map((msg) => (msg.senderId === user?.id ? { ...msg, isRead: true } : msg))
        );
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

  // Handle typing input change
  const handleInputChange = (e) => {
    setInputContent(e.target.value);
    if (activeConversationId) {
      sendTyping(activeConversationId, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(activeConversationId, false);
      }, 1500);
    }
  };

  // Send message
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
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.data.id)) return prev;
          return [...prev, res.data];
        });
        setTimeout(scrollToBottom, 50);

        // Update conversation in list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? { ...c, lastMessage: res.data, updatedAt: res.data.createdAt }
              : c
          )
        );
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
    const name = c.otherParticipant?.name || '';
    const farmName = c.otherParticipant?.farmerProfile?.farmName || '';
    const businessName = c.otherParticipant?.buyerProfile?.businessName || '';
    const query = searchQuery.toLowerCase();
    return (
      name.toLowerCase().includes(query) ||
      farmName.toLowerCase().includes(query) ||
      businessName.toLowerCase().includes(query)
    );
  });

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full p-2 sm:p-6 flex-1 flex flex-col">
        {/* Top Header Card */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4 px-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Trade Communications
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Milestone 9 Real-Time
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Direct peer-to-peer negotiation between farmers and buyers
              </p>
            </div>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>{isConnected ? 'Socket Live' : 'Connecting...'}</span>
            </div>

            <button
              onClick={loadConversations}
              title="Refresh Conversations"
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-slate-400 hover:text-white font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Chat Two-Pane Card */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[600px] h-[calc(100vh-220px)]">
          {/* Left Pane: Conversation List */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-slate-800 flex flex-col bg-slate-900/60 ${
              activeConversationId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search Box */}
            <div className="p-3 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search traders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Conversation Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {loadingConversations ? (
                <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                  <span>Loading conversations...</span>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
                  <div className="p-3 bg-slate-800/40 rounded-full text-slate-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-300">No conversations yet</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Start direct negotiations from any produce listing in the Marketplace.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/marketplace')}
                    className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition-colors"
                  >
                    Browse Marketplace
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
                      onClick={() => setActiveConversationId(conv.id)}
                      className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500/10 border-l-4 border-emerald-500'
                          : 'hover:bg-slate-800/40 border-l-4 border-transparent'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-sm uppercase">
                          {other?.name ? other.name.slice(0, 2) : 'U'}
                        </div>
                        {isConnected && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                        )}
                      </div>

                      {/* Info & Last Message */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-white truncate">
                            {other?.name || 'User'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                            {lastMsg?.createdAt ? formatMessageTime(lastMsg.createdAt) : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold uppercase ${
                              other?.role === 'FARMER'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}
                          >
                            {other?.role}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate">
                            {other?.farmerProfile?.farmName ||
                              other?.buyerProfile?.businessName ||
                              'Direct Trader'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <p
                            className={`text-xs truncate ${
                              isUnread ? 'font-bold text-slate-100' : 'text-slate-400'
                            }`}
                          >
                            {lastMsg?.senderId === user?.id && (
                              <span className="text-slate-500 mr-1">You:</span>
                            )}
                            {lastMsg?.content || 'Started conversation'}
                          </p>

                          {isUnread && (
                            <span className="ml-2 px-1.5 py-0.5 bg-emerald-500 text-slate-950 font-bold rounded-full text-[10px] font-mono">
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

          {/* Right Pane: Active Chat Room */}
          <div
            className={`flex-1 flex flex-col bg-slate-950/80 ${
              !activeConversationId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activeConversation ? (
              <>
                {/* Chat Room Header */}
                <div className="p-3.5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Back Button for Mobile */}
                    <button
                      onClick={() => setActiveConversationId(null)}
                      className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    {/* Participant Avatar & Metadata */}
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-sm uppercase flex-shrink-0">
                      {otherUser?.name ? otherUser.name.slice(0, 2) : 'U'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-white">{otherUser?.name}</h2>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold uppercase ${
                            otherUser?.role === 'FARMER'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {otherUser?.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {otherUser?.farmerProfile?.farmName
                          ? `${otherUser.farmerProfile.farmName} (${
                              [otherUser.farmerProfile.district, otherUser.farmerProfile.state]
                                .filter(Boolean)
                                .join(', ') || 'Farm'
                            })`
                          : otherUser?.buyerProfile?.businessName || otherUser?.email}
                      </p>
                    </div>
                  </div>

                  {/* Typing Indicator in Header */}
                  {typingUsers[activeConversationId] && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Typing...</span>
                    </div>
                  )}
                </div>

                {/* Messages Container */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {loadingMessages ? (
                    <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                      <span>Loading message history...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                      <div className="p-3 bg-slate-800/40 rounded-full inline-block text-slate-400">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-300">No messages yet</p>
                      <p className="text-[11px] text-slate-500">
                        Send a message below to start your trade negotiation with {otherUser?.name}.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === user?.id;

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[80%] sm:max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed break-words shadow-md ${
                              isMe
                                ? 'bg-emerald-600 text-white rounded-br-none'
                                : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>

                          {/* Time & Read Status */}
                          <div
                            className={`flex items-center gap-1 mt-1 text-[10px] font-mono text-slate-500 px-1 ${
                              isMe ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span>{formatMessageTime(msg.createdAt)}</span>
                            {isMe && (
                              <span title={msg.isRead ? 'Read' : 'Delivered'}>
                                {msg.isRead ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-slate-500" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Box */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder={`Message ${otherUser?.name || 'trader'}...`}
                    value={inputContent}
                    onChange={handleInputChange}
                    disabled={sendingMessage}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!inputContent.trim() || sendingMessage}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <div className="p-4 bg-slate-800/50 rounded-2xl text-slate-400 mb-3 border border-slate-800">
                  <MessageSquare className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-300">Select a Conversation</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Choose a trade partner from the list to view negotiation history or send real-time
                  messages.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
