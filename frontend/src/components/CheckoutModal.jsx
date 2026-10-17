import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  ShieldCheck,
  MapPin,
  Sprout,
  User,
  ArrowRight,
  AlertCircle,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { createOrderApi } from '../services/api';

export default function CheckoutModal({ isOpen, onClose, offer, onSuccess }) {
  const [shippingAddress, setShippingAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !offer) return null;

  const listing = offer.listing;
  const quantity = Number(offer.quantity);
  const agreedPrice = Number(offer.offeredPrice);
  const totalAmount = Number((quantity * agreedPrice).toFixed(2));
  const farmer = listing?.farmerProfile?.user || offer.listing?.farmerProfile;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shippingAddress.trim() || shippingAddress.trim().length < 5) {
      setError('Please provide a complete shipping address (at least 5 characters).');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await createOrderApi({
        offerId: offer.id,
        shippingAddress: shippingAddress.trim(),
      });

      if (res.success && res.data) {
        onSuccess(res.data);
      } else {
        setError(res.message || 'Failed to place order');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Order creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Confirm Trade Checkout
              </h3>
              <p className="text-xs text-slate-400">Complete transaction on accepted trade terms</p>
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

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Agreed Produce Summary Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Agreed Offer Terms
                </span>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-400" />
                  {listing?.cropName || 'Produce Listing'}
                </h4>
                <p className="text-xs text-slate-400">
                  Seller:{' '}
                  <span className="text-slate-200 font-medium">
                    {farmer?.name || listing?.farmerProfile?.farmName || 'Verified Farmer'}
                  </span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-mono">Agreed Unit Price</span>
                <div className="text-base font-extrabold text-emerald-400 font-mono">
                  ₹{agreedPrice.toLocaleString('en-IN')}{' '}
                  <span className="text-xs font-normal text-slate-400">/ {listing?.unit || 'unit'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-900 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Quantity</span>
                <span className="text-slate-200 font-bold font-mono">
                  {quantity.toLocaleString('en-IN')} {listing?.unit || 'units'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">Order Total</span>
                <span className="text-emerald-400 font-extrabold font-mono text-sm">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping / Delivery Address Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Delivery / Shipping Address <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Enter warehouse, shop, or delivery address with city and pincode..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 transition-colors resize-none"
            />
            <p className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
              <Truck className="w-3 h-3 text-slate-400" /> Dispatch coordinate will be shared with the seller.
            </p>
          </div>

          {/* Security & Guarantee Trust Banner */}
          <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300/90 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-200">Direct Farmer Settlement Protection</p>
              <p className="text-[11px] text-blue-300/80 leading-relaxed mt-0.5">
                Stock is decremented atomically upon confirmation. The accepted price is locked and guaranteed against market fluctuation.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Processing Order...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm &amp; Place Order (₹{totalAmount.toLocaleString('en-IN')})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
