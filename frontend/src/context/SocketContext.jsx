import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { fetchNotificationsApi, fetchConversationsApi } from '../services/api';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token, isAuthenticated } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const socketRef = useRef(null);

  // Refresh counts from REST API
  const refreshUnreadCounts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [notifRes, convRes] = await Promise.allSettled([
        fetchNotificationsApi({ limit: 5 }),
        fetchConversationsApi(),
      ]);

      if (notifRes.status === 'fulfilled' && notifRes.value?.success) {
        setUnreadNotificationsCount(notifRes.value.data?.unreadCount || 0);
        setRecentNotifications(notifRes.value.data?.notifications || []);
      }

      if (convRes.status === 'fulfilled' && convRes.value?.success) {
        const totalUnreadMsgs = (convRes.value.data || []).reduce(
          (sum, c) => sum + (c.unreadCount || 0),
          0
        );
        setUnreadMessagesCount(totalUnreadMsgs);
      }
    } catch (err) {
      console.warn('[SocketContext] Error refreshing counts:', err.message);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
      setUnreadNotificationsCount(0);
      setUnreadMessagesCount(0);
      return;
    }

    // Determine backend socket URL
    const socketUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    const s = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    s.on('connect', () => {
      setIsConnected(true);
      refreshUnreadCounts();
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('connect_error', (err) => {
      console.warn('[SocketContext] Connection error:', err.message);
      setIsConnected(false);
    });

    // Real-time notification handler
    s.on('notification:new', (notification) => {
      setRecentNotifications((prev) => [notification, ...prev.slice(0, 9)]);
      setUnreadNotificationsCount((prev) => prev + 1);
    });

    s.on('notification:unread_count', ({ unreadCount }) => {
      setUnreadNotificationsCount(unreadCount);
    });

    // Real-time message received handler
    s.on('message:received', () => {
      setUnreadMessagesCount((prev) => prev + 1);
    });

    socketRef.current = s;
    setSocket(s);

    // Initial count fetch
    refreshUnreadCounts();

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, refreshUnreadCounts]);

  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('conversation:join', { conversationId });
    }
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('conversation:leave', { conversationId });
    }
  }, []);

  const sendTyping = useCallback((conversationId, isTyping) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId });
    }
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        unreadNotificationsCount,
        unreadMessagesCount,
        recentNotifications,
        refreshUnreadCounts,
        setUnreadNotificationsCount,
        setUnreadMessagesCount,
        setRecentNotifications,
        joinConversation,
        leaveConversation,
        sendTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
