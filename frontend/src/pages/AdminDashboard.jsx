import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Users,
  Sprout,
  ShoppingBag,
  Truck,
  AlertTriangle,
  FileText,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  DollarSign,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import {
  fetchAdminStatsApi,
  fetchAdminUsersApi,
  updateUserStatusApi,
  updateUserVerificationApi,
  fetchAdminListingsApi,
  moderateListingApi,
  fetchAdminOrdersApi,
  updateComplaintApi,
  fetchAdminAuditLogsApi,
  fetchAdminComplaintsApi,
} from '../services/api';
import { getCropImageUrl, handleImageFallback } from '../utils/cropImages';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, listings, orders, complaints, audit
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Real-time Overview Statistics
  const [stats, setStats] = useState(null);

  // Tab 1: Users State
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [userActionLoading, setUserActionLoading] = useState({});

  // Tab 2: Produce Listings State
  const [listings, setListings] = useState([]);
  const [listingsPagination, setListingsPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [listingStatusFilter, setListingStatusFilter] = useState('ALL');
  const [listingSearch, setListingSearch] = useState('');
  const [listingActionLoading, setListingActionLoading] = useState({});

  // Tab 3: Orders & Deliveries State
  const [orders, setOrders] = useState([]);
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderSearch, setOrderSearch] = useState('');

  // Tab 4: Complaints State
  const [complaints, setComplaints] = useState([]);
  const [complaintsPagination, setComplaintsPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('ALL');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintResponseText, setComplaintResponseText] = useState('');
  const [complaintUpdating, setComplaintUpdating] = useState(false);

  // Tab 5: Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });

  // Load Overview Stats
  const loadStats = useCallback(async () => {
    try {
      const res = await fetchAdminStatsApi();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load system metrics');
    }
  }, []);

  // Load Users
  const loadUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await fetchAdminUsersApi({
        page,
        limit: 10,
        role: userRoleFilter,
        search: userSearch,
      });
      if (res.success) {
        setUsers(res.data.users);
        setUsersPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [userRoleFilter, userSearch]);

  // Load Listings
  const loadListings = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await fetchAdminListingsApi({
        page,
        limit: 10,
        status: listingStatusFilter,
        search: listingSearch,
      });
      if (res.success) {
        setListings(res.data.listings);
        setListingsPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [listingStatusFilter, listingSearch]);

  // Load Orders
  const loadOrders = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await fetchAdminOrdersApi({
        page,
        limit: 10,
        status: orderStatusFilter,
        search: orderSearch,
      });
      if (res.success) {
        setOrders(res.data.orders);
        setOrdersPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [orderStatusFilter, orderSearch]);

  // Load Complaints
  const loadComplaints = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await fetchAdminComplaintsApi({
        page,
        limit: 10,
        status: complaintStatusFilter,
      });
      if (res.success) {
        setComplaints(res.data.complaints);
        setComplaintsPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [complaintStatusFilter]);

  // Load Audit Logs
  const loadAuditLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await fetchAdminAuditLogsApi({ page, limit: 15 });
      if (res.success) {
        setAuditLogs(res.data.logs);
        setAuditPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadStats().finally(() => setLoading(false));
  }, [loadStats]);

  // Tab switch effect
  useEffect(() => {
    setError(null);
    if (activeTab === 'users') loadUsers(1);
    if (activeTab === 'listings') loadListings(1);
    if (activeTab === 'orders') loadOrders(1);
    if (activeTab === 'complaints') loadComplaints(1);
    if (activeTab === 'audit') loadAuditLogs(1);
    if (activeTab === 'overview') loadStats();
  }, [activeTab, loadUsers, loadListings, loadOrders, loadComplaints, loadAuditLogs, loadStats]);

  // Auto-dismiss success notification
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Handle User Status Toggle
  const handleToggleUserStatus = async (user) => {
    const nextState = !user.isActive;
    const confirmMsg = nextState
      ? `Reactivate account for ${user.email}?`
      : `Deactivate account for ${user.email}? They will immediately lose access.`;
    if (!window.confirm(confirmMsg)) return;

    setUserActionLoading((prev) => ({ ...prev, [user.id]: true }));
    setError(null);
    try {
      const res = await updateUserStatusApi(user.id, {
        isActive: nextState,
        reason: 'Administrative dashboard action',
      });
      if (res.success) {
        setSuccessMsg(res.message);
        loadUsers(usersPagination.page);
        loadStats();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setUserActionLoading((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  // Handle User Verification Toggle
  const handleToggleUserVerification = async (user) => {
    const nextState = !user.isVerified;
    setUserActionLoading((prev) => ({ ...prev, [user.id]: true }));
    setError(null);
    try {
      const res = await updateUserVerificationApi(user.id, { isVerified: nextState });
      if (res.success) {
        setSuccessMsg(res.message);
        loadUsers(usersPagination.page);
        loadStats();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setUserActionLoading((prev) => ({ ...prev, [user.id]: false }));
    }
  };

  // Handle Listing Moderation (Suspend / Activate)
  const handleModerateListing = async (listing, targetStatus) => {
    const actionLabel = targetStatus === 'SUSPENDED' ? 'SUSPEND' : 'ACTIVATE';
    if (!window.confirm(`Are you sure you want to ${actionLabel} produce listing "${listing.cropName}"?`)) return;

    setListingActionLoading((prev) => ({ ...prev, [listing.id]: true }));
    setError(null);
    try {
      const res = await moderateListingApi(listing.id, {
        status: targetStatus,
        reason: `Administrative ${actionLabel.toLowerCase()} action`,
      });
      if (res.success) {
        setSuccessMsg(res.message);
        loadListings(listingsPagination.page);
        loadStats();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setListingActionLoading((prev) => ({ ...prev, [listing.id]: false }));
    }
  };

  // Handle Complaint Resolution
  const handleResolveComplaint = async (targetStatus) => {
    if (!selectedComplaint) return;
    if (!complaintResponseText || complaintResponseText.trim().length < 3) {
      setError('Please provide an official admin response (at least 3 characters)');
      return;
    }

    setComplaintUpdating(true);
    setError(null);
    try {
      const res = await updateComplaintApi(selectedComplaint.id, {
        status: targetStatus,
        adminResponse: complaintResponseText.trim(),
      });
      if (res.success) {
        setSuccessMsg(res.message);
        setSelectedComplaint(null);
        setComplaintResponseText('');
        loadComplaints(complaintsPagination.page);
        loadStats();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setComplaintUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 fade-in">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-brand-50 border border-brand-100 rounded-xl text-brand-800">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-ink">{t('admin.title')}</h1>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-800 border border-brand-200 uppercase">
                  FarmDex Ops
                </span>
              </div>
              <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
                {t('admin.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadStats();
                if (activeTab === 'users') loadUsers(usersPagination.page);
                if (activeTab === 'listings') loadListings(listingsPagination.page);
                if (activeTab === 'orders') loadOrders(ordersPagination.page);
                if (activeTab === 'complaints') loadComplaints(complaintsPagination.page);
                if (activeTab === 'audit') loadAuditLogs(auditPagination.page);
              }}
              className="px-3.5 py-2 bg-surface border border-line hover:bg-surface-muted text-ink rounded-lg shadow-card transition-colors cursor-pointer flex items-center gap-2 text-xs font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('common.refresh')}</span>
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="p-4 rounded-xl bg-danger-soft border border-danger-edge text-danger text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-danger" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-danger hover:text-red-800 font-bold">
              &times;
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-brand-50 border border-brand-200 text-brand-800 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-brand-600" />
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-line">
          {[
            { id: 'overview', label: t('admin.tabs.overview'), icon: DollarSign },
            { id: 'users', label: t('admin.tabs.users'), icon: Users, badge: stats?.users?.total },
            { id: 'listings', label: t('admin.tabs.listings'), icon: Sprout, badge: stats?.listings?.suspended },
            { id: 'orders', label: t('admin.tabs.orders'), icon: ShoppingBag, badge: stats?.orders?.total },
            { id: 'complaints', label: t('admin.tabs.disputes'), icon: AlertTriangle, badge: stats?.complaints?.open },
            { id: 'audit', label: t('admin.tabs.audit'), icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-brand-800 text-white shadow-card'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-sunken border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      isSelected
                        ? 'bg-surface/20 text-white'
                        : tab.id === 'complaints' && tab.badge > 0
                        ? 'bg-red-100 text-danger'
                        : 'bg-surface-sunken text-ink'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: PLATFORM OVERVIEW */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Top KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-surface border border-line shadow-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{t('admin.stats.activeUsers')}</span>
                  <div className="p-2 bg-info-soft text-info rounded-lg">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-ink font-mono">{formatNumber(stats.users.total, i18n.language)}</div>
                <div className="flex items-center gap-3 text-xs text-ink-muted">
                  <span className="text-brand-800 font-medium">{formatNumber(stats.users.farmers, i18n.language)} {t('auth.roleFarmer')}</span>
                  <span>&bull;</span>
                  <span className="text-info font-medium">{formatNumber(stats.users.buyers, i18n.language)} {t('auth.roleBuyer')}</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-surface border border-line shadow-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{t('admin.stats.totalGmv')}</span>
                  <div className="p-2 bg-brand-50 text-brand-800 rounded-lg">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-brand-800 font-mono">
                  {formatCurrency(stats.payments.totalSettledRevenue || 0, i18n.language)}
                </div>
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <span>{formatNumber(stats.payments.success, i18n.language)} {t('status.confirmed')}</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-surface border border-line shadow-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Marketplace Produce</span>
                  <div className="p-2 bg-warning-soft text-warning rounded-lg">
                    <Sprout className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-ink font-mono">{stats.listings.total}</div>
                <div className="flex items-center gap-3 text-xs text-ink-muted">
                  <span className="text-brand-800 font-medium">{stats.listings.active} Active</span>
                  <span>&bull;</span>
                  <span className="text-danger font-medium">{stats.listings.suspended} Suspended</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-surface border border-line shadow-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Open Disputes</span>
                  <div className="p-2 bg-danger-soft text-danger rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-danger font-mono">{stats.complaints.open}</div>
                <div className="flex items-center gap-2 text-xs text-ink-muted">
                  <span>{stats.complaints.resolved} resolved cases</span>
                </div>
              </div>
            </div>

            {/* Quick Status Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Order Fulfillment Breakdown */}
              <div className="p-5 rounded-xl bg-surface border border-line space-y-4 shadow-card">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-brand-800" /> Order Fulfillment Pipeline
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded-lg bg-surface-muted border border-line">
                    <span className="text-ink-muted">Pending Orders</span>
                    <span className="text-warning font-bold font-mono">{stats.orders.pending}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-surface-muted border border-line">
                    <span className="text-ink-muted">Dispatched / In-Transit</span>
                    <span className="text-info font-bold font-mono">{stats.orders.shipped}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-surface-muted border border-line">
                    <span className="text-ink-muted">Delivered Orders</span>
                    <span className="text-brand-800 font-bold font-mono">{stats.orders.delivered}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-surface-muted border border-line">
                    <span className="text-ink-muted">Cancelled Orders</span>
                    <span className="text-ink-muted font-bold font-mono">{stats.orders.cancelled}</span>
                  </div>
                </div>
              </div>

              {/* Consignment Delivery Breakdown */}
              <div className="p-5 rounded-xl bg-surface border border-line space-y-4 shadow-card">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Truck className="w-4 h-4 text-info" /> Logistics &amp; Shipping
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded-lg bg-surface-muted border border-line">
                    <span className="text-ink-muted">Active Shipments</span>
                    <span className="text-info font-bold font-mono">{stats.deliveries.inTransit}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-surface-muted border border-line">
                    <span className="text-ink-muted">Completed Deliveries</span>
                    <span className="text-brand-800 font-bold font-mono">{stats.deliveries.delivered}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-surface-muted border border-line">
                    <span className="text-ink-muted">Total Waybills Issued</span>
                    <span className="text-ink font-bold font-mono">{stats.deliveries.total}</span>
                  </div>
                </div>
              </div>

              {/* User Account Integrity */}
              <div className="p-5 rounded-xl bg-surface border border-line space-y-4 shadow-card">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-brand-800" /> User Verification &amp; Security
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded-lg bg-surface-muted border border-line">
                    <span className="text-ink-muted">Active Users</span>
                    <span className="text-brand-800 font-bold font-mono">{stats.users.active}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-surface-muted border border-line">
                    <span className="text-ink-muted">Verified Profiles</span>
                    <span className="text-info font-bold font-mono">{stats.users.verified}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-surface-muted border border-line">
                    <span className="text-ink-muted">Suspended / Inactive</span>
                    <span className="text-danger font-bold font-mono">{stats.users.inactive}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders Snapshot */}
            <div className="p-5 rounded-xl bg-surface border border-line space-y-4 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-brand-800" /> Recent Platform Orders
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-brand-800 hover:text-brand-800 font-medium flex items-center gap-1 cursor-pointer"
                >
                  {t('common.viewAll')} <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line text-ink-muted uppercase text-[11px] font-semibold">
                      <th className="pb-3">{t('orders.title')}</th>
                      <th className="pb-3">{t('orders.card.buyer')}</th>
                      <th className="pb-3">{t('orders.card.farmer')}</th>
                      <th className="pb-3">{t('common.amount')}</th>
                      <th className="pb-3">{t('orders.card.payment')}</th>
                      <th className="pb-3">{t('orders.card.delivery')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {stats.recent.orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-surface-muted/70">
                        <td className="py-2.5 font-mono text-brand-800 font-bold">#{ord.id.slice(0, 8)}</td>
                        <td className="py-2.5 text-ink">{ord.buyer?.name}</td>
                        <td className="py-2.5 text-ink">{ord.farmer?.name}</td>
                        <td className="py-2.5 text-brand-800 font-bold font-mono">{formatCurrency(ord.totalAmount, i18n.language)}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              ord.payment?.status === 'SUCCESS'
                                ? 'bg-success-soft text-success border border-success-edge'
                                : 'bg-warning-soft text-warning border border-warning-edge'
                            }`}
                          >
                            {ord.payment?.status || 'PENDING'}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-info-soft text-info border border-blue-200">
                            {ord.delivery?.status || 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER GOVERNANCE */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface border border-line rounded-xl shadow-card">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-ink-subtle absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadUsers(1)}
                  className="w-full pl-9 pr-4 py-2 bg-surface-muted border border-line rounded-lg text-xs placeholder:text-ink-subtle focus:bg-surface focus:outline-none focus:border-brand-500 transition-colors text-ink"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-ink-subtle" />
                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                  }}
                  className="px-3 py-2 bg-surface border border-line rounded-lg text-xs font-medium text-ink focus:outline-none focus:border-brand-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="FARMER">Farmers</option>
                  <option value="BUYER">Buyers</option>
                  <option value="ADMIN">Admins</option>
                </select>

                <button
                  onClick={() => loadUsers(1)}
                  className="px-3.5 py-2 bg-brand-800 hover:bg-brand-800 text-white text-xs font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="p-4 sm:p-5 rounded-xl bg-surface border border-line shadow-card space-y-4">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>
                  Showing <strong className="text-ink">{users.length}</strong> of{' '}
                  <strong className="text-ink">{usersPagination.totalCount}</strong> users
                </span>
                <span>Page {usersPagination.page} of {usersPagination.totalPages}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line text-ink-muted uppercase text-[11px] font-semibold">
                      <th className="pb-3">User / Identity</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Profile Metadata</th>
                      <th className="pb-3">Verification</th>
                      <th className="pb-3">Account Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {users.map((usr) => (
                      <tr key={usr.id} className="hover:bg-surface-muted/70">
                        <td className="py-3">
                          <div className="font-bold text-ink">{usr.name}</div>
                          <div className="text-[11px] text-ink-muted">{usr.email}</div>
                          {usr.phone && <div className="text-[10px] text-ink-subtle font-mono">{usr.phone}</div>}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              usr.role === 'ADMIN'
                                ? 'bg-warning-soft text-warning border border-warning-edge'
                                : usr.role === 'FARMER'
                                ? 'bg-success-soft text-success border border-success-edge'
                                : 'bg-info-soft text-info border border-blue-200'
                            }`}
                          >
                            {usr.role}
                          </span>
                        </td>
                        <td className="py-3 text-ink-muted text-[11px]">
                          {usr.farmerProfile && (
                            <div>
                              <span className="font-medium text-ink">{usr.farmerProfile.farmName || 'Unnamed Farm'}</span>
                              <span className="text-ink-subtle block">
                                {usr.farmerProfile.district ? `${usr.farmerProfile.district}, ${usr.farmerProfile.state}` : 'Location unconfigured'}
                              </span>
                            </div>
                          )}
                          {usr.buyerProfile && (
                            <div>
                              <span className="font-medium text-ink">{usr.buyerProfile.businessName || 'Independent Buyer'}</span>
                              <span className="text-ink-subtle block">{usr.buyerProfile.businessType || 'Retail'}</span>
                            </div>
                          )}
                          {!usr.farmerProfile && !usr.buyerProfile && <span className="text-ink-subtle">No profile extension</span>}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => handleToggleUserVerification(usr)}
                            disabled={userActionLoading[usr.id]}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-colors ${
                              usr.isVerified
                                ? 'bg-info-soft text-info border border-blue-200 hover:bg-blue-100'
                                : 'bg-surface-sunken text-ink-muted hover:bg-surface-muted'
                            }`}
                          >
                            {usr.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                          </button>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              usr.isActive
                                ? 'bg-success-soft text-success border border-success-edge'
                                : 'bg-danger-soft text-danger border border-danger-edge'
                            }`}
                          >
                            {usr.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleToggleUserStatus(usr)}
                            disabled={userActionLoading[usr.id]}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                              usr.isActive
                                ? 'bg-danger-soft text-danger border border-danger-edge hover:bg-red-100'
                                : 'bg-success-soft text-success border border-success-edge hover:bg-emerald-100'
                            }`}
                          >
                            {usr.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-3 border-t border-line">
                <button
                  disabled={usersPagination.page <= 1}
                  onClick={() => loadUsers(usersPagination.page - 1)}
                  className="px-3 py-1.5 bg-surface border border-line hover:bg-surface-muted rounded-lg text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <span className="text-xs text-ink-muted">
                  {usersPagination.page} / {usersPagination.totalPages}
                </span>
                <button
                  disabled={usersPagination.page >= usersPagination.totalPages}
                  onClick={() => loadUsers(usersPagination.page + 1)}
                  className="px-3 py-1.5 bg-surface border border-line hover:bg-surface-muted rounded-lg text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCE LISTINGS MODERATION */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface border border-line rounded-xl shadow-card">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-ink-subtle absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search listings by crop name or location..."
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadListings(1)}
                  className="w-full pl-9 pr-4 py-2 bg-surface-muted border border-line rounded-lg text-xs placeholder:text-ink-subtle focus:bg-surface focus:outline-none focus:border-brand-500 transition-colors text-ink"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-ink-subtle" />
                <select
                  value={listingStatusFilter}
                  onChange={(e) => setListingStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-surface border border-line rounded-lg text-xs font-medium text-ink focus:outline-none focus:border-brand-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="SOLD_OUT">SOLD_OUT</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>

                <button
                  onClick={() => loadListings(1)}
                  className="px-3.5 py-2 bg-brand-800 hover:bg-brand-800 text-white text-xs font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Listings Table */}
            <div className="p-4 sm:p-5 rounded-xl bg-surface border border-line shadow-card space-y-4">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>
                  Showing <strong className="text-ink">{listings.length}</strong> of{' '}
                  <strong className="text-ink">{listingsPagination.totalCount}</strong> listings
                </span>
                <span>Page {listingsPagination.page} of {listingsPagination.totalPages}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line text-ink-muted uppercase text-[11px] font-semibold">
                      <th className="pb-3">Produce Item</th>
                      <th className="pb-3">Farmer</th>
                      <th className="pb-3">Quantity &amp; Price</th>
                      <th className="pb-3">Location</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Moderation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {listings.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-muted/70">
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-surface-sunken border border-line overflow-hidden shrink-0">
                              <img
                                src={getCropImageUrl(item.cropName, item.category?.name, item.productImages?.[0]?.imageUrl)}
                                alt={item.cropName}
                                onError={(e) => handleImageFallback(e, item.cropName, item.category?.name)}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-ink">{item.cropName}</div>
                              <span className="text-[10px] text-ink-muted">{item.category?.name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-ink">
                          <div>{item.farmerProfile?.user?.name}</div>
                          <div className="text-[10px] text-ink-subtle">{item.farmerProfile?.user?.email}</div>
                        </td>
                        <td className="py-3">
                          <div className="text-ink">
                            {formatNumber(item.quantity, i18n.language)} {item.unit}
                          </div>
                          <div className="text-brand-800 font-bold font-mono">{formatCurrency(item.pricePerUnit, i18n.language)}/{item.unit}</div>
                        </td>
                        <td className="py-3 text-ink-muted text-[11px]">{item.location || 'Not provided'}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === 'ACTIVE'
                                ? 'bg-success-soft text-success border border-success-edge'
                                : item.status === 'SUSPENDED'
                                ? 'bg-danger-soft text-danger border border-danger-edge'
                                : 'bg-surface-sunken text-ink-muted'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {item.status === 'SUSPENDED' ? (
                            <button
                              onClick={() => handleModerateListing(item, 'ACTIVE')}
                              disabled={listingActionLoading[item.id]}
                              className="px-2.5 py-1 bg-success-soft hover:bg-emerald-100 text-success border border-success-edge rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Reinstate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleModerateListing(item, 'SUSPENDED')}
                              disabled={listingActionLoading[item.id]}
                              className="px-2.5 py-1 bg-danger-soft hover:bg-red-100 text-danger border border-danger-edge rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Suspend
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-3 border-t border-line">
                <button
                  disabled={listingsPagination.page <= 1}
                  onClick={() => loadListings(listingsPagination.page - 1)}
                  className="px-3 py-1.5 bg-surface border border-line hover:bg-surface-muted rounded-lg text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <span className="text-xs text-ink-muted">
                  {listingsPagination.page} / {listingsPagination.totalPages}
                </span>
                <button
                  disabled={listingsPagination.page >= listingsPagination.totalPages}
                  onClick={() => loadListings(listingsPagination.page + 1)}
                  className="px-3 py-1.5 bg-surface border border-line hover:bg-surface-muted rounded-lg text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ORDERS & FULFILLMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface border border-line rounded-xl shadow-card">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-ink-subtle absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search orders by ID, buyer or farmer name/email..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadOrders(1)}
                  className="w-full pl-9 pr-4 py-2 bg-surface-muted border border-line rounded-lg text-xs placeholder:text-ink-subtle focus:bg-surface focus:outline-none focus:border-brand-500 transition-colors text-ink"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-ink-subtle" />
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-surface border border-line rounded-lg text-xs font-medium text-ink focus:outline-none focus:border-brand-500"
                >
                  <option value="ALL">All Order Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>

                <button
                  onClick={() => loadOrders(1)}
                  className="px-3.5 py-2 bg-brand-800 hover:bg-brand-800 text-white text-xs font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="p-4 sm:p-5 rounded-xl bg-surface border border-line shadow-card space-y-4">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span>
                  Showing <strong className="text-ink">{orders.length}</strong> of{' '}
                  <strong className="text-ink">{ordersPagination.totalCount}</strong> orders
                </span>
                <span>Page {ordersPagination.page} of {ordersPagination.totalPages}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line text-ink-muted uppercase text-[11px] font-semibold">
                      <th className="pb-3">Order Reference</th>
                      <th className="pb-3">Buyer</th>
                      <th className="pb-3">Farmer</th>
                      <th className="pb-3">Items Snapshot</th>
                      <th className="pb-3">Total Amount</th>
                      <th className="pb-3">Payment</th>
                      <th className="pb-3">Consignment Tracking</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-surface-muted/70">
                        <td className="py-3">
                          <div className="font-bold text-brand-800 font-mono">#{ord.id.slice(0, 8)}</div>
                          <div className="text-[10px] text-ink-subtle">
                            {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-ink font-medium">{ord.buyer?.name}</div>
                          <div className="text-[10px] text-ink-subtle">{ord.buyer?.email}</div>
                        </td>
                        <td className="py-3">
                          <div className="text-ink font-medium">{ord.farmer?.name}</div>
                          <div className="text-[10px] text-ink-subtle">{ord.farmer?.email}</div>
                        </td>
                        <td className="py-3 text-ink-muted">
                          {ord.orderItems?.map((it) => (
                            <div key={it.id}>
                              {it.listing?.cropName}: {Number(it.quantity)} {it.listing?.unit}
                            </div>
                          ))}
                        </td>
                        <td className="py-3 font-bold text-brand-800 font-mono">
                          {formatCurrency(ord.totalAmount, i18n.language)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              ord.payment?.status === 'SUCCESS'
                                ? 'bg-success-soft text-success border border-success-edge'
                                : 'bg-warning-soft text-warning border border-warning-edge'
                            }`}
                          >
                            {ord.payment?.status || 'PENDING'}
                          </span>
                        </td>
                        <td className="py-3">
                          {ord.delivery?.trackingNumber ? (
                            <div>
                              <span className="text-[11px] font-bold font-mono text-brand-800 block">
                                {ord.delivery.trackingNumber}
                              </span>
                              <span className="text-[10px] text-ink-muted uppercase">{ord.delivery.status}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-ink-subtle italic">Not dispatched</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-3 border-t border-line">
                <button
                  disabled={ordersPagination.page <= 1}
                  onClick={() => loadOrders(ordersPagination.page - 1)}
                  className="px-3 py-1.5 bg-surface border border-line hover:bg-surface-muted rounded-lg text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <span className="text-xs text-ink-muted">
                  {ordersPagination.page} / {ordersPagination.totalPages}
                </span>
                <button
                  disabled={ordersPagination.page >= ordersPagination.totalPages}
                  onClick={() => loadOrders(ordersPagination.page + 1)}
                  className="px-3 py-1.5 bg-surface border border-line hover:bg-surface-muted rounded-lg text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: COMPLAINTS & DISPUTES */}
        {activeTab === 'complaints' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface border border-line rounded-xl shadow-card">
              <div className="text-xs text-ink-muted">
                Review user disputes, buyer claims, and marketplace complaints
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-ink-subtle" />
                <select
                  value={complaintStatusFilter}
                  onChange={(e) => setComplaintStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-surface border border-line rounded-lg text-xs font-medium text-ink focus:outline-none focus:border-brand-500"
                >
                  <option value="ALL">All Complaint Statuses</option>
                  <option value="OPEN">OPEN</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="DISMISSED">DISMISSED</option>
                </select>

                <button
                  onClick={() => loadComplaints(1)}
                  className="px-3.5 py-2 bg-brand-800 hover:bg-brand-800 text-white text-xs font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Complaints List */}
            <div className="grid grid-cols-1 gap-4">
              {complaints.length === 0 ? (
                <div className="p-12 text-center bg-surface border border-line rounded-xl text-ink-muted text-sm shadow-card">
                  No disputes or complaints found matching the selected filter.
                </div>
              ) : (
                complaints.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-5 rounded-xl bg-surface border border-line shadow-card space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink">Dispute #{comp.id.slice(0, 8)}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            comp.status === 'OPEN'
                              ? 'bg-danger-soft text-danger border border-danger-edge'
                              : comp.status === 'UNDER_REVIEW'
                              ? 'bg-warning-soft text-warning border border-warning-edge'
                              : comp.status === 'RESOLVED'
                              ? 'bg-success-soft text-success border border-success-edge'
                              : 'bg-surface-sunken text-ink-muted'
                          }`}
                        >
                          {comp.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-ink-subtle">
                        Filed: {new Date(comp.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                      <div>
                        <span className="text-ink-muted block uppercase font-semibold">Reported By</span>
                        <span className="text-ink font-bold">{comp.reportedBy?.name}</span>{' '}
                        <span className="text-ink-muted">({comp.reportedBy?.email})</span>
                      </div>
                      <div>
                        <span className="text-ink-muted block uppercase font-semibold">Target Reference</span>
                        {comp.listing && (
                          <span className="text-brand-800 font-medium">Produce Listing: {comp.listing.cropName}</span>
                        )}
                        {comp.order && (
                          <span className="text-info font-medium font-mono">Order Reference: #{comp.order.id.slice(0, 8)}</span>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-surface-muted border border-line">
                      <div className="font-semibold text-danger text-xs mb-1">Reason: {comp.reason}</div>
                      <div className="text-ink text-xs leading-relaxed">{comp.description}</div>
                    </div>

                    {comp.adminResponse && (
                      <div className="p-3.5 rounded-lg bg-brand-50 border border-brand-200 text-xs">
                        <span className="text-brand-800 font-bold block mb-1">Official Resolution Response:</span>
                        <p className="text-ink leading-relaxed">{comp.adminResponse}</p>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedComplaint(comp);
                          setComplaintResponseText(comp.adminResponse || '');
                        }}
                        className="px-3.5 py-1.5 bg-brand-800 hover:bg-brand-800 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Manage Resolution</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="p-4 sm:p-5 rounded-xl bg-surface border border-line shadow-card space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-800" /> Platform Security &amp; Audit Trail
              </h3>
              <span className="text-ink-subtle font-mono text-[11px]">Immutable Ledger</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-line text-ink-muted uppercase text-[11px] font-semibold">
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Administrator</th>
                    <th className="pb-3">Action Event</th>
                    <th className="pb-3">Target Entity</th>
                    <th className="pb-3">Details / Payload</th>
                    <th className="pb-3">Source IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-mono">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-muted/70">
                      <td className="py-2.5 text-ink-muted text-[11px]">
                        {new Date(log.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 text-ink font-bold">{log.adminEmail}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-50 text-brand-800 border border-brand-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 text-ink-muted">
                        {log.targetType} {log.targetId ? `(${log.targetId.slice(0, 8)}...)` : ''}
                      </td>
                      <td className="py-2.5 text-ink-muted max-w-xs truncate text-[11px]">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                      </td>
                      <td className="py-2.5 text-ink-subtle text-[10px]">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-3 border-t border-line">
              <button
                disabled={auditPagination.page <= 1}
                onClick={() => loadAuditLogs(auditPagination.page - 1)}
                className="px-3 py-1.5 bg-surface border border-line hover:bg-surface-muted rounded-lg text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="text-xs text-ink-muted">
                {auditPagination.page} / {auditPagination.totalPages}
              </span>
              <button
                disabled={auditPagination.page >= auditPagination.totalPages}
                onClick={() => loadAuditLogs(auditPagination.page + 1)}
                className="px-3 py-1.5 bg-surface border border-line hover:bg-surface-muted rounded-lg text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Complaint Resolution Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-surface border border-line rounded-2xl p-6 space-y-4 shadow-modal">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-bold text-ink text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Resolve Dispute #{selectedComplaint.id.slice(0, 8)}
              </h3>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-ink-subtle hover:text-ink-muted text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-3.5 bg-surface-muted rounded-xl border border-line text-xs space-y-1">
              <div className="text-ink">
                <strong>Complainant:</strong> {selectedComplaint.reportedBy?.name}
              </div>
              <div className="text-danger">
                <strong>Reason:</strong> {selectedComplaint.reason}
              </div>
              <p className="text-ink-muted text-xs mt-2 leading-relaxed">{selectedComplaint.description}</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-ink">
                Official Administrative Response
              </label>
              <textarea
                rows={4}
                value={complaintResponseText}
                onChange={(e) => setComplaintResponseText(e.target.value)}
                placeholder="Enter investigation findings, corrective actions taken, and formal resolution text..."
                className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-line">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="w-full sm:w-auto px-4 py-2 bg-surface hover:bg-surface-muted text-ink border border-line text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={complaintUpdating}
                onClick={() => handleResolveComplaint('UNDER_REVIEW')}
                className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-card"
              >
                Mark Under Review
              </button>
              <button
                disabled={complaintUpdating}
                onClick={() => handleResolveComplaint('DISMISSED')}
                className="w-full sm:w-auto px-4 py-2 bg-surface hover:bg-surface-muted text-ink border border-line text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-card"
              >
                Dismiss
              </button>
              <button
                disabled={complaintUpdating}
                onClick={() => handleResolveComplaint('RESOLVED')}
                className="w-full sm:w-auto px-4 py-2 bg-brand-800 hover:bg-brand-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-card"
              >
                Resolve Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

