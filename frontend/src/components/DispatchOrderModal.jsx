import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  MapPin,
  Calendar,
  FileText,
  AlertCircle,
  Sprout,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { dispatchOrderApi } from '../services/api';
import { formatCurrency, formatNumber } from '../utils/formatters';

export default function DispatchOrderModal({ isOpen, onClose, order, onSuccess }) {
  const { t, i18n } = useTranslation();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && order) {
      // Default tracking number format
      const defaultTrk = `FDX-TRK-${order.id.slice(0, 8).toUpperCase()}-${Date.now()
        .toString(36)
        .toUpperCase()}`;
      setTrackingNumber(defaultTrk);

      // Default estimated delivery +3 days in YYYY-MM-DD
      const d = new Date();
      d.setDate(d.getDate() + 3);
      setEstimatedDelivery(d.toISOString().slice(0, 10));

      setLocation('Farm Warehouse Dispatch Center');
      setNote('Inspected and dispatched via agricultural carrier');
      setError('');
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const item = order.orderItems?.[0];
  const listing = item?.listing;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setError('Please provide a valid tracking number');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await dispatchOrderApi(order.id, {
        trackingNumber: trackingNumber.trim(),
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery).toISOString() : null,
        location: location.trim(),
        note: note.trim(),
      });

      if (res.success) {
        if (onSuccess) onSuccess(res.data);
      } else {
        setError(res.message || 'Failed to dispatch order');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Dispatch failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs fade-in">
      <div className="relative w-full max-w-lg bg-surface border border-line rounded-2xl shadow-modal overflow-hidden flex flex-col max-h-[90vh] text-ink">
        {/* Header */}
        <div className="p-5 border-b border-line bg-surface-muted/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-800 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                {t('modals.dispatch.title')}
              </h3>
              <p className="text-xs text-ink-muted">
                {t('modals.dispatch.subtitle', { id: order.id.slice(0, 8) })}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 text-ink-subtle hover:text-ink-muted rounded-lg hover:bg-surface-sunken transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 font-sans">
          {error && (
            <div className="p-3.5 rounded-xl bg-danger-soft border border-danger-edge text-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Order Details Brief */}
          <div className="p-3.5 rounded-xl bg-surface-muted border border-line space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-brand-800 font-bold">
                #{order.id.slice(0, 13).toUpperCase()}
              </span>
              <span className="text-ink-muted font-medium">
                {formatCurrency(order.totalAmount, i18n.language)}
              </span>
            </div>
            <div className="flex items-center justify-between text-ink">
              <span className="flex items-center gap-1.5 font-medium">
                <Sprout className="w-3.5 h-3.5 text-brand-800" />
                {listing?.cropName || 'Produce Batch'}
              </span>
              <span className="font-medium text-ink-muted">
                {formatNumber(item?.quantity || 0, i18n.language)} {listing?.unit || 'units'}
              </span>
            </div>
            <div className="pt-2 border-t border-line/80 text-ink-muted flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-ink-subtle shrink-0 mt-0.5" />
              <span className="line-clamp-1">{order.shippingAddress}</span>
            </div>
          </div>

          {/* Tracking Number Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-brand-800" />
              {t('modals.dispatch.trackingNumber')} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. FDX-TRK-12345678"
              className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink font-mono text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>

          {/* Estimated Delivery Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-800" />
              {t('modals.dispatch.estimatedDelivery')}
            </label>
            <input
              type="date"
              value={estimatedDelivery}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors font-mono"
            />
          </div>

          {/* Dispatch Origin / Location */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-800" />
              {t('common.location')}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Central Farm Godown, Karnal"
              className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-ink-subtle" />
              {t('modals.dispatch.notes')}
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Carrier name, vehicle number, or special storage notes..."
              className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 bg-surface hover:bg-surface-muted text-ink rounded-lg border border-line text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{submitting ? t('common.submitting') : t('modals.dispatch.submit')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


