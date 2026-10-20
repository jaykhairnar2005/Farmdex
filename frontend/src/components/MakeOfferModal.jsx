import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Handshake, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createOfferApi } from '../services/api';
import { formatCurrency, formatNumber } from '../utils/formatters';

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
  const { t, i18n } = useTranslation();
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-lg w-full bg-surface border border-line rounded-2xl shadow-modal p-6 sm:p-7 space-y-5 fade-in my-8 text-ink">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-brand-50 border border-brand-100 rounded-xl text-brand-800">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-ink">{t('modals.makeOffer.title')}</h3>
              <p className="text-xs text-ink-muted">{t('modals.makeOffer.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-subtle hover:text-ink-muted hover:bg-surface-sunken rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Produce Overview Summary */}
        <div className="p-4 rounded-xl bg-surface-muted border border-line space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-ink text-sm">{listing.cropName}</span>
            <span className="text-ink-muted">
              {t('common.quantity')}: {formatNumber(listing.quantity, i18n.language)} {listing.unit}
            </span>
          </div>
          <div className="flex items-center justify-between text-ink-muted">
            <span>{t('modals.makeOffer.listedRate')}:</span>
            <span className="text-brand-800 font-bold text-sm">
              {formatCurrency(listing.pricePerUnit, i18n.language)} / {listing.unit}
            </span>
          </div>
        </div>

        {serverError && (
          <div className="p-3 rounded-lg bg-danger-soft border border-danger-edge text-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Row 1: Offered Price & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                {t('modals.makeOffer.offerRate')} (₹/{listing.unit}) *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('offeredPrice')}
                placeholder={String(listing.pricePerUnit)}
                className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm font-medium"
              />
              {errors.offeredPrice && <p className="text-xs text-danger">{errors.offeredPrice.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                {t('common.quantity')} ({listing.unit}) *
              </label>
              <input
                type="number"
                step="0.001"
                {...register('quantity')}
                placeholder={`Max ${listing.quantity}`}
                className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm font-medium"
              />
              {errors.quantity && <p className="text-xs text-danger">{errors.quantity.message}</p>}
            </div>
          </div>

          {/* Real-time Calculation Summary */}
          {totalValue > 0 && (
            <div className="p-4 rounded-xl bg-brand-50 border border-brand-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">{t('modals.makeOffer.estimatedSettlement')}:</span>
                <span className="text-brand-800 font-bold text-base">
                  {formatCurrency(Math.round(totalValue), i18n.language)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-ink-muted">
                <span>{t('modals.makeOffer.listedRate')}: {formatCurrency(Math.round(askingTotal), i18n.language)}</span>
                <span
                  className={`font-semibold ${
                    priceDiffPct < 0 ? 'text-warning' : 'text-brand-800'
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
              {t('common.date')} ({t('common.optional')})
            </label>
            <input
              type="date"
              {...register('expiresAt')}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
            />
          </div>

          {/* Note / Message to Farmer */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
              {t('modals.makeOffer.deliveryTerms')}
            </label>
            <textarea
              rows={2}
              {...register('message')}
              placeholder={t('modals.makeOffer.deliveryTermsPlaceholder')}
              className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
            ></textarea>
            {errors.message && <p className="text-xs text-danger">{errors.message.message}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-surface hover:bg-surface-muted text-ink text-sm font-medium rounded-lg border border-line transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Handshake className="w-4 h-4" />
                  <span>{t('modals.makeOffer.submit')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


