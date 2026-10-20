import React from 'react';
import {
  X,
  CheckCircle2,
  Printer,
  Sprout,
  MapPin,
  User,
  Phone,
  ArrowRight,
  CreditCard,
  Truck,
  Navigation,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
} from '../utils/formatters';

export default function OrderReceiptModal({ isOpen, onClose, order, onPayNow, onTrackDelivery }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  if (!isOpen || !order) return null;

  const item = order.orderItems?.[0];
  const listing = item?.listing;
  const quantity = Number(item?.quantity || 0);
  const unitPrice = Number(item?.pricePerUnit || 0);
  const totalAmount = Number(order.totalAmount || 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs fade-in">
      <div className="relative w-full max-w-xl bg-surface border border-line rounded-2xl shadow-modal overflow-hidden flex flex-col max-h-[92vh] text-ink">
        {/* Receipt Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-100 bg-brand-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-100 border border-brand-200 text-brand-800 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-800">
                {t('modals.orderReceipt.title')}
              </span>
              <h3 className="text-lg font-bold text-ink">
                {t('modals.orderReceipt.orderConfirmed')}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 bg-surface hover:bg-surface-muted text-ink border border-line rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title={t('modals.orderReceipt.print')}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('modals.orderReceipt.print')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-ink-subtle hover:text-ink-muted rounded-lg hover:bg-surface/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 font-sans">
          {/* Order Ref & Status Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-muted border border-line rounded-xl">
            <div>
              <span className="text-[11px] text-ink-muted font-mono block">
                {t('orders.card.orderId', { id: '' }).replace('#', '').trim()}
              </span>
              <span className="text-sm font-bold font-mono text-brand-800">
                #{order.id.slice(0, 13).toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:text-right">
              <div>
                <span className="text-[11px] text-ink-muted block">{t('orders.card.date')}</span>
                <span className="text-xs text-ink font-medium">
                  {formatDate(order.createdAt, i18n.language)}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-brand-50 border border-brand-200 text-brand-800 text-xs font-semibold rounded-full">
                {t(`status.${order.status?.toLowerCase()}`, order.status)}
              </span>
            </div>
          </div>

          {/* Purchased Produce Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">
              {t('orders.card.items')}
            </h4>
            <div className="border border-line rounded-xl overflow-hidden bg-surface shadow-card">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted border-b border-line text-ink-muted">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">{t('modals.cropListing.cropName')}</th>
                    <th className="py-2.5 px-4 text-center font-semibold">{t('common.quantity')}</th>
                    <th className="py-2.5 px-4 text-right font-semibold">{t('offers.card.offeredRate')}</th>
                    <th className="py-2.5 px-4 text-right font-semibold">{t('common.total')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-ink flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-brand-800" />
                      {listing?.cropName || t('offers.card.crop')}
                    </td>
                    <td className="py-3 px-4 text-center font-medium">
                      {formatNumber(quantity, i18n.language)} {listing?.unit || t('common.unit')}
                    </td>
                    <td className="py-3 px-4 text-right text-ink-muted">
                      {formatCurrency(unitPrice, i18n.language)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-ink">
                      {formatCurrency(totalAmount, i18n.language)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Total Calculation Row */}
              <div className="p-4 bg-surface-muted/70 border-t border-line flex items-center justify-between text-sm">
                <span className="font-semibold text-ink">{t('modals.orderReceipt.totalSettlement')}</span>
                <span className="text-lg font-bold text-brand-800 font-mono">
                  {formatCurrency(totalAmount, i18n.language)}
                </span>
              </div>
            </div>
          </div>

          {/* Razorpay Settlement Details Card */}
          <div className="p-4 bg-surface-muted border border-line rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-brand-50 border border-brand-200 text-brand-800 rounded-lg">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-ink-muted block">{t('orders.card.payment')}</span>
                  <span className="font-bold text-ink flex items-center gap-1.5">
                    Razorpay <span className="text-[10px] text-warning font-medium">({t('checkout.gatewaySimulator', 'Test Mode Simulator')})</span>
                  </span>
                </div>
              </div>

              <div>
                {order.payment?.status === 'SUCCESS' ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-success-soft text-success border border-success-edge flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {t('status.paid')}
                  </span>
                ) : order.payment?.status === 'FAILED' ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-danger-soft text-danger border border-danger-edge flex items-center gap-1">
                    {t('status.failed')}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-warning-soft text-warning border border-warning-edge flex items-center gap-1">
                    {t('status.pending')}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-line/80 text-[11px]">
              <div>
                <span className="text-ink-muted block">{t('modals.orderReceipt.transactionRef')}</span>
                <span className="text-ink font-mono font-medium">
                  {order.payment?.transactionId ? (
                    <span className="text-brand-800">{order.payment.transactionId}</span>
                  ) : (
                    <span className="text-ink-subtle italic font-sans">{t('status.pending')}</span>
                  )}
                </span>
              </div>
              <div className="text-right">
                <span className="text-ink-muted block">{t('modals.orderReceipt.settledAt')}</span>
                <span className="text-ink">
                  {order.payment?.paidAt
                    ? formatDateTime(order.payment.paidAt, i18n.language)
                    : t('status.unverified')}
                </span>
              </div>
            </div>

            {order.payment?.status !== 'SUCCESS' && onPayNow && (
              <div className="pt-2 border-t border-line flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPayNow(order);
                  }}
                  className="px-4 py-2 bg-brand-800 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>{t('orders.card.actions.payNow')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Consignment & Delivery Tracking Card */}
          <div className="p-4 bg-surface-muted border border-line rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-info-soft border border-blue-200 text-info rounded-lg">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-ink-muted block">{t('modals.orderReceipt.consignmentTracking')}</span>
                  <span className="font-bold text-ink flex items-center gap-1.5 font-mono">
                    {order.delivery?.trackingNumber || (
                      <span className="text-ink-subtle italic font-sans font-normal">{t('status.preparing')}</span>
                    )}
                  </span>
                </div>
              </div>

              <div>
                {order.delivery?.status === 'DELIVERED' ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-success-soft text-success border border-success-edge flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {t('status.delivered')}
                  </span>
                ) : order.delivery?.status === 'OUT_FOR_DELIVERY' ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-warning-soft text-warning border border-warning-edge flex items-center gap-1">
                    <Truck className="w-3 h-3" /> {t('status.outForDelivery')}
                  </span>
                ) : order.delivery?.status === 'IN_TRANSIT' ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                    <Navigation className="w-3 h-3" /> {t('status.inTransit')}
                  </span>
                ) : order.delivery?.status === 'DISPATCHED' ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-info-soft text-info border border-blue-200 flex items-center gap-1">
                    <Truck className="w-3 h-3" /> {t('status.dispatched')}
                  </span>
                ) : order.delivery?.status === 'PREPARING' ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                    {t('status.preparing')}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-sunken text-ink-muted border border-line">
                    {t('status.pending')}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-line/80 text-[11px]">
              <div>
                <span className="text-ink-muted block">{t('modals.dispatch.estimatedDelivery')}</span>
                <span className="text-ink">
                  {order.delivery?.estimatedDelivery
                    ? formatDate(order.delivery.estimatedDelivery, i18n.language)
                    : t('status.pending')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-ink-muted block">{t('modals.deliveryTracking.steps.dispatched')}</span>
                <span className="text-ink">
                  {order.delivery?.shippedAt
                    ? formatDateTime(order.delivery.shippedAt, i18n.language)
                    : t('status.pending')}
                </span>
              </div>
            </div>

            {onTrackDelivery && (
              <div className="pt-2 border-t border-line flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTrackDelivery(order.id);
                  }}
                  className="px-4 py-2 bg-surface hover:bg-surface-muted text-brand-800 border border-line rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-card"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{t('orders.card.actions.trackDelivery')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Parties & Delivery Coordinate Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Farmer / Seller */}
            <div className="p-4 bg-surface-muted border border-line rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-ink-muted font-semibold text-[11px]">
                <User className="w-3.5 h-3.5 text-brand-800" />
                <span>{t('modals.orderReceipt.seller')}</span>
              </div>
              <p className="font-bold text-ink text-sm">{order.farmer?.name || t('offers.card.farmer')}</p>
              {order.farmer?.phone && (
                <p className="text-ink-muted flex items-center gap-1">
                  <Phone className="w-3 h-3 text-ink-subtle" /> {order.farmer.phone}
                </p>
              )}
            </div>

            {/* Buyer / Customer */}
            <div className="p-4 bg-surface-muted border border-line rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-ink-muted font-semibold text-[11px]">
                <User className="w-3.5 h-3.5 text-info" />
                <span>{t('modals.orderReceipt.buyer')}</span>
              </div>
              <p className="font-bold text-ink text-sm">{order.buyer?.name || t('offers.card.buyer')}</p>
              {order.buyer?.phone && (
                <p className="text-ink-muted flex items-center gap-1">
                  <Phone className="w-3 h-3 text-ink-subtle" /> {order.buyer.phone}
                </p>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="p-4 bg-surface-muted border border-line rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-ink-muted font-semibold text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-brand-800" />
              <span>{t('modals.orderReceipt.destination')}</span>
            </div>
            <p className="text-ink leading-relaxed">{order.shippingAddress}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-line bg-surface-muted/70">
          <button
            onClick={() => {
              onClose();
              navigate('/orders');
            }}
            className="text-xs text-brand-800 hover:text-brand-800 font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>{t('orders.tabs.all')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-brand-800 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}


