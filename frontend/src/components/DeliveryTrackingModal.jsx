import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  FileText,
  Navigation,
  Package,
  Sprout,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { fetchDeliveryTrackingApi, updateDeliveryStatusApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function DeliveryTrackingModal({ isOpen, onClose, orderId, isFarmer, onStatusUpdated }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isFarmerUser = (isFarmer || user?.role === 'FARMER') && !isAdmin;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Farmer status update form state
  const [selectedNextStatus, setSelectedNextStatus] = useState('');
  const [updateLocation, setUpdateLocation] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  const loadTracking = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchDeliveryTrackingApi(orderId);
      if (res.success && res.data) {
        setData(res.data);

        // Pre-select next logical status for farmer
        const current = res.data.delivery?.status || 'PENDING';
        if (current === 'PENDING') setSelectedNextStatus('PREPARING');
        else if (current === 'PREPARING') setSelectedNextStatus('DISPATCHED');
        else if (current === 'DISPATCHED') setSelectedNextStatus('IN_TRANSIT');
        else if (current === 'IN_TRANSIT') setSelectedNextStatus('OUT_FOR_DELIVERY');
        else if (current === 'OUT_FOR_DELIVERY') setSelectedNextStatus('DELIVERED');
        else setSelectedNextStatus('');
      } else {
        setError(res.message || 'Delivery details not found');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (isOpen && orderId) {
      loadTracking();
      setUpdateError('');
      setUpdateSuccess('');
    }
  }, [isOpen, orderId, loadTracking]);

  if (!isOpen) return null;

  const handleCopyTracking = (trackingNum) => {
    if (!trackingNum) return;
    navigator.clipboard.writeText(trackingNum);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFarmerUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedNextStatus) return;

    setUpdating(true);
    setUpdateError('');
    setUpdateSuccess('');

    try {
      const res = await updateDeliveryStatusApi(orderId, {
        status: selectedNextStatus,
        location: updateLocation.trim() || undefined,
        note: updateNote.trim() || undefined,
      });

      if (res.success) {
        setUpdateSuccess(`Delivery status successfully transitioned to ${selectedNextStatus}`);
        setUpdateLocation('');
        setUpdateNote('');
        await loadTracking();
        if (onStatusUpdated) onStatusUpdated();
      } else {
        setUpdateError(res.message || 'Failed to update status');
      }
    } catch (err) {
      setUpdateError(err.response?.data?.message || err.message || 'Status transition failed');
    } finally {
      setUpdating(false);
    }
  };

  const delivery = data?.delivery;
  const timeline = data?.timeline;
  const history = data?.history || [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 font-mono animate-pulse">
            <Truck className="w-3 h-3" /> Out for Delivery
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1 font-mono">
            <Navigation className="w-3 h-3" /> In Transit
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1 font-mono">
            <Truck className="w-3 h-3" /> Dispatched
          </span>
        );
      case 'PREPARING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1 font-mono">
            <Package className="w-3 h-3" /> Preparing
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 font-mono">
            {status || 'Pending'}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Delivery Tracking</h3>
                {delivery?.status && getStatusBadge(delivery.status)}
              </div>
              <p className="text-xs text-slate-400">
                Real-time agricultural freight movement &amp; consignment timeline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadTracking}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh tracking"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 font-sans">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-mono">Fetching consignment timeline...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Consignment Quick Metrics Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                {/* Tracking Number */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono block">Tracking Number</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-white text-xs select-all">
                      {delivery?.trackingNumber || 'Awaiting Dispatch'}
                    </span>
                    {delivery?.trackingNumber && (
                      <button
                        onClick={() => handleCopyTracking(delivery.trackingNumber)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Copy tracking number"
                      >
                        {copied ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Estimated Delivery */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono block">Estimated Delivery</span>
                  <span className="font-mono text-emerald-400 font-semibold block">
                    {delivery?.estimatedDelivery
                      ? new Date(delivery.estimatedDelivery).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Pending Dispatch'}
                  </span>
                </div>

                {/* Destination */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono block">Delivery Destination</span>
                  <span className="text-slate-300 truncate block font-mono text-[11px]" title={data?.shippingAddress}>
                    {data?.shippingAddress || 'Registered Address'}
                  </span>
                </div>
              </div>

              {/* Visual Stepped Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Consignment Milestone Progression
                </h4>

                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-6">
                  {timeline?.steps?.map((step, idx) => {
                    const isDone = step.isCompleted;
                    const isCurrent = step.isCurrent;

                    return (
                      <div key={step.key} className="relative flex items-start gap-4">
                        {/* Connecting Line */}
                        {idx < timeline.steps.length - 1 && (
                          <div
                            className={`absolute left-4 top-8 -bottom-6 w-0.5 transition-colors ${
                              isDone && !isCurrent ? 'bg-emerald-500' : 'bg-slate-800'
                            }`}
                          />
                        )}

                        {/* Node Icon */}
                        <div
                          className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-mono font-bold transition-all shadow-md ${
                            isCurrent
                              ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20'
                              : isDone
                              ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-400'
                              : 'bg-slate-900 border border-slate-800 text-slate-500'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>

                        {/* Step Details */}
                        <div className="flex-1 space-y-0.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <h5
                              className={`text-xs font-bold ${
                                isCurrent
                                  ? 'text-white'
                                  : isDone
                                  ? 'text-slate-200'
                                  : 'text-slate-500'
                              }`}
                            >
                              {step.title}
                            </h5>
                            {step.timestamp && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(step.timestamp).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status History Logs Table */}
              {history.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    Delivery Audit Log &amp; Checkpoints
                  </h4>

                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                    <div className="divide-y divide-slate-800/60 text-xs">
                      {history.map((h, i) => (
                        <div key={h.id || i} className="p-3 flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(h.status)}
                              {h.location && (
                                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-500" /> {h.location}
                                </span>
                              )}
                            </div>
                            {h.note && (
                              <p className="text-[11px] text-slate-300 mt-1">{h.note}</p>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono shrink-0">
                            {new Date(h.created_at).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Farmer Dispatched Notice */}
              {isFarmerUser && ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(delivery?.status) && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 font-mono flex items-center gap-3">
                  <Truck className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-slate-200 block">Produce Dispatched from Farm</span>
                    <span>In-transit checkpoints and final delivery verification are managed by logistics carriers and platform administrators.</span>
                  </div>
                </div>
              )}

              {/* Status Update Action Box (FARMER: PREPARING/DISPATCHED only; ADMIN: all statuses) */}
              {((isFarmerUser && ['PENDING', 'PREPARING'].includes(delivery?.status)) || isAdmin) && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">
                        {isAdmin ? 'Administrator Transit Control & Correction' : 'Seller Farm Dispatch Control'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Current: {delivery?.status || 'PENDING'}
                    </span>
                  </div>

                  {updateError && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                      {updateError}
                    </div>
                  )}

                  {updateSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                      {updateSuccess}
                    </div>
                  )}

                  <form onSubmit={handleFarmerUpdateStatus} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          {isAdmin ? 'Select Status (Update / Correct)' : 'Next Status Transition'}
                        </label>
                        <select
                          value={selectedNextStatus}
                          onChange={(e) => setSelectedNextStatus(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        >
                          {isAdmin ? (
                            <>
                              <option value="PREPARING">PREPARING (Packing &amp; Sorting)</option>
                              <option value="DISPATCHED">DISPATCHED (Handed to Carrier)</option>
                              <option value="IN_TRANSIT">IN_TRANSIT (En Route)</option>
                              <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (Local Dispatch)</option>
                              <option value="DELIVERED">DELIVERED (Handover Complete)</option>
                            </>
                          ) : (
                            <>
                              <option value="PREPARING">PREPARING (Packing &amp; Sorting)</option>
                              <option value="DISPATCHED">DISPATCHED (Handed to Carrier)</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Current Location Checkpoint
                        </label>
                        <input
                          type="text"
                          value={updateLocation}
                          onChange={(e) => setUpdateLocation(e.target.value)}
                          placeholder="e.g. Farm Packing Center"
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Transit Note (Optional)
                      </label>
                      <input
                        type="text"
                        value={updateNote}
                        onChange={(e) => setUpdateNote(e.target.value)}
                        placeholder="e.g. Consignment prepared and labeled"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={updating || !selectedNextStatus}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {updating ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <span>{isAdmin ? 'Apply Status Update' : 'Update Farm Status'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>FarmDex Verified Agricultural Logistics</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
