import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Handshake, Sprout, Check, RefreshCw, Clock, Eye, MapPin, MessageSquare,
  ShoppingBag, FileText, TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  PageHeader, StatCard, InlineAlert, FilterPills, EmptyState, SkeletonBlock,
  Button, ButtonLink, Card, StatusBadge, Tooltip, ConfirmDialog,
} from '../components/ui';
import AppLayout from '../layouts/AppLayout';
import CounterOfferModal from '../components/CounterOfferModal';
import CheckoutModal from '../components/CheckoutModal';
import OrderReceiptModal from '../components/OrderReceiptModal';
import RazorpayModal from '../components/RazorpayModal';
import { useAuth } from '../hooks/useAuth';
import {
  fetchMyOffersApi, fetchFarmerOffersApi,
  acceptOfferApi, rejectOfferApi, cancelOfferApi,
} from '../services/api';
import { getCropImageUrl, handleImageFallback } from '../utils/cropImages';
import { formatCurrency, formatNumber, formatDate, formatDateTime } from '../utils/formatters';

export default function OffersDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isFarmer = user?.role === 'FARMER';

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [alert, setAlert] = useState({ type: '', text: '' });
  const [activeModalOffer, setActiveModalOffer] = useState(null);
  const [checkoutOffer, setCheckoutOffer] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const filters = useMemo(() => [
    { id: '',          label: t('common.all', 'All') },
    { id: 'PENDING',   label: t('status.pending', 'Pending') },
    { id: 'COUNTERED', label: t('status.countered', 'Countered') },
    { id: 'ACCEPTED',  label: t('status.accepted', 'Accepted') },
    { id: 'REJECTED',  label: t('status.rejected', 'Declined') },
    { id: 'CANCELLED', label: t('status.cancelled', 'Cancelled') },
  ], [t]);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = isFarmer ? await fetchFarmerOffersApi(params) : await fetchMyOffersApi(params);
      if (res.success && Array.isArray(res.data)) setOffers(res.data);
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.message || t('common.error', 'Failed to load offers') });
    } finally {
      setLoading(false);
    }
  }, [isFarmer, statusFilter, t]);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  const handleAccept = async (offerId) => {
    setAlert({ type: '', text: '' });
    setActionLoadingId(offerId);
    try {
      await acceptOfferApi(offerId);
      setAlert({ type: 'success', text: t('common.saved', 'Offer accepted. Trade terms confirmed.') });
      await loadOffers();
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.message || t('common.error', 'Failed to accept offer') });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (offerId) => {
    const reason = window.prompt(t('modals.counterOffer.note', 'Optional: state a reason for declining this offer.'));
    if (reason === null) return;
    setAlert({ type: '', text: '' });
    setActionLoadingId(offerId);
    try {
      await rejectOfferApi(offerId, reason);
      setAlert({ type: 'success', text: t('status.rejected', 'Offer declined.') });
      await loadOffers();
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.message || t('common.error', 'Failed to decline offer') });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelOfferApi(cancelTarget.id);
      setAlert({ type: 'success', text: t('status.cancelled', 'Offer withdrawn.') });
      setCancelTarget(null);
      await loadOffers();
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.message || t('common.error', 'Failed to cancel offer') });
    } finally {
      setCancelling(false);
    }
  };

  const pending   = offers.filter((o) => o.status === 'PENDING').length;
  const countered = offers.filter((o) => o.status === 'COUNTERED').length;
  const accepted  = offers.filter((o) => o.status === 'ACCEPTED').length;

  return (
    <AppLayout>
      <div className="space-y-6 fade-in">
        <PageHeader
          icon={<Handshake />}
          eyebrow={isFarmer ? t('home.heroTag', 'Agricultural marketplace') : t('nav.myOffers', 'My Offers')}
          title={isFarmer ? t('offers.titleFarmer', 'Trade Offers & Negotiations') : t('offers.titleBuyer', 'My Submitted Offers')}
          subtitle={
            isFarmer
              ? t('offers.subtitleFarmer', 'Review incoming buyer offers, send counter-proposals, and finalize agricultural trade agreements.')
              : t('offers.subtitleBuyer', 'Track your price offers, review farmer counter-proposals, and complete consignment checkout.')
          }
          actions={
            <ButtonLink to="/marketplace" variant="secondary" icon={<Sprout className="w-4 h-4" />}>
              {t('footer.browseProduce', 'Browse produce')}
            </ButtonLink>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label={t('offers.tabs.all', 'Total offers')} value={offers.length} icon={<Handshake />} />
          <StatCard label={t('offers.tabs.pending', 'Pending')} value={pending} icon={<Clock />} tone="warning" />
          <StatCard label={t('offers.tabs.countered', 'Countered')} value={countered} icon={<RefreshCw />} tone="info" />
          <StatCard label={t('offers.tabs.accepted', 'Accepted')} value={accepted} icon={<Check />} tone="success" />
        </div>

        {alert.text && (
          <InlineAlert type={alert.type} message={alert.text} onDismiss={() => setAlert({ type: '', text: '' })} />
        )}

        <FilterPills items={filters} value={statusFilter} onChange={setStatusFilter} />

        {/* Offers list */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-5 space-y-4">
                <div className="flex items-center gap-3.5">
                  <SkeletonBlock className="w-12 h-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <SkeletonBlock className="h-4 w-1/3" />
                    <SkeletonBlock className="h-3 w-1/4" />
                  </div>
                </div>
                <SkeletonBlock className="h-16 w-full" />
              </Card>
            ))}
          </div>
        ) : offers.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title={t('offers.empty', 'No trade offers found')}
            message={
              statusFilter
                ? `No offers match status "${statusFilter}".`
                : t('offers.emptyDesc', 'Offers submitted or received for produce will appear here.')
            }
            action={{ label: t('home.browseMarketplace', 'Go to marketplace'), to: '/marketplace' }}
          />
        ) : (
          <div className="space-y-4 stagger">
            {offers.map((offer) => {
              const listing = offer.listing;
              const primaryImage = listing?.productImages?.[0]?.imageUrl;
              const totalVal = Number(offer.offeredPrice) * Number(offer.quantity);
              const askingPrice = Number(listing?.pricePerUnit || 0);
              const diffPct = askingPrice > 0 ? ((Number(offer.offeredPrice) - askingPrice) / askingPrice) * 100 : 0;
              const busy = actionLoadingId === offer.id;

              return (
                <Card key={offer.id} className="p-5 sm:p-6 space-y-4 hover:shadow-card-hover transition-shadow">
                  {/* Top: produce + status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-lg bg-surface-muted border border-line overflow-hidden shrink-0">
                        <img
                          src={getCropImageUrl(listing?.cropName, listing?.category?.name, primaryImage)}
                          alt={listing?.cropName || 'Produce'}
                          onError={(e) => handleImageFallback(e, listing?.cropName, listing?.category?.name)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/crops/${listing?.id}`}
                          className="font-semibold text-ink hover:text-brand-800 transition-colors flex items-center gap-1.5"
                        >
                          {listing?.cropName}
                          <Eye className="w-3.5 h-3.5 text-ink-subtle" />
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-ink-muted mt-0.5">
                          <span>{listing?.category?.name || 'Produce'}</span>
                          {listing?.location && (
                            <>
                              <span className="text-ink-subtle">·</span>
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-3 h-3 text-brand-700" />{listing.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <StatusBadge type="offer" status={offer.status} />
                  </div>

                  {/* Pricing grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-surface-muted/60 border border-line text-xs">
                    <div>
                      <span className="text-ink-subtle block">{t('offers.card.offeredRate', 'Offered Rate')}</span>
                      <div className="text-base font-semibold text-brand-800">
                        {formatCurrency(offer.offeredPrice)}
                        <span className="text-xs text-ink-subtle font-normal"> / {listing?.unit}</span>
                      </div>
                      {askingPrice > 0 && (
                        <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${diffPct < 0 ? 'text-warning' : 'text-success'}`}>
                          {diffPct < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                          {diffPct > 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-ink-subtle block">{t('offers.card.quantity', 'Quantity')}</span>
                      <div className="text-base font-semibold text-ink">
                        {formatNumber(offer.quantity)} {listing?.unit}
                      </div>
                    </div>
                    <div>
                      <span className="text-ink-subtle block">{t('offers.card.totalValue', 'Total Estimated Settlement')}</span>
                      <div className="text-base font-semibold text-brand-800">{formatCurrency(totalVal)}</div>
                    </div>
                    <div>
                      <span className="text-ink-subtle block">{isFarmer ? t('offers.card.buyer', 'Buyer') : t('offers.card.farmer', 'Farmer')}</span>
                      <div className="font-semibold text-ink truncate">
                        {isFarmer ? offer.buyer?.name || 'Buyer' : listing?.farmerProfile?.user?.name || 'Producer'}
                      </div>
                      <span className="text-[11px] text-ink-subtle truncate block">
                        {isFarmer ? offer.buyer?.phone || offer.buyer?.email : listing?.farmerProfile?.district || ''}
                      </span>
                    </div>
                  </div>

                  {/* Negotiation note */}
                  {offer.message && (
                    <div className="p-3.5 rounded-lg bg-surface-muted border border-line text-xs text-ink-muted">
                      <div className="flex items-center gap-1.5 text-ink-subtle font-semibold text-[11px] mb-1">
                        <MessageSquare className="w-3.5 h-3.5 text-brand-700" />
                        {t('offers.card.notes', 'Negotiation Note')}
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed text-ink">{offer.message}</p>
                    </div>
                  )}

                  {offer.expiresAt && (
                    <div className="flex items-center gap-1.5 text-[11px] text-ink-subtle">
                      <Clock className="w-3 h-3" />
                      {t('cropDetail.shelfLife', 'Valid until')} {formatDate(offer.expiresAt)}
                    </div>
                  )}

                  {/* Action bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line">
                    <span className="text-[11px] text-ink-subtle">
                      {formatDateTime(offer.createdAt)}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isFarmer && offer.status === 'PENDING' && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => handleReject(offer.id)} loading={busy}>
                            {t('offers.card.actions.decline', 'Decline')}
                          </Button>
                          <Button size="sm" variant="secondary" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => setActiveModalOffer(offer)} loading={busy}>
                            {t('offers.card.actions.counter', 'Counter Offer')}
                          </Button>
                          <Button size="sm" icon={<Check className="w-3.5 h-3.5" />} onClick={() => handleAccept(offer.id)} loading={busy}>
                            {t('offers.card.actions.accept', 'Accept Offer')}
                          </Button>
                        </>
                      )}

                      {!isFarmer && offer.status === 'COUNTERED' && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => handleReject(offer.id)} loading={busy}>
                            {t('offers.card.actions.decline', 'Decline')}
                          </Button>
                          <Button size="sm" variant="secondary" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => setActiveModalOffer(offer)} loading={busy}>
                            {t('offers.card.actions.counter', 'Counter Offer')}
                          </Button>
                          <Button size="sm" icon={<Check className="w-3.5 h-3.5" />} onClick={() => handleAccept(offer.id)} loading={busy}>
                            {t('offers.card.actions.accept', 'Accept Offer')}
                          </Button>
                        </>
                      )}

                      {!isFarmer && offer.status === 'PENDING' && (
                        <Button size="sm" variant="ghost" onClick={() => setCancelTarget(offer)} loading={busy}>
                          {t('offers.card.actions.cancel', 'Cancel Offer')}
                        </Button>
                      )}

                      {offer.status === 'ACCEPTED' && (
                        <>
                          {!isFarmer ? (
                            offer.order ? (
                              <Button size="sm" variant="secondary" icon={<FileText className="w-3.5 h-3.5" />} onClick={() => setReceiptOrder(offer.order)}>
                                {t('orders.card.actions.viewReceipt', 'Official Receipt')}
                              </Button>
                            ) : (
                              <Button size="sm" icon={<ShoppingBag className="w-3.5 h-3.5" />} onClick={() => setCheckoutOffer(offer)}>
                                {t('offers.card.actions.checkout', 'Proceed to Settlement & Pay')}
                              </Button>
                            )
                          ) : offer.order ? (
                            <Button size="sm" variant="secondary" icon={<FileText className="w-3.5 h-3.5" />} onClick={() => setReceiptOrder(offer.order)}>
                              {t('orders.card.actions.viewReceipt', 'Official Receipt')}
                            </Button>
                          ) : (
                            <span className="text-[11px] text-warning font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {t('common.loading', 'Awaiting buyer checkout')}
                            </span>
                          )}
                        </>
                      )}

                      <Tooltip label={t('common.view', 'View listing')}>
                        <Link
                          to={`/crops/${listing?.id}`}
                          className="w-7 h-7 flex items-center justify-center text-ink-subtle hover:text-brand-800 hover:bg-brand-50 rounded-lg border border-line transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Tooltip>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals (preserved wiring) */}
      <CounterOfferModal
        isOpen={Boolean(activeModalOffer)}
        onClose={() => setActiveModalOffer(null)}
        offer={activeModalOffer}
        isFarmer={isFarmer}
        onSuccess={() => {
          setAlert({ type: 'success', text: t('common.saved', 'Counteroffer sent.') });
          loadOffers();
        }}
      />
      <CheckoutModal
        isOpen={Boolean(checkoutOffer)}
        onClose={() => setCheckoutOffer(null)}
        offer={checkoutOffer}
        onSuccess={(createdOrder) => {
          setCheckoutOffer(null);
          setReceiptOrder(createdOrder);
          setAlert({ type: 'success', text: `Order #${createdOrder.id.slice(0, 13).toUpperCase()} confirmed.` });
          loadOffers();
        }}
      />
      <OrderReceiptModal
        isOpen={Boolean(receiptOrder)}
        onClose={() => setReceiptOrder(null)}
        order={receiptOrder}
        onPayNow={(o) => setPaymentOrder(o)}
      />
      <RazorpayModal
        isOpen={Boolean(paymentOrder)}
        onClose={() => setPaymentOrder(null)}
        order={paymentOrder}
        onSuccess={(settledOrder) => {
          setPaymentOrder(null);
          setAlert({
            type: 'success',
            text: `Payment settled via Razorpay.`,
          });
          loadOffers();
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        loading={cancelling}
        title={t('offers.card.actions.cancel', 'Withdraw offer?')}
        message="Are you sure you want to withdraw and cancel this trade offer?"
        confirmLabel={t('offers.card.actions.cancel', 'Withdraw')}
        cancelLabel={t('common.cancel', 'Cancel')}
        tone="danger"
      />
    </AppLayout>
  );
}
