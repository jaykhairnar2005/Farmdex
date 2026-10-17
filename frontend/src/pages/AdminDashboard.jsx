import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Users,
  Sprout,
  ShoppingBag,
  CreditCard,
  Truck,
  AlertTriangle,
  FileText,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Eye,
  Send,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import {
  fetchAdminStatsApi,
  fetchAdminUsersApi,
  updateUserStatusApi,
  updateUserVerificationApi,
  fetchAdminListingsApi,
  moderateListingApi,
  fetchAdminOrdersApi,
  fetchAdminPaymentsApi,
  fetchAdminDeliveriesApi,
  fetchAdminComplaintsApi,
  updateComplaintApi,
  fetchAdminAuditLogsApi,
} from '../services/api';

export default function AdminDashboard() {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-white">FarmDex Administration</h1>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold uppercase">
                  Production Ops
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Platform Governance, Produce Moderation, Dispute Resolution &amp; Auditing
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
              className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
              &times;
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800/80">
          {[
            { id: 'overview', label: 'Platform Overview', icon: DollarSign },
            { id: 'users', label: 'User Governance', icon: Users, badge: stats?.users?.total },
            { id: 'listings', label: 'Produce Moderation', icon: Sprout, badge: stats?.listings?.suspended },
            { id: 'orders', label: 'Orders & Fulfillment', icon: ShoppingBag, badge: stats?.orders?.total },
            { id: 'complaints', label: 'Disputes & Complaints', icon: AlertTriangle, badge: stats?.complaints?.open },
            { id: 'audit', label: 'Security Audit Logs', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-950/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      tab.id === 'complaints' && tab.badge > 0
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-300'
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
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Users</span>
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white font-mono">{stats.users.total}</div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="text-emerald-400 font-mono">{stats.users.farmers} Farmers</span>
                  <span>&bull;</span>
                  <span className="text-blue-400 font-mono">{stats.users.buyers} Buyers</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Settled Revenue</span>
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-400 font-mono">
                  ₹{Number(stats.payments.totalSettledRevenue || 0).toLocaleString('en-IN')}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-slate-300 font-mono">{stats.payments.success} settled transactions</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Marketplace Produce</span>
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                    <Sprout className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white font-mono">{stats.listings.total}</div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="text-emerald-400 font-mono">{stats.listings.active} Active</span>
                  <span>&bull;</span>
                  <span className="text-rose-400 font-mono">{stats.listings.suspended} Suspended</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Open Disputes</span>
                  <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-rose-400 font-mono">{stats.complaints.open}</div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-slate-300 font-mono">{stats.complaints.resolved} resolved cases</span>
                </div>
              </div>
            </div>

            {/* Quick Status Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Order Fulfillment Breakdown */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" /> Order Fulfillment Pipeline
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400">Pending Orders</span>
                    <span className="text-amber-400 font-bold">{stats.orders.pending}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400">Dispatched / In-Transit</span>
                    <span className="text-blue-400 font-bold">{stats.orders.shipped}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400">Delivered Orders</span>
                    <span className="text-emerald-400 font-bold">{stats.orders.delivered}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400">Cancelled Orders</span>
                    <span className="text-slate-500 font-bold">{stats.orders.cancelled}</span>
                  </div>
                </div>
              </div>

              {/* Consignment Delivery Breakdown */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-400" /> Logistics &amp; Shipping
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400">Active Shipments</span>
                    <span className="text-blue-400 font-bold">{stats.deliveries.inTransit}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400">Completed Deliveries</span>
                    <span className="text-emerald-400 font-bold">{stats.deliveries.delivered}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400">Total Waybills Issued</span>
                    <span className="text-slate-300 font-bold">{stats.deliveries.total}</span>
                  </div>
                </div>
              </div>

              {/* User Account Integrity */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-400" /> User Verification &amp; Security
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400">Active Users</span>
                    <span className="text-emerald-400 font-bold">{stats.users.active}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400">Verified Profiles</span>
                    <span className="text-blue-400 font-bold">{stats.users.verified}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400">Suspended / Inactive</span>
                    <span className="text-rose-400 font-bold">{stats.users.inactive}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders Snapshot */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" /> Recent Platform Orders
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                >
                  View All Orders <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase">
                      <th className="pb-3 font-medium">Order ID</th>
                      <th className="pb-3 font-medium">Buyer</th>
                      <th className="pb-3 font-medium">Farmer</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Payment</th>
                      <th className="pb-3 font-medium">Delivery</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {stats.recent.orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-950/40">
                        <td className="py-2.5 text-slate-300 font-bold">{ord.id.slice(0, 8)}...</td>
                        <td className="py-2.5 text-slate-300">{ord.buyer?.name}</td>
                        <td className="py-2.5 text-slate-300">{ord.farmer?.name}</td>
                        <td className="py-2.5 text-emerald-400 font-bold">₹{Number(ord.totalAmount).toLocaleString('en-IN')}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              ord.payment?.status === 'SUCCESS'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {ord.payment?.status || 'PENDING'}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadUsers(1)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all text-slate-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                  }}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="FARMER">Farmers</option>
                  <option value="BUYER">Buyers</option>
                  <option value="ADMIN">Admins</option>
                </select>

                <button
                  onClick={() => loadUsers(1)}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-xl transition-all cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing <strong className="text-white font-mono">{users.length}</strong> of{' '}
                  <strong className="text-white font-mono">{usersPagination.totalCount}</strong> users
                </span>
                <span>Page {usersPagination.page} of {usersPagination.totalPages}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase">
                      <th className="pb-3 font-medium">User / Identity</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Profile Metadata</th>
                      <th className="pb-3 font-medium">Verification</th>
                      <th className="pb-3 font-medium">Account Status</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map((usr) => (
                      <tr key={usr.id} className="hover:bg-slate-950/40">
                        <td className="py-3">
                          <div className="font-sans font-bold text-slate-200">{usr.name}</div>
                          <div className="text-[11px] text-slate-400">{usr.email}</div>
                          {usr.phone && <div className="text-[10px] text-slate-500">{usr.phone}</div>}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              usr.role === 'ADMIN'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : usr.role === 'FARMER'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {usr.role}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400 text-[11px]">
                          {usr.farmerProfile && (
                            <div>
                              <span>{usr.farmerProfile.farmName || 'Unnamed Farm'}</span>
                              <span className="text-slate-600 block">
                                {usr.farmerProfile.district ? `${usr.farmerProfile.district}, ${usr.farmerProfile.state}` : 'Location unconfigured'}
                              </span>
                            </div>
                          )}
                          {usr.buyerProfile && (
                            <div>
                              <span>{usr.buyerProfile.businessName || 'Independent Buyer'}</span>
                              <span className="text-slate-600 block">{usr.buyerProfile.businessType || 'Retail'}</span>
                            </div>
                          )}
                          {!usr.farmerProfile && !usr.buyerProfile && <span className="text-slate-600">No profile extension</span>}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => handleToggleUserVerification(usr)}
                            disabled={userActionLoading[usr.id]}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-all ${
                              usr.isVerified
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {usr.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                          </button>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              usr.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {usr.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleToggleUserStatus(usr)}
                            disabled={userActionLoading[usr.id]}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                              usr.isActive
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
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
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  disabled={usersPagination.page <= 1}
                  onClick={() => loadUsers(usersPagination.page - 1)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <span className="text-xs text-slate-500 font-mono">
                  {usersPagination.page} / {usersPagination.totalPages}
                </span>
                <button
                  disabled={usersPagination.page >= usersPagination.totalPages}
                  onClick={() => loadUsers(usersPagination.page + 1)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search listings by crop name or location..."
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadListings(1)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all text-slate-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={listingStatusFilter}
                  onChange={(e) => setListingStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="SOLD_OUT">SOLD_OUT</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>

                <button
                  onClick={() => loadListings(1)}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-xl transition-all cursor-pointer"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Listings Table */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing <strong className="text-white font-mono">{listings.length}</strong> of{' '}
                  <strong className="text-white font-mono">{listingsPagination.totalCount}</strong> listings
                </span>
                <span>Page {listingsPagination.page} of {listingsPagination.totalPages}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase">
                      <th className="pb-3 font-medium">Produce Item</th>
                      <th className="pb-3 font-medium">Farmer</th>
                      <th className="pb-3 font-medium">Quantity &amp; Price</th>
                      <th className="pb-3 font-medium">Location</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Moderation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {listings.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-950/40">
                        <td className="py-3">
                          <div className="font-sans font-bold text-slate-200">{item.cropName}</div>
                          <span className="text-[10px] text-amber-400">{item.category?.name}</span>
                        </td>
                        <td className="py-3 text-slate-300">
                          <div>{item.farmerProfile?.user?.name}</div>
                          <div className="text-[10px] text-slate-500">{item.farmerProfile?.user?.email}</div>
                        </td>
                        <td className="py-3">
                          <div className="text-slate-200">
                            {Number(item.quantity).toLocaleString()} {item.unit}
                          </div>
                          <div className="text-emerald-400 font-bold">₹{Number(item.pricePerUnit).toLocaleString('en-IN')}/{item.unit}</div>
                        </td>
                        <td className="py-3 text-slate-400 text-[11px]">{item.location || 'Not provided'}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : item.status === 'SUSPENDED'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-400'
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
                              className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                            >
                              Reinstate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleModerateListing(item, 'SUSPENDED')}
                              disabled={listingActionLoading[item.id]}
                              className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-all"
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
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  disabled={listingsPagination.page <= 1}
                  onClick={() => loadListings(listingsPagination.page - 1)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <span className="text-xs text-slate-500 font-mono">
                  {listingsPagination.page} / {listingsPagination.totalPages}
                </span>
                <button
                  disabled={listingsPagination.page >= listingsPagination.totalPages}
                  onClick={() => loadListings(listingsPagination.page + 1)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search orders by ID, buyer or farmer name/email..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadOrders(1)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all text-slate-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500"
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
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-xl transition-all cursor-pointer"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing <strong className="text-white font-mono">{orders.length}</strong> of{' '}
                  <strong className="text-white font-mono">{ordersPagination.totalCount}</strong> orders
                </span>
                <span>Page {ordersPagination.page} of {ordersPagination.totalPages}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase">
                      <th className="pb-3 font-medium">Order Reference</th>
                      <th className="pb-3 font-medium">Buyer</th>
                      <th className="pb-3 font-medium">Farmer</th>
                      <th className="pb-3 font-medium">Items Snapshot</th>
                      <th className="pb-3 font-medium">Total Amount</th>
                      <th className="pb-3 font-medium">Payment</th>
                      <th className="pb-3 font-medium">Consignment Tracking</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-950/40">
                        <td className="py-3">
                          <div className="font-bold text-slate-200">#{ord.id.slice(0, 8)}</div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-slate-300">{ord.buyer?.name}</div>
                          <div className="text-[10px] text-slate-500">{ord.buyer?.email}</div>
                        </td>
                        <td className="py-3">
                          <div className="text-slate-300">{ord.farmer?.name}</div>
                          <div className="text-[10px] text-slate-500">{ord.farmer?.email}</div>
                        </td>
                        <td className="py-3 text-slate-400">
                          {ord.orderItems?.map((it) => (
                            <div key={it.id}>
                              {it.listing?.cropName}: {Number(it.quantity)} {it.listing?.unit}
                            </div>
                          ))}
                        </td>
                        <td className="py-3 font-bold text-emerald-400">
                          ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.payment?.status === 'SUCCESS'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {ord.payment?.status || 'PENDING'}
                          </span>
                        </td>
                        <td className="py-3">
                          {ord.delivery?.trackingNumber ? (
                            <div>
                              <span className="text-[11px] font-bold text-blue-400 block">
                                {ord.delivery.trackingNumber}
                              </span>
                              <span className="text-[10px] text-slate-500 uppercase">{ord.delivery.status}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-600 italic">Not dispatched</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  disabled={ordersPagination.page <= 1}
                  onClick={() => loadOrders(ordersPagination.page - 1)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <span className="text-xs text-slate-500 font-mono">
                  {ordersPagination.page} / {ordersPagination.totalPages}
                </span>
                <button
                  disabled={ordersPagination.page >= ordersPagination.totalPages}
                  onClick={() => loadOrders(ordersPagination.page + 1)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
              <div className="text-xs text-slate-400">
                Review user disputes, buyer claims, and marketplace complaints
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={complaintStatusFilter}
                  onChange={(e) => setComplaintStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Complaint Statuses</option>
                  <option value="OPEN">OPEN</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="DISMISSED">DISMISSED</option>
                </select>

                <button
                  onClick={() => loadComplaints(1)}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-xl transition-all cursor-pointer"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Complaints List */}
            <div className="grid grid-cols-1 gap-4">
              {complaints.length === 0 ? (
                <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-sm">
                  No disputes or complaints found matching the selected filter.
                </div>
              ) : (
                complaints.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 font-mono text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">Dispute #{comp.id.slice(0, 8)}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            comp.status === 'OPEN'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : comp.status === 'UNDER_REVIEW'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : comp.status === 'RESOLVED'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {comp.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Filed: {new Date(comp.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                      <div>
                        <span className="text-slate-500 block uppercase">Reported By</span>
                        <span className="text-slate-200 font-bold">{comp.reportedBy?.name}</span>{' '}
                        <span className="text-slate-500">({comp.reportedBy?.email})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block uppercase">Target Reference</span>
                        {comp.listing && (
                          <span className="text-amber-400">Produce Listing: {comp.listing.cropName}</span>
                        )}
                        {comp.order && (
                          <span className="text-blue-400">Order Reference: #{comp.order.id.slice(0, 8)}</span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      <div className="font-semibold text-rose-300 text-xs mb-1">Reason: {comp.reason}</div>
                      <div className="text-slate-400 text-xs font-sans leading-relaxed">{comp.description}</div>
                    </div>

                    {comp.adminResponse && (
                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs">
                        <span className="text-amber-400 font-bold block mb-1">Official Resolution Response:</span>
                        <p className="text-slate-300 font-sans">{comp.adminResponse}</p>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedComplaint(comp);
                          setComplaintResponseText(comp.adminResponse || '');
                        }}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5"
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
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" /> Platform Security &amp; Audit Trail
              </h3>
              <span className="text-slate-500">Immutable Ledger</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                    <th className="pb-3 font-medium">Timestamp</th>
                    <th className="pb-3 font-medium">Administrator</th>
                    <th className="pb-3 font-medium">Action Event</th>
                    <th className="pb-3 font-medium">Target Entity</th>
                    <th className="pb-3 font-medium">Details / Payload</th>
                    <th className="pb-3 font-medium">Source IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-950/40">
                      <td className="py-2.5 text-slate-400 text-[11px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 text-slate-300 font-bold">{log.adminEmail}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400">
                        {log.targetType} {log.targetId ? `(${log.targetId.slice(0, 8)}...)` : ''}
                      </td>
                      <td className="py-2.5 text-slate-400 max-w-xs truncate text-[10px]">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                      </td>
                      <td className="py-2.5 text-slate-500 text-[10px]">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                disabled={auditPagination.page <= 1}
                onClick={() => loadAuditLogs(auditPagination.page - 1)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="text-xs text-slate-500">
                {auditPagination.page} / {auditPagination.totalPages}
              </span>
              <button
                disabled={auditPagination.page >= auditPagination.totalPages}
                onClick={() => loadAuditLogs(auditPagination.page + 1)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Complaint Resolution Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Resolve Dispute #{selectedComplaint.id.slice(0, 8)}
              </h3>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-slate-400 hover:text-white text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
              <div className="text-slate-300">
                <strong>Complainant:</strong> {selectedComplaint.reportedBy?.name}
              </div>
              <div className="text-rose-400">
                <strong>Reason:</strong> {selectedComplaint.reason}
              </div>
              <p className="text-slate-400 text-xs font-sans mt-2">{selectedComplaint.description}</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-300 font-mono">
                Official Administrative Response
              </label>
              <textarea
                rows={4}
                value={complaintResponseText}
                onChange={(e) => setComplaintResponseText(e.target.value)}
                placeholder="Enter investigation findings, corrective actions taken, and formal resolution text..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-500 transition-all font-sans"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={complaintUpdating}
                onClick={() => handleResolveComplaint('UNDER_REVIEW')}
                className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-xl transition-all cursor-pointer"
              >
                Mark Under Review
              </button>
              <button
                disabled={complaintUpdating}
                onClick={() => handleResolveComplaint('DISMISSED')}
                className="w-full sm:w-auto px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-xl transition-all cursor-pointer"
              >
                Dismiss
              </button>
              <button
                disabled={complaintUpdating}
                onClick={() => handleResolveComplaint('RESOLVED')}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl transition-all cursor-pointer"
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
