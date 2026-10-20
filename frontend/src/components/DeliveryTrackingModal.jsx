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
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchDeliveryTrackingApi, updateDeliveryStatusApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatDateTime } from '../utils/formatters';

export default function DeliveryTrackingModal({ isOpen, onClose, orderId, isFarmer, onStatusUpdated }) {
  const { t, i18n } = useTranslation();
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
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-success-soft text-success border border-success-edge flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {t('modals.deliveryTracking.steps.delivered')}
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-warning-soft text-warning border border-warning-edge flex items-center gap-1">
            <Truck className="w-3 h-3" /> {t('modals.deliveryTracking.steps.outForDelivery')}
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
            <Navigation className="w-3 h-3" /> {t('modals.deliveryTracking.steps.inTransit')}
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-info-soft text-info border border-blue-200 flex items-center gap-1">
            <Truck className="w-3 h-3" /> {t('modals.deliveryTracking.steps.dispatched')}
          </span>
        );
      case 'PREPARING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
            <Package className="w-3 h-3" /> {t('modals.deliveryTracking.steps.preparing')}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-sunken text-ink">
            {status || t('status.pending')}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs fade-in">
      <div className="relative w-full max-w-2xl bg-surface border border-line rounded-2xl shadow-modal overflow-hidden flex flex-col max-h-[92vh] text-ink">
        {/* Header */}
        <div className="p-5 border-b border-line bg-surface-muted/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 text-brand-800 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-ink tracking-tight">{t('modals.deliveryTracking.title')}</h3>
                {delivery?.status && getStatusBadge(delivery.status)}
              </div>
              <p className="text-xs text-ink-muted">
                {t('modals.deliveryTracking.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadTracking}
              disabled={loading}
              className="p-2 text-ink-subtle hover:text-ink-muted rounded-lg hover:bg-surface-sunken transition-colors cursor-pointer"
              title={t('common.refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-ink-subtle hover:text-ink-muted rounded-lg hover:bg-surface-sunken transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 font-sans">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-ink-muted">{t('common.loading')}</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-danger-soft border border-danger-edge text-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Consignment Quick Metrics Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-surface-muted border border-line rounded-xl text-xs">
                {/* Tracking Number */}
                <div className="space-y-1">
                  <span className="text-[10px] text-ink-muted font-mono block">{t('modals.deliveryTracking.trackingNo')}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-ink text-xs select-all">
                      {delivery?.trackingNumber || t('status.pending')}
                    </span>
                    {delivery?.trackingNumber && (
                      <button
                        onClick={() => handleCopyTracking(delivery.trackingNumber)}
                        className="p-1 hover:bg-surface-muted rounded text-ink-muted hover:text-ink transition-colors cursor-pointer"
                        title={t('modals.deliveryTracking.copyTracking')}
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-brand-800" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Estimated Delivery */}
                <div className="space-y-1">
                  <span className="text-[10px] text-ink-muted font-mono block">{t('modals.dispatch.estimatedDelivery')}</span>
                  <span className="text-brand-800 font-semibold block text-xs">
                    {delivery?.estimatedDelivery
                      ? formatDate(delivery.estimatedDelivery, i18n.language)
                      : t('status.pending')}
                  </span>
                </div>

                {/* Destination */}
                <div className="space-y-1">
                  <span className="text-[10px] text-ink-muted font-mono block">{t('modals.checkout.shippingAddress')}</span>
                  <span className="text-ink truncate block text-[11px]" title={data?.shippingAddress}>
                    {data?.shippingAddress || t('common.location')}
                  </span>
                </div>
              </div>

              {/* Visual Stepped Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-ink uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-brand-800" />
                  Consignment Milestone Progression
                </h4>

                <div className="p-5 bg-surface-muted/70 border border-line rounded-xl space-y-6">
                  {timeline?.steps?.map((step, idx) => {
                    const isDone = step.isCompleted;
                    const isCurrent = step.isCurrent;

                    return (
                      <div key={step.key} className="relative flex items-start gap-4">
                        {/* Connecting Line */}
                        {idx < timeline.steps.length - 1 && (
                          <div
                            className={`absolute left-4 top-8 -bottom-6 w-0.5 transition-colors ${
                              isDone && !isCurrent ? 'bg-brand-800' : 'bg-line'
                            }`}
                          />
                        )}

                        {/* Node Icon */}
                        <div
                          className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all shadow-card ${
                            isCurrent
                              ? 'bg-brand-800 text-white ring-4 ring-brand-100'
                              : isDone
                              ? 'bg-brand-100 border border-brand-200 text-brand-800'
                              : 'bg-surface border border-line text-ink-subtle'
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
                                  ? 'text-ink'
                                  : isDone
                                  ? 'text-ink'
                                  : 'text-ink-subtle'
                              }`}
                            >
                              {step.title}
                            </h5>
                            {step.timestamp && (
                              <span className="text-[10px] text-ink-muted">
                                {new Date(step.timestamp).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-ink-muted leading-relaxed">
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
                  <h4 className="text-xs font-semibold text-ink uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-brand-800" />
                    {t('modals.deliveryTracking.auditLogTitle')}
                  </h4>

                  <div className="border border-line rounded-xl overflow-hidden bg-surface shadow-card">
                    <div className="divide-y divide-line text-xs">
                      {history.map((h, i) => (
                        <div key={h.id || i} className="p-3.5 flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(h.status)}
                              {h.location && (
                                <span className="text-ink-muted text-[11px] flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-ink-subtle" /> {h.location}
                                </span>
                              )}
                            </div>
                            {h.note && (
                              <p className="text-[11px] text-ink-muted mt-1">{h.note}</p>
                            )}
                          </div>
                          <span className="text-[10px] text-ink-subtle shrink-0 font-mono">
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
                <div className="p-4 rounded-xl bg-surface-muted border border-line text-xs text-ink-muted flex items-center gap-3">
                  <Truck className="w-5 h-5 text-brand-800 shrink-0" />
                  <div>
                    <span className="font-bold text-ink block">Produce Dispatched from Farm</span>
                    <span>In-transit checkpoints and final delivery verification are managed by logistics carriers and platform administrators.</span>
                  </div>
                </div>
              )}

              {/* Status Update Action Box (FARMER: PREPARING/DISPATCHED only; ADMIN: all statuses) */}
              {((isFarmerUser && ['PENDING', 'PREPARING'].includes(delivery?.status)) || isAdmin) && (
                <div className="p-4 rounded-xl bg-brand-50/50 border border-brand-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-brand-100 pb-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-brand-800" />
                      <span className="text-xs font-bold text-ink">
                        {isAdmin ? 'Administrator Transit Control & Correction' : 'Seller Farm Dispatch Control'}
                      </span>
                    </div>
                    <span className="text-[10px] text-ink-muted font-mono">
                      Current: {delivery?.status || 'PENDING'}
                    </span>
                  </div>

                  {updateError && (
                    <div className="p-3 rounded-lg bg-danger-soft border border-danger-edge text-danger text-xs">
                      {updateError}
                    </div>
                  )}

                  {updateSuccess && (
                    <div className="p-3 rounded-lg bg-success-soft border border-success-edge text-success text-xs">
                      {updateSuccess}
                    </div>
                  )}

                  <form onSubmit={handleFarmerUpdateStatus} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-ink mb-1">
                          {isAdmin ? 'Select Status (Update / Correct)' : 'Next Status Transition'}
                        </label>
                        <select
                          value={selectedNextStatus}
                          onChange={(e) => setSelectedNextStatus(e.target.value)}
                          className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-medium"
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
                        <label className="block text-[11px] font-semibold text-ink mb-1">
                          Current Location Checkpoint
                        </label>
                        <input
                          type="text"
                          value={updateLocation}
                          onChange={(e) => setUpdateLocation(e.target.value)}
                          placeholder="e.g. Farm Packing Center"
                          className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-ink mb-1">
                        Transit Note (Optional)
                      </label>
                      <input
                        type="text"
                        value={updateNote}
                        onChange={(e) => setUpdateNote(e.target.value)}
                        placeholder="e.g. Consignment prepared and labeled"
                        className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={updating || !selectedNextStatus}
                        className="px-4 py-2 bg-brand-800 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
        <div className="p-4 border-t border-line bg-surface-muted/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <ShieldCheck className="w-4 h-4 text-brand-800" />
            <span>FarmDex Verified Agricultural Logistics</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-surface hover:bg-surface-sunken text-ink border border-line text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


