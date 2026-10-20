import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, RefreshCw, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { counterOfferApi } from '../services/api';
import { formatCurrency, formatNumber } from '../utils/formatters';

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
  const { t, i18n } = useTranslation();
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-md w-full bg-surface border border-line rounded-2xl shadow-modal p-6 sm:p-7 space-y-5 fade-in my-8 text-ink">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-warning-soft border border-amber-100 rounded-xl text-warning">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-ink">
                {t('modals.counterOffer.title')}
              </h3>
              <p className="text-xs text-ink-muted">
                {t('modals.counterOffer.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-subtle hover:text-ink-muted hover:bg-surface-sunken rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Negotiation State Summary */}
        <div className="p-4 rounded-xl bg-surface-muted border border-line space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-ink-muted">{t('modals.counterOffer.currentOffer')}:</span>
            <span className="font-bold text-ink">
              {formatCurrency(offer.offeredPrice, i18n.language)}/{unit}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-muted">{t('common.quantity')}:</span>
            <span className="text-ink font-semibold">{formatNumber(offer.quantity, i18n.language)} {unit}</span>
          </div>
          {offer.message && (
            <p className="text-[11px] text-ink-muted italic bg-surface p-2.5 rounded-lg border border-line">
              &quot;{offer.message}&quot;
            </p>
          )}
        </div>

        {serverError && (
          <div className="p-3 rounded-lg bg-danger-soft border border-danger-edge text-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Counter Price */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
              {t('modals.counterOffer.counterRate', { unit })} *
            </label>
            <input
              type="number"
              step="0.01"
              {...register('counterPrice')}
              placeholder={String(offer.offeredPrice)}
              className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm font-medium"
            />
            {errors.counterPrice && <p className="text-xs text-danger">{errors.counterPrice.message}</p>}
          </div>

          {/* Adjusted Quantity (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
              {t('common.quantity')} ({unit})
            </label>
            <input
              type="number"
              step="0.001"
              {...register('counterQuantity')}
              placeholder={String(offer.quantity)}
              className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm font-medium"
            />
            {errors.counterQuantity && <p className="text-xs text-danger">{errors.counterQuantity.message}</p>}
          </div>

          {/* Real-time Calculation */}
          {totalValue > 0 && (
            <div className="p-3.5 rounded-xl bg-warning-soft border border-warning-edge text-xs flex items-center justify-between text-amber-900 font-medium">
              <span>{t('modals.makeOffer.estimatedSettlement')}:</span>
              <span className="font-bold text-amber-800 text-sm">
                {formatCurrency(Math.round(totalValue), i18n.language)}
              </span>
            </div>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
              {t('modals.counterOffer.note')}
            </label>
            <textarea
              rows={2}
              {...register('message')}
              placeholder={t('modals.makeOffer.deliveryTermsPlaceholder')}
              className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
            ></textarea>
          </div>

          {/* Actions */}
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
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>{t('modals.counterOffer.submit')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


