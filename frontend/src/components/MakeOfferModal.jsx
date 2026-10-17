import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Tag, Handshake, AlertCircle, Calendar, MessageSquare, ArrowRight } from 'lucide-react';
import { createOfferApi } from '../services/api';

const makeOfferSchema = z.object({
  offeredPrice: z
    .string()
    .min(1, 'Please enter an offer price')
    .transform((val) => parseFloat(val))
    .refine((val) => val > 0, { message: 'Offer price must be greater than zero' }),
  quantity: z
    .string()
    .min(1, 'Please enter quantity')
    .transform((val) => parseFloat(val))
    .refine((val) => val > 0, { message: 'Quantity must be greater than zero' }),
  message: z.string().max(1000, 'Message cannot exceed 1000 characters').optional(),
  expiresAt: z.string().optional(),
});

export default function MakeOfferModal({ isOpen, onClose, listing, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(makeOfferSchema),
    defaultValues: {
      offeredPrice: listing?.pricePerUnit ? String(listing.pricePerUnit) : '',
      quantity: listing?.quantity ? String(Math.min(Number(listing.quantity), 100)) : '',
      message: '',
      expiresAt: '',
    },
  });

  const watchedPrice = parseFloat(watch('offeredPrice') || 0);
  const watchedQuantity = parseFloat(watch('quantity') || 0);

  if (!isOpen || !listing) return null;

  const askingPrice = Number(listing.pricePerUnit);
  const totalValue = watchedPrice > 0 && watchedQuantity > 0 ? watchedPrice * watchedQuantity : 0;
  const askingTotal = askingPrice * watchedQuantity;
  const priceDiffPct =
    askingPrice > 0 && watchedPrice > 0 ? ((watchedPrice - askingPrice) / askingPrice) * 100 : 0;

  const handleFormSubmit = async (data) => {
    setServerError('');
    setSubmitting(true);
    try {
      const payload = {
        listingId: listing.id,
        offeredPrice: data.offeredPrice,
        quantity: data.quantity,
        message: data.message?.trim() || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
      };

      const res = await createOfferApi(payload);
      if (res.success) {
        reset();
        onClose();
        if (onSuccess) onSuccess(res.data);
      }
    } catch (err) {
      setServerError(err.response?.data?.message || err.message || 'Failed to submit offer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in duration-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Handshake className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Place Trade Offer</h3>
              <p className="text-xs text-slate-400">Direct mandi price negotiation with farmer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Produce Overview Summary */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 text-sm">{listing.cropName}</span>
            <span className="font-mono text-slate-400">
              Stock: {Number(listing.quantity).toLocaleString('en-IN')} {listing.unit}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Farmer Asking Price:</span>
            <span className="font-mono text-emerald-400 font-semibold text-sm">
              ₹{Number(listing.pricePerUnit).toLocaleString('en-IN')} / {listing.unit}
            </span>
          </div>
        </div>

        {serverError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Row 1: Offered Price & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Your Offer Price (₹/{listing.unit}) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('offeredPrice')}
                placeholder={String(listing.pricePerUnit)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm font-mono"
              />
              {errors.offeredPrice && <p className="text-xs text-rose-400">{errors.offeredPrice.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Quantity ({listing.unit}) *
              </label>
              <input
                type="number"
                step="0.001"
                {...register('quantity')}
                placeholder={`Max ${listing.quantity}`}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm font-mono"
              />
              {errors.quantity && <p className="text-xs text-rose-400">{errors.quantity.message}</p>}
            </div>
          </div>

          {/* Real-time Calculation Summary */}
          {totalValue > 0 && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Offered Batch Value:</span>
                <span className="font-mono text-emerald-400 font-bold text-base">
                  ₹{Math.round(totalValue).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Asking Total: ₹{Math.round(askingTotal).toLocaleString('en-IN')}</span>
                <span
                  className={`font-semibold font-mono ${
                    priceDiffPct < 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {priceDiffPct === 0
                    ? 'At Asking Price'
                    : `${priceDiffPct > 0 ? '+' : ''}${priceDiffPct.toFixed(1)}% vs asking`}
                </span>
              </div>
            </div>
          )}

          {/* Expiry Date (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Offer Expiry Date (Optional)
            </label>
            <input
              type="date"
              {...register('expiresAt')}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm font-mono"
            />
          </div>

          {/* Note / Message to Farmer */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Trade Note / Delivery Terms
            </label>
            <textarea
              rows={2}
              {...register('message')}
              placeholder="e.g. Can arrange mandi pickup by Friday; payment on delivery."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
            ></textarea>
            {errors.message && <p className="text-xs text-rose-400">{errors.message.message}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Handshake className="w-4 h-4" />
                  <span>Submit Offer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
