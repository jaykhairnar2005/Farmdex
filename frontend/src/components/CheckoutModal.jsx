import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  ShieldCheck,
  MapPin,
  Sprout,
  AlertCircle,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createOrderApi } from '../services/api';
import { formatCurrency, formatNumber } from '../utils/formatters';

export default function CheckoutModal({ isOpen, onClose, offer, onSuccess }) {
  const { t, i18n } = useTranslation();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs fade-in">
      <div className="relative w-full max-w-lg bg-surface border border-line rounded-2xl shadow-modal overflow-hidden flex flex-col max-h-[90vh] text-ink">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-line bg-surface-muted/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 border border-brand-100 text-brand-800 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                {t('modals.checkout.title')}
              </h3>
              <p className="text-xs text-ink-muted">{t('modals.checkout.subtitle')}</p>
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

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-danger-soft border border-danger-edge text-danger text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Agreed Produce Summary Card */}
          <div className="p-4 rounded-xl bg-surface-muted border border-line space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-800 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                  {t('status.accepted')}
                </span>
                <h4 className="text-base font-bold text-ink flex items-center gap-2 mt-1">
                  <Sprout className="w-4 h-4 text-brand-800" />
                  {listing?.cropName || 'Produce Listing'}
                </h4>
                <p className="text-xs text-ink-muted">
                  {t('orders.card.farmer')}:{' '}
                  <span className="text-ink font-medium">
                    {farmer?.name || listing?.farmerProfile?.farmName || 'Farmer'}
                  </span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-ink-muted">{t('modals.makeOffer.offerRate')}</span>
                <div className="text-base font-bold text-brand-800">
                  {formatCurrency(agreedPrice, i18n.language)}{' '}
                  <span className="text-xs font-normal text-ink-muted">/ {listing?.unit || 'unit'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-line/80 text-xs">
              <div>
                <span className="text-ink-muted block text-[11px]">{t('common.quantity')}</span>
                <span className="text-ink font-bold">
                  {formatNumber(quantity, i18n.language)} {listing?.unit || 'units'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-ink-muted block text-[11px]">{t('orders.card.total')}</span>
                <span className="text-brand-800 font-extrabold text-sm">
                  {formatCurrency(totalAmount, i18n.language)}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping / Delivery Address Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-ink flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-800" />
              {t('modals.checkout.shippingAddress')} <span className="text-danger">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder={t('modals.checkout.shippingPlaceholder')}
              className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder:text-ink-subtle transition-colors resize-none"
            />
            <p className="text-[11px] text-ink-muted flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-ink-subtle" /> {t('modals.checkout.paymentNotice')}
            </p>
          </div>

          {/* Security & Guarantee Trust Banner */}
          <div className="p-3.5 rounded-xl bg-info-soft border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-info shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">{t('footer.verifiedSettlement')}</p>
              <p className="text-[11px] text-info leading-relaxed mt-0.5">
                {t('modals.checkout.paymentNotice')}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 bg-surface hover:bg-surface-muted text-ink rounded-lg border border-line text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>{t('common.submitting')}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('modals.checkout.confirmPay')} ({formatCurrency(totalAmount, i18n.language)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


