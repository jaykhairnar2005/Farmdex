import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Package, Calendar, MapPin, User, ShoppingBag, RefreshCw, ArrowRight,
  FileText, CreditCard, Truck, Navigation, Clock,
} from 'lucide-react';
import {
  PageHeader, InlineAlert, FilterPills, EmptyState, SkeletonBlock, Button,
  ButtonLink, Card, StatusBadge, Badge, Tooltip,
} from '../components/ui';
import AppLayout from '../layouts/AppLayout';
import OrderReceiptModal from '../components/OrderReceiptModal';
import RazorpayModal from '../components/RazorpayModal';
import DispatchOrderModal from '../components/DispatchOrderModal';
import DeliveryTrackingModal from '../components/DeliveryTrackingModal';
import { useAuth } from '../hooks/useAuth';
import { fetchMyOrdersApi, fetchFarmerOrdersApi } from '../services/api';
import { getCropImageUrl, handleImageFallback } from '../utils/cropImages';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';

export default function Orders() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isFarmer = user?.role === 'FARMER';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [dispatchOrder, setDispatchOrder] = useState(null);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [paymentAlert, setPaymentAlert] = useState('');
  const [deliveryAlert, setDeliveryAlert] = useState('');

  const statusFilters = useMemo(() => [
    { id: '',          label: t('common.all', 'All') },
    { id: 'CONFIRMED', label: t('status.confirmed', 'Confirmed') },
    { id: 'PENDING',   label: t('status.pending', 'Pending') },
    { id: 'SHIPPED',   label: t('status.dispatched', 'Dispatched') },
    { id: 'DELIVERED', label: t('status.delivered', 'Delivered') },
    { id: 'CANCELLED', label: t('status.cancelled', 'Cancelled') },
  ], [t]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = isFarmer ? await fetchFarmerOrdersApi(params) : await fetchMyOrdersApi(params);
      if (res.success && Array.isArray(res.data)) setOrders(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('common.error', 'Failed to load orders'));
    } finally {
      setLoading(false);
    }
  }, [isFarmer, statusFilter, t]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const getPaymentBadge = (payment) => {
    if (payment?.status === 'SUCCESS')
      return <Badge colour="success" icon={<CreditCard className="w-3 h-3" />}>{t('status.paid', 'Paid')}</Badge>;
    if (payment?.status === 'FAILED')
      return <Badge colour="danger" icon={<CreditCard className="w-3 h-3" />}>{t('status.failed', 'Failed')}</Badge>;
    return <Badge colour="warning" icon={<Clock className="w-3 h-3" />}>{t('status.unpaid', 'Unpaid')}</Badge>;
  };

  const getDeliveryBadge = (delivery) => {
    const s = delivery?.status;
    if (!s || s === 'PENDING') return <Badge colour="default" icon={<Clock className="w-3 h-3" />}>{t('status.pending', 'Not dispatched')}</Badge>;
    return <StatusBadge type="order" status={s} />;
  };

  return (
    <AppLayout>
      <div className="space-y-6 fade-in">
        <PageHeader
          icon={<Package />}
          eyebrow={isFarmer ? t('home.heroTag', 'Agricultural marketplace') : t('nav.orders', 'Orders')}
          title={t('orders.title', 'Consignment Orders')}
          subtitle={t('orders.subtitle', 'Track purchase orders, confirm settlements, and follow real-time carrier dispatch updates.')}
          actions={
            <>
              <Button variant="secondary" size="sm" icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={loadOrders}>
                {t('common.refresh', 'Refresh')}
              </Button>
              <ButtonLink to="/offers" size="sm">{t('offers.titleFarmer', 'Manage offers')}</ButtonLink>
            </>
          }
        />

        {paymentAlert && (
          <InlineAlert type="success" message={paymentAlert} onDismiss={() => setPaymentAlert('')} />
        )}
        {deliveryAlert && (
          <InlineAlert type="info" message={deliveryAlert} onDismiss={() => setDeliveryAlert('')} />
        )}
        {error && <InlineAlert type="error" message={error} />}

        <FilterPills items={statusFilters} value={statusFilter} onChange={setStatusFilter} />

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-5 space-y-4">
                <SkeletonBlock className="h-5 w-1/2" />
                <SkeletonBlock className="h-20 w-full" />
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title={t('orders.empty', 'No orders found')}
            message={t('orders.emptyDesc', 'Confirmed transactions and dispatch shipments will be recorded here.')}
            action={{ label: t('offers.titleBuyer', 'View trade offers'), to: '/offers' }}
          />
        ) : (
          <div className="space-y-4 stagger">
            {orders.map((order) => {
              const item = order.orderItems?.[0];
              const listing = item?.listing;
              const photo = listing?.productImages?.[0]?.imageUrl;
              const qty = Number(item?.quantity || 0);
              const unitPrice = Number(item?.pricePerUnit || 0);
              const total = Number(order.totalAmount || 0);

              return (
                <Card key={order.id} className="p-5 space-y-4 hover:shadow-card-hover transition-shadow">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-brand-800">
                        #{order.id.slice(0, 13).toUpperCase()}
                      </span>
                      <StatusBadge type="order" status={order.status} size="sm" />
                      {getPaymentBadge(order.payment)}
                      {getDeliveryBadge(order.delivery)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-ink-subtle" />
                        {formatDate(order.createdAt)}
                      </span>
                      <button
                        onClick={() => setReceiptOrder(order)}
                        className="px-2.5 py-1 bg-surface hover:bg-surface-muted text-ink-muted hover:text-ink border border-line rounded-md transition-colors flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-brand-700" /> {t('orders.card.actions.viewReceipt', 'Receipt')}
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-lg bg-surface-muted border border-line overflow-hidden shrink-0">
                        <img
                          src={getCropImageUrl(listing?.cropName, listing?.category?.name, photo)}
                          alt={listing?.cropName || 'Produce'}
                          onError={(e) => handleImageFallback(e, listing?.cropName, listing?.category?.name)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-ink">{listing?.cropName || 'Produce batch'}</h4>
                        <p className="text-xs text-ink-muted">
                          {formatNumber(qty)} {listing?.unit || 'unit'} @ {formatCurrency(unitPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-ink-muted">
                        <User className="w-3.5 h-3.5 text-ink-subtle" />
                        {isFarmer ? `${t('orders.card.buyer', 'Buyer')}: ` : `${t('orders.card.farmer', 'Seller')}: `}
                        <strong className="text-ink font-medium">
                          {isFarmer ? order.buyer?.name : order.farmer?.name}
                        </strong>
                      </div>
                      <div className="flex items-start gap-1.5 text-ink-muted">
                        <MapPin className="w-3.5 h-3.5 text-ink-subtle shrink-0 mt-0.5" />
                        <span className="truncate">{order.shippingAddress}</span>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end justify-center gap-2">
                      <div className="text-left md:text-right">
                        <span className="text-[11px] text-ink-subtle block">{t('common.total', 'Total')}</span>
                        <span className="text-lg font-semibold text-brand-800">{formatCurrency(total)}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap md:justify-end">
                        {isFarmer && (
                          <>
                            {order.payment?.status === 'SUCCESS' ? (
                              !order.delivery || order.delivery.status === 'PENDING' ? (
                                <Button size="sm" icon={<Truck className="w-3.5 h-3.5" />} onClick={() => setDispatchOrder(order)}>
                                  {t('orders.card.actions.dispatchOrder', 'Dispatch Order')}
                                </Button>
                              ) : (
                                <Button size="sm" variant="secondary" icon={<Navigation className="w-3.5 h-3.5" />} onClick={() => setTrackingOrderId(order.id)}>
                                  {t('orders.card.actions.trackDelivery', 'Track Consignment')}
                                </Button>
                              )
                            ) : (
                              <Badge colour="warning">{t('status.unpaid', 'Awaiting payment')}</Badge>
                            )}
                          </>
                        )}
                        {!isFarmer && (
                          <>
                            {order.payment?.status !== 'SUCCESS' ? (
                              <Button size="sm" icon={<CreditCard className="w-3.5 h-3.5" />} onClick={() => setPaymentOrder(order)}>
                                {t('orders.card.actions.payNow', 'Pay with Razorpay')}
                              </Button>
                            ) : order.delivery?.trackingNumber ? (
                              <Button size="sm" variant="secondary" icon={<Truck className="w-3.5 h-3.5" />} onClick={() => setTrackingOrderId(order.id)}>
                                {t('orders.card.actions.trackDelivery', 'Track Consignment')}
                              </Button>
                            ) : (
                              <span className="text-xs text-ink-muted flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-warning" /> {t('status.preparing', 'Awaiting dispatch')}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Consignment strip */}
                  {order.delivery?.trackingNumber && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-brand-50/50 border border-brand-100 rounded-lg text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Truck className="w-3.5 h-3.5 text-brand-800" />
                        <span className="text-ink-muted">{t('modals.deliveryTracking.trackingNo', 'Consignment')}</span>
                        <span className="text-ink font-mono font-semibold">{order.delivery.trackingNumber}</span>
                        {order.delivery.estimatedDelivery && (
                          <span className="text-ink-muted">
                            · {t('modals.dispatch.estimatedDelivery', 'Est.')}: {formatDate(order.delivery.estimatedDelivery)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setTrackingOrderId(order.id)}
                        className="text-brand-800 hover:text-brand-900 font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                      >
                        {t('orders.card.actions.trackDelivery', 'Track Consignment')} <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <RazorpayModal
        isOpen={Boolean(paymentOrder)}
        onClose={() => setPaymentOrder(null)}
        order={paymentOrder}
        onSuccess={(updated) => {
          setPaymentOrder(null);
          setPaymentAlert(t('common.saved', 'Payment settled.'));
          loadOrders();
        }}
      />
      <DispatchOrderModal
        isOpen={Boolean(dispatchOrder)}
        onClose={() => setDispatchOrder(null)}
        order={dispatchOrder}
        onSuccess={(d) => {
          setDispatchOrder(null);
          setDeliveryAlert(`Consignment dispatched with tracking #${d?.trackingNumber || ''}.`);
          loadOrders();
        }}
      />
      <DeliveryTrackingModal
        isOpen={Boolean(trackingOrderId)}
        onClose={() => setTrackingOrderId(null)}
        orderId={trackingOrderId}
        isFarmer={isFarmer}
        onStatusUpdated={() => loadOrders()}
      />
      <OrderReceiptModal
        isOpen={Boolean(receiptOrder)}
        onClose={() => setReceiptOrder(null)}
        order={receiptOrder}
        onPayNow={(o) => setPaymentOrder(o)}
        onTrackDelivery={(id) => setTrackingOrderId(id)}
      />
    </AppLayout>
  );
}
