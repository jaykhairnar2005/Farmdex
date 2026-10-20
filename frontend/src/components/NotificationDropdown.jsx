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
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useTranslation } from 'react-i18next';
import { formatRelativeTime } from '../utils/formatters';
import {
  fetchNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from '../services/api';

export default function NotificationDropdown() {
  const { t } = useTranslation();
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
      ['ORDER_CONFIRMED', 'PAYMENT_SUCCESS', 'ORDER_SHIPPED', 'ORDER_DELIVERED'].includes(notif.type)
    ) {
      navigate('/orders');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_OFFER':
        return <Handshake className="w-4 h-4 text-warning" />;
      case 'OFFER_ACCEPTED':
        return <CheckCircle2 className="w-4 h-4 text-brand-800" />;
      case 'OFFER_REJECTED':
        return <XCircle className="w-4 h-4 text-danger" />;
      case 'COUNTER_OFFER':
        return <RefreshCw className="w-4 h-4 text-purple-600" />;
      case 'ORDER_CONFIRMED':
        return <ShoppingBag className="w-4 h-4 text-info" />;
      case 'PAYMENT_SUCCESS':
        return <CreditCard className="w-4 h-4 text-brand-800" />;
      case 'ORDER_SHIPPED':
        return <Truck className="w-4 h-4 text-indigo-600" />;
      case 'ORDER_DELIVERED':
        return <PackageCheck className="w-4 h-4 text-brand-800" />;
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-4 h-4 text-brand-800" />;
      default:
        return <Bell className="w-4 h-4 text-ink-subtle" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        title={t('modals.notifications.title')}
        className="relative p-2 text-ink-muted hover:text-ink hover:bg-surface-sunken rounded-lg transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-line rounded-xl shadow-modal z-50 overflow-hidden flex flex-col fade-in">
          {/* Header */}
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">{t('modals.notifications.title')}</span>
              {unreadNotificationsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-800 text-[11px] font-semibold">
                  {t('modals.notifications.newBadge', { count: unreadNotificationsCount })}
                </span>
              )}
            </div>

            {unreadNotificationsCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-brand-800 hover:text-brand-800 font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{t('modals.notifications.markAllRead')}</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-line">
            {loading ? (
              <div className="p-8 text-center text-ink-subtle text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-brand-500" />
                <span>{t('modals.notifications.loading')}</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-ink-subtle text-xs flex flex-col items-center gap-2">
                <div className="p-3 bg-surface-muted rounded-full text-ink-subtle">
                  <Bell className="w-5 h-5" />
                </div>
                <span className="font-medium text-ink-muted">{t('modals.notifications.empty')}</span>
                <span className="text-ink-subtle">
                  {t('modals.notifications.emptyDesc')}
                </span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`px-4 py-3 transition-colors flex items-start gap-3 cursor-pointer ${
                    notif.isRead
                      ? 'hover:bg-surface-muted'
                      : 'bg-brand-50/50 hover:bg-brand-50'
                  }`}
                >
                  <div className="p-2 bg-surface-sunken rounded-lg flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-xs font-semibold truncate ${notif.isRead ? 'text-ink' : 'text-ink'}`}>{notif.title}</span>
                      <span className="text-[10px] text-ink-subtle flex-shrink-0 ml-2">
                        {formatRelativeTime(notif.createdAt, t)}
                      </span>
                    </div>

                    <p className="text-[11px] text-ink-muted leading-snug line-clamp-2">
                      {notif.message}
                    </p>
                  </div>

                  {!notif.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      title="Mark as read"
                      className="text-ink-subtle hover:text-brand-800 p-1 flex-shrink-0"
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


