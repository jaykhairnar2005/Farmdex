import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  MapPin,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sprout,
  User,
  ShieldCheck,
} from 'lucide-react';
import { dispatchOrderApi } from '../services/api';

export default function DispatchOrderModal({ isOpen, onClose, order, onSuccess }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Dispatch Consignment
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Milestone 8
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Confirm carrier dispatch &amp; assign shipment tracking ID
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 font-sans">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Order Details Brief */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-emerald-400 font-bold">
                #{order.id.slice(0, 13).toUpperCase()}
              </span>
              <span className="text-slate-400 font-mono">
                Paid: ₹{Number(order.totalAmount).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                {listing?.cropName || 'Produce Batch'}
              </span>
              <span className="font-mono text-slate-400">
                {Number(item?.quantity || 0)} {listing?.unit || 'units'}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-900 text-slate-400 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{order.shippingAddress}</span>
            </div>
          </div>

          {/* Tracking Number Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              Consignment Tracking Number <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. FDX-TRK-12345678"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-[11px] text-slate-500 font-mono">
              The buyer uses this ID to track consignment in real time.
            </p>
          </div>

          {/* Estimated Delivery Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Estimated Delivery Date
            </label>
            <input
              type="date"
              value={estimatedDelivery}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500 transition-colors font-mono"
            />
          </div>

          {/* Dispatch Origin / Location */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Dispatch Origin Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Central Farm Godown, Karnal"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Logistics Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Carrier name, vehicle number, or special storage notes..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-950/50 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{submitting ? 'Dispatching...' : 'Confirm Dispatch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
