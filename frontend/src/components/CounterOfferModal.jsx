import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import { counterOfferApi } from '../services/api';

const counterSchema = z.object({
  counterPrice: z
    .string()
    .min(1, 'Please enter counter price')
    .transform((val) => parseFloat(val))
    .refine((val) => val > 0, { message: 'Counter price must be greater than zero' }),
  counterQuantity: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || val > 0, { message: 'Quantity must be positive' }),
  message: z.string().max(1000).optional(),
});

export default function CounterOfferModal({ isOpen, onClose, offer, isFarmer, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(counterSchema),
    defaultValues: {
      counterPrice: offer ? String(offer.offeredPrice) : '',
      counterQuantity: offer ? String(offer.quantity) : '',
      message: '',
    },
  });

  const watchedPrice = parseFloat(watch('counterPrice') || 0);
  const watchedQuantity = parseFloat(watch('counterQuantity') || offer?.quantity || 0);

  if (!isOpen || !offer) return null;

  const totalValue = watchedPrice > 0 && watchedQuantity > 0 ? watchedPrice * watchedQuantity : 0;
  const unit = offer.listing?.unit || 'unit';

  const handleFormSubmit = async (data) => {
    setServerError('');
    setSubmitting(true);
    try {
      const payload = {
        counterPrice: data.counterPrice,
        ...(data.counterQuantity && { counterQuantity: data.counterQuantity }),
        message: data.message?.trim() || null,
      };

      const res = await counterOfferApi(offer.id, payload);
      if (res.success) {
        onClose();
        if (onSuccess) onSuccess(res.data);
      }
    } catch (err) {
      setServerError(err.response?.data?.message || err.message || 'Failed to submit counteroffer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in duration-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {isFarmer ? 'Make Counteroffer' : 'Submit Re-Counter'}
              </h3>
              <p className="text-xs text-slate-400">
                Propose adjusted price terms to {isFarmer ? 'the buyer' : 'the farmer'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Negotiation State Summary */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Current Offer Price:</span>
            <span className="font-mono font-bold text-slate-200">
              ₹{Number(offer.offeredPrice).toLocaleString('en-IN')}/{unit}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Produce:</span>
            <span className="text-slate-300 font-semibold">{offer.listing?.cropName}</span>
          </div>
          {offer.message && (
            <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
              &quot;{offer.message}&quot;
            </p>
          )}
        </div>

        {serverError && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Counter Price */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              New Counter Price (₹/{unit}) *
            </label>
            <input
              type="number"
              step="0.01"
              {...register('counterPrice')}
              placeholder={String(offer.offeredPrice)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 text-sm font-mono"
            />
            {errors.counterPrice && <p className="text-xs text-rose-400">{errors.counterPrice.message}</p>}
          </div>

          {/* Adjusted Quantity (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Quantity ({unit})
            </label>
            <input
              type="number"
              step="0.001"
              {...register('counterQuantity')}
              placeholder={String(offer.quantity)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500 text-sm font-mono"
            />
            {errors.counterQuantity && <p className="text-xs text-rose-400">{errors.counterQuantity.message}</p>}
          </div>

          {/* Real-time Calculation */}
          {totalValue > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between">
              <span className="text-slate-400">Total Counter Value:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                ₹{Math.round(totalValue).toLocaleString('en-IN')}
              </span>
            </div>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Reason / Negotiation Note
            </label>
            <textarea
              rows={2}
              {...register('message')}
              placeholder="e.g. Can meet at ₹3,300 with immediate mandi loading."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 text-sm"
            ></textarea>
          </div>

          {/* Actions */}
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
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-amber-950/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Send Counteroffer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
