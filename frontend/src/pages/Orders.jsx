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

  const orderStats = useMemo(() => {
    const totalCount = orders.length;
    const totalVolume = orders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
    const inTransitCount = orders.filter((o) => o.delivery?.status === 'IN_TRANSIT' || o.delivery?.status === 'SHIPPED').length;
    const deliveredCount = orders.filter((o) => o.status === 'DELIVERED' || o.delivery?.status === 'DELIVERED').length;
    return { totalCount, totalVolume, inTransitCount, deliveredCount };
  }, [orders]);

  return (
    <AppLayout>
      <div className="space-y-6 fade-in">
        <PageHeader
          icon={<Package />}
          eyebrow={isFarmer ? t('home.heroTag', 'Agricultural marketplace') : t('nav.orders', 'Orders')}
          title={t('orders.title', 'Consignment Orders & Fulfillment')}
          subtitle={t('orders.subtitle', 'Track purchase orders, confirm settlements, and follow real-time carrier dispatch updates.')}
          actions={
            <>
              <Button variant="secondary" size="sm" icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={loadOrders}>
                {t('common.refresh', 'Refresh')}
              </Button>
              <ButtonLink to="/offers" size="sm" variant="lime">{t('offers.titleFarmer', 'Manage Offers')}</ButtonLink>
            </>
          }
        />

        {/* Executive Order KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4.5 rounded-2xl border border-line shadow-card">
            <span className="text-[11px] uppercase tracking-wider text-ink-subtle font-semibold block">Total Orders</span>
            <div className="text-2xl font-extrabold text-ink font-heading mt-1">{orderStats.totalCount}</div>
            <span className="text-[11px] text-ink-muted">Recorded transactions</span>
          </Card>
          <Card className="p-4.5 rounded-2xl border border-line shadow-card">
            <span className="text-[11px] uppercase tracking-wider text-ink-subtle font-semibold block">Trade Volume</span>
            <div className="text-2xl font-extrabold text-brand-800 dark:text-lime-400 font-mono mt-1">{formatCurrency(orderStats.totalVolume)}</div>
            <span className="text-[11px] text-ink-muted">Settled & pending</span>
          </Card>
          <Card className="p-4.5 rounded-2xl border border-line shadow-card">
            <span className="text-[11px] uppercase tracking-wider text-ink-subtle font-semibold block">In Transit</span>
            <div className="text-2xl font-extrabold text-lime-600 dark:text-lime-400 font-heading mt-1">{orderStats.inTransitCount}</div>
            <span className="text-[11px] text-ink-muted">Live waybill dispatches</span>
          </Card>
          <Card className="p-4.5 rounded-2xl border border-line shadow-card">
            <span className="text-[11px] uppercase tracking-wider text-ink-subtle font-semibold block">Completed</span>
            <div className="text-2xl font-extrabold text-ink font-heading mt-1">{orderStats.deliveredCount}</div>
            <span className="text-[11px] text-ink-muted">Delivered consignments</span>
          </Card>
        </div>

        {paymentAlert && (
          <InlineAlert type="success" message={paymentAlert} onDismiss={() => setPaymentAlert('')} />
        )}
        {deliveryAlert && (
          <InlineAlert type="info" message={deliveryAlert} onDismiss={() => setDeliveryAlert('')} />
        )}
        {error && <InlineAlert type="error" message={error} />}

        <div className="bg-surface p-2 rounded-2xl border border-line shadow-card inline-block">
          <FilterPills items={statusFilters} value={statusFilter} onChange={setStatusFilter} />
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-6 space-y-4 rounded-2xl border border-line">
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
                <Card key={order.id} className="p-5 sm:p-6 space-y-5 rounded-2xl border border-line hover:shadow-card-hover transition-all shadow-card card-lift">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-line">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-brand-800 dark:text-lime-400 bg-brand-50 dark:bg-brand-900/40 px-2.5 py-1 rounded-lg border border-brand-200/50">
                        #{order.id.slice(0, 13).toUpperCase()}
                      </span>
                      <StatusBadge type="order" status={order.status} size="sm" />
                      {getPaymentBadge(order.payment)}
                      {getDeliveryBadge(order.delivery)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-muted">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-ink-subtle" />
                        {formatDate(order.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setReceiptOrder(order)}
                        className="px-3 py-1 bg-surface hover:bg-surface-muted text-ink-muted hover:text-ink border border-line rounded-lg transition-colors flex items-center gap-1.5 font-bold cursor-pointer text-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-brand-700 dark:text-lime-400" /> {t('orders.card.actions.viewReceipt', 'Receipt')}
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-surface-muted border border-line overflow-hidden shrink-0 shadow-sm">
                        <img
                          src={getCropImageUrl(listing?.cropName, listing?.category?.name, photo)}
                          alt={listing?.cropName || 'Produce'}
                          onError={(e) => handleImageFallback(e, listing?.cropName, listing?.category?.name)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-ink font-heading">{listing?.cropName || 'Produce batch'}</h4>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {formatNumber(qty)} {listing?.unit || 'unit'} @ <span className="font-mono font-semibold">{formatCurrency(unitPrice)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs bg-surface-muted/50 p-3 rounded-xl border border-line/60">
                      <div className="flex items-center gap-1.5 text-ink-muted">
                        <User className="w-3.5 h-3.5 text-ink-subtle" />
                        <span>{isFarmer ? `${t('orders.card.buyer', 'Buyer')}: ` : `${t('orders.card.farmer', 'Seller')}: `}</span>
                        <strong className="text-ink font-semibold">
                          {isFarmer ? order.buyer?.name : order.farmer?.name}
                        </strong>
                      </div>
                      <div className="flex items-start gap-1.5 text-ink-muted">
                        <MapPin className="w-3.5 h-3.5 text-ink-subtle shrink-0 mt-0.5" />
                        <span className="truncate">{order.shippingAddress}</span>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end justify-center gap-2.5">
                      <div className="text-left md:text-right">
                        <span className="text-[11px] uppercase tracking-wider text-ink-subtle font-semibold block">{t('common.total', 'Settlement Amount')}</span>
                        <span className="text-xl font-extrabold text-brand-800 dark:text-lime-400 font-mono">{formatCurrency(total)}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap md:justify-end">
                        {isFarmer && (
                          <>
                            {order.payment?.status === 'SUCCESS' ? (
                              !order.delivery || order.delivery.status === 'PENDING' ? (
                                <Button size="sm" variant="lime" icon={<Truck className="w-3.5 h-3.5" />} onClick={() => setDispatchOrder(order)}>
                                  {t('orders.card.actions.dispatchOrder', 'Dispatch Order')}
                                </Button>
                              ) : (
                                <Button size="sm" variant="secondary" icon={<Navigation className="w-3.5 h-3.5" />} onClick={() => setTrackingOrderId(order.id)}>
                                  {t('orders.card.actions.trackDelivery', 'Track Consignment')}
                                </Button>
                              )
                            ) : (
                              <Badge colour="warning">{t('status.unpaid', 'Awaiting Payment')}</Badge>
                            )}
                          </>
                        )}
                        {!isFarmer && (
                          <>
                            {order.payment?.status !== 'SUCCESS' ? (
                              <Button size="sm" variant="lime" icon={<CreditCard className="w-3.5 h-3.5" />} onClick={() => setPaymentOrder(order)}>
                                {t('orders.card.actions.payNow', 'Pay with Razorpay')}
                              </Button>
                            ) : order.delivery?.trackingNumber ? (
                              <Button size="sm" variant="secondary" icon={<Truck className="w-3.5 h-3.5" />} onClick={() => setTrackingOrderId(order.id)}>
                                {t('orders.card.actions.trackDelivery', 'Track Consignment')}
                              </Button>
                            ) : (
                              <span className="text-xs text-ink-muted flex items-center gap-1.5 font-medium bg-warning-soft px-2.5 py-1 rounded-lg">
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-brand-50/70 dark:bg-brand-900/30 border border-brand-200/60 dark:border-brand-800 rounded-xl text-xs">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="p-1 rounded bg-brand-100 dark:bg-brand-800 text-brand-900 dark:text-lime-300">
                          <Truck className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-ink-muted">{t('modals.deliveryTracking.trackingNo', 'Consignment Waybill')}:</span>
                        <span className="text-ink font-mono font-bold">{order.delivery.trackingNumber}</span>
                        {order.delivery.estimatedDelivery && (
                          <span className="text-ink-muted">
                            · {t('modals.dispatch.estimatedDelivery', 'Est.')}: <strong>{formatDate(order.delivery.estimatedDelivery)}</strong>
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setTrackingOrderId(order.id)}
                        className="text-brand-800 dark:text-lime-400 hover:underline font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
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
