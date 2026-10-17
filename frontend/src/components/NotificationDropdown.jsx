import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Handshake,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  Truck,
  PackageCheck,
  MessageSquare,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import {
  fetchNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from '../services/api';

export default function NotificationDropdown() {
  const {
    unreadNotificationsCount,
    setUnreadNotificationsCount,
    recentNotifications,
    setRecentNotifications,
    refreshUnreadCounts,
  } = useSocket();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch full notifications list when opening dropdown
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetchNotificationsApi({ limit: 15 });
      if (res.success) {
        setNotifications(res.data?.notifications || []);
        setUnreadNotificationsCount(res.data?.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await markNotificationReadApi(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark notification read:', err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotificationsCount(0);
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err.message);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    setIsOpen(false);

    // Route based on notification type
    if (notif.type === 'NEW_MESSAGE') {
      navigate('/messages');
    } else if (
      ['NEW_OFFER', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'COUNTER_OFFER'].includes(notif.type)
    ) {
      navigate('/offers');
    } else if (
      ['ORDER_CONFIRMED', 'PAYMENT_SUCCESS', 'ORDER_SHIPPED', 'ORDER_DELIVERED'].includes(
        notif.type
      )
    ) {
      navigate('/orders');
    }
  };

  // Get matching icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_OFFER':
        return <Handshake className="w-4 h-4 text-amber-400" />;
      case 'OFFER_ACCEPTED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'OFFER_REJECTED':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'COUNTER_OFFER':
        return <RefreshCw className="w-4 h-4 text-purple-400" />;
      case 'ORDER_CONFIRMED':
        return <ShoppingBag className="w-4 h-4 text-blue-400" />;
      case 'PAYMENT_SUCCESS':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'ORDER_SHIPPED':
        return <Truck className="w-4 h-4 text-indigo-400" />;
      case 'ORDER_DELIVERED':
        return <PackageCheck className="w-4 h-4 text-emerald-400" />;
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        title="Notifications"
        className="relative p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Notifications
              </span>
              {unreadNotificationsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                  {unreadNotificationsCount} new
                </span>
              )}
            </div>

            {unreadNotificationsCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Loading alerts...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <div className="p-3 bg-slate-800/40 rounded-full text-slate-400">
                  <Bell className="w-5 h-5" />
                </div>
                <span>No notifications yet</span>
                <span className="text-[10px] text-slate-600">
                  Updates on offers, orders, deliveries, and messages will show here.
                </span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 transition-colors flex items-start gap-3 cursor-pointer ${
                    notif.isRead
                      ? 'hover:bg-slate-800/30 opacity-75'
                      : 'bg-emerald-500/5 hover:bg-emerald-500/10 border-l-2 border-emerald-500'
                  }`}
                >
                  <div className="p-2 bg-slate-800 rounded-lg flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-white truncate">{notif.title}</span>
                      <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                      {notif.message}
                    </p>
                  </div>

                  {!notif.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      title="Mark as read"
                      className="text-slate-500 hover:text-emerald-400 p-1 flex-shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
