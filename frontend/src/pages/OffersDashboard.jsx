import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Handshake,
  Sprout,
  Check,
  X,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Filter,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  User,
  MapPin,
  Calendar,
  MessageSquare,
  ShoppingBag,
  FileText,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import CounterOfferModal from '../components/CounterOfferModal';
import CheckoutModal from '../components/CheckoutModal';
import OrderReceiptModal from '../components/OrderReceiptModal';
import RazorpayModal from '../components/RazorpayModal';
import { useAuth } from '../hooks/useAuth';
import {
  fetchMyOffersApi,
  fetchFarmerOffersApi,
  acceptOfferApi,
  rejectOfferApi,
  cancelOfferApi,
} from '../services/api';

export default function OffersDashboard() {
  const { user } = useAuth();
  const isFarmer = user?.role === 'FARMER';

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeModalOffer, setActiveModalOffer] = useState(null);
  const [checkoutOffer, setCheckoutOffer] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const res = isFarmer ? await fetchFarmerOffersApi(params) : await fetchMyOffersApi(params);
      if (res.success && Array.isArray(res.data)) {
        setOffers(res.data);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load offers',
      });
    } finally {
      setLoading(false);
    }
  }, [isFarmer, statusFilter]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const handleAccept = async (offerId) => {
    setMessage({ type: '', text: '' });
    setActionLoadingId(offerId);
    try {
      await acceptOfferApi(offerId);
      setMessage({ type: 'success', text: 'Offer accepted successfully! Trade terms confirmed.' });
      await loadOffers();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to accept offer',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (offerId) => {
    const reason = window.prompt('Optional: State a reason for declining this offer (e.g. Price too low, batch reserved):');
    if (reason === null) return; // cancelled prompt

    setMessage({ type: '', text: '' });
    setActionLoadingId(offerId);
    try {
      await rejectOfferApi(offerId, reason);
      setMessage({ type: 'success', text: 'Offer declined.' });
      await loadOffers();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to decline offer',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (offerId) => {
    if (!window.confirm('Are you sure you want to withdraw and cancel this trade offer?')) {
      return;
    }
    setMessage({ type: '', text: '' });
    setActionLoadingId(offerId);
    try {
      await cancelOfferApi(offerId);
      setMessage({ type: 'success', text: 'Offer withdrawn and cancelled.' });
      await loadOffers();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to cancel offer',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingCount = offers.filter((o) => o.status === 'PENDING').length;
  const counteredCount = offers.filter((o) => o.status === 'COUNTERED').length;
  const acceptedCount = offers.filter((o) => o.status === 'ACCEPTED').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-1">
              <Handshake className="w-4 h-4" />
              <span>Milestone 5 Real-Time Trading</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {isFarmer ? 'Incoming Produce Offers' : 'My Trade Offers & Negotiations'}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {isFarmer
                ? 'Review, accept, or counter price offers placed by buyers on your farm produce'
                : 'Track the negotiation status of your submitted purchase offers and counter-proposals'}
            </p>
          </div>

          <Link
            to="/marketplace"
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Sprout className="w-4 h-4 text-emerald-400" />
            <span>Browse Produce</span>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Total Offers</span>
            <div className="text-2xl font-bold text-white font-mono">{offers.length}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Awaiting Action</span>
            <div className="text-2xl font-bold text-amber-400 font-mono">{pendingCount}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">In Counteroffer</span>
            <div className="text-2xl font-bold text-purple-400 font-mono">{counteredCount}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Accepted Trades</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{acceptedCount}</div>
          </div>
        </div>

        {/* Alert Notification */}
        {message.text && (
          <div
            className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
          <span className="text-slate-500 flex items-center gap-1 font-semibold uppercase text-[10px] tracking-wider pr-2">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { id: '', label: 'All Offers' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'COUNTERED', label: 'Countered' },
            { id: 'ACCEPTED', label: 'Accepted' },
            { id: 'REJECTED', label: 'Declined' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center font-mono text-sm text-slate-400 space-y-2">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p>Loading trade offers &amp; negotiations...</p>
          </div>
        ) : offers.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center space-y-4 shadow-xl max-w-md mx-auto my-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Handshake className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg text-white">No Offers Found</h3>
            <p className="text-xs text-slate-400">
              {statusFilter
                ? `No offers currently match status "${statusFilter}".`
                : isFarmer
                ? "You haven't received any buyer offers on your produce listings yet."
                : "You haven't submitted any produce purchase offers yet. Explore the marketplace to negotiate directly with farmers."}
            </p>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
            >
              <Sprout className="w-4 h-4" /> Go to Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => {
              const listing = offer.listing;
              const primaryImage = listing?.productImages?.[0]?.imageUrl;
              const totalVal = Number(offer.offeredPrice) * Number(offer.quantity);
              const askingPrice = Number(listing?.pricePerUnit || 0);
              const diffPct =
                askingPrice > 0 ? ((Number(offer.offeredPrice) - askingPrice) / askingPrice) * 100 : 0;

              // Status styles
              let statusBadge = 'bg-slate-800 text-slate-300 border-slate-700';
              if (offer.status === 'PENDING') statusBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
              if (offer.status === 'COUNTERED') statusBadge = 'bg-purple-500/15 text-purple-300 border-purple-500/40 animate-pulse';
              if (offer.status === 'ACCEPTED') statusBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
              if (offer.status === 'REJECTED') statusBadge = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
              if (offer.status === 'CANCELLED') statusBadge = 'bg-slate-800 text-slate-400 border-slate-700';

              const isActionBusy = actionLoadingId === offer.id;

              return (
                <div
                  key={offer.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl hover:border-slate-700 transition-all space-y-4"
                >
                  {/* Top Bar: Produce Info & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {primaryImage ? (
                          <img src={primaryImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Sprout className="w-6 h-6 text-emerald-500/30" />
                        )}
                      </div>
                      <div>
                        <Link
                          to={`/crops/${listing?.id}`}
                          className="font-bold text-base text-white hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                        >
                          {listing?.cropName}
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{listing?.category?.name || 'Produce'}</span>
                          {listing?.location && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                {listing.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border uppercase ${statusBadge}`}>
                        {offer.status}
                      </span>
                    </div>
                  </div>

                  {/* Pricing Comparison Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800/60 text-xs">
                    <div>
                      <span className="text-slate-500 block">Offered Unit Price</span>
                      <div className="text-lg font-bold text-emerald-400 font-mono">
                        ₹{Number(offer.offeredPrice).toLocaleString('en-IN')}
                        <span className="text-xs text-slate-400 font-normal"> / {listing?.unit}</span>
                      </div>
                      {askingPrice > 0 && (
                        <span
                          className={`text-[10px] font-mono font-semibold flex items-center gap-0.5 ${
                            diffPct < 0 ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {diffPct < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                          {diffPct > 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`} vs asking (₹{askingPrice})
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-500 block">Offered Quantity</span>
                      <div className="text-base font-bold text-slate-200 font-mono">
                        {Number(offer.quantity).toLocaleString('en-IN')} {listing?.unit}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Total Trade Amount</span>
                      <div className="text-base font-bold text-emerald-400 font-mono">
                        ₹{Math.round(totalVal).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 block">Negotiating Party</span>
                      <div className="font-semibold text-slate-300 truncate">
                        {isFarmer ? offer.buyer?.name || 'Registered Buyer' : listing?.farmerProfile?.user?.name || 'Producer'}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {isFarmer ? offer.buyer?.phone || offer.buyer?.email : listing?.farmerProfile?.district || 'Verified'}
                      </span>
                    </div>
                  </div>

                  {/* Negotiation Notes History */}
                  {offer.message && (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Negotiation History &amp; Terms:</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap font-mono text-[11px] text-slate-200">
                        {offer.message}
                      </p>
                    </div>
                  )}

                  {/* Expiry Note */}
                  {offer.expiresAt && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Valid until: {new Date(offer.expiresAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  )}

                  {/* Contextual Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-mono text-slate-500">
                      Placed on {new Date(offer.createdAt).toLocaleString('en-IN')}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Farmer actions on PENDING offer */}
                      {isFarmer && offer.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleReject(offer.id)}
                            disabled={isActionBusy}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => setActiveModalOffer(offer)}
                            disabled={isActionBusy}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Counteroffer
                          </button>
                          <button
                            onClick={() => handleAccept(offer.id)}
                            disabled={isActionBusy}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept Offer
                          </button>
                        </>
                      )}

                      {/* Buyer actions on COUNTERED offer */}
                      {!isFarmer && offer.status === 'COUNTERED' && (
                        <>
                          <button
                            onClick={() => handleReject(offer.id)}
                            disabled={isActionBusy}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => setActiveModalOffer(offer)}
                            disabled={isActionBusy}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Re-Counter
                          </button>
                          <button
                            onClick={() => handleAccept(offer.id)}
                            disabled={isActionBusy}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept Counter
                          </button>
                        </>
                      )}

                      {/* Buyer cancel on PENDING */}
                      {!isFarmer && offer.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(offer.id)}
                          disabled={isActionBusy}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Withdraw Offer
                        </button>
                      )}

                      {/* ACCEPTED Offer Actions (Milestone 6 Checkout & Receipt) */}
                      {offer.status === 'ACCEPTED' && (
                        <>
                          {!isFarmer ? (
                            offer.order ? (
                              <button
                                onClick={() => setReceiptOrder(offer.order)}
                                className="px-3.5 py-1.5 bg-emerald-950/60 border border-emerald-500/30 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                              >
                                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                                <span>View Receipt</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setCheckoutOffer(offer)}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center gap-1.5 cursor-pointer animate-pulse hover:animate-none"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>Proceed to Checkout</span>
                              </button>
                            )
                          ) : offer.order ? (
                            <button
                              onClick={() => setReceiptOrder(offer.order)}
                              className="px-3.5 py-1.5 bg-emerald-950/60 border border-emerald-500/30 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-400" />
                              <span>View Order Receipt</span>
                            </button>
                          ) : (
                            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-mono rounded-lg flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Awaiting Buyer Checkout</span>
                            </span>
                          )}
                        </>
                      )}

                      {/* View Produce Details */}
                      <Link
                        to={`/crops/${listing?.id}`}
                        className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 transition-colors"
                        title="View Listing Page"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Counter Offer Modal */}
        <CounterOfferModal
          isOpen={Boolean(activeModalOffer)}
          onClose={() => setActiveModalOffer(null)}
          offer={activeModalOffer}
          isFarmer={isFarmer}
          onSuccess={() => {
            setMessage({ type: 'success', text: 'Counteroffer sent successfully!' });
            loadOffers();
          }}
        />

        {/* Milestone 6: Checkout Modal */}
        <CheckoutModal
          isOpen={Boolean(checkoutOffer)}
          onClose={() => setCheckoutOffer(null)}
          offer={checkoutOffer}
          onSuccess={(createdOrder) => {
            setCheckoutOffer(null);
            setReceiptOrder(createdOrder);
            setMessage({
              type: 'success',
              text: `Order #${createdOrder.id.slice(0, 13).toUpperCase()} confirmed successfully!`,
            });
            loadOffers();
          }}
        />

        {/* Milestone 6 & 7: Order Receipt Modal */}
        <OrderReceiptModal
          isOpen={Boolean(receiptOrder)}
          onClose={() => setReceiptOrder(null)}
          order={receiptOrder}
          onPayNow={(orderToPay) => setPaymentOrder(orderToPay)}
        />

        {/* Milestone 7: Razorpay Test Mode Payment Modal */}
        <RazorpayModal
          isOpen={Boolean(paymentOrder)}
          onClose={() => setPaymentOrder(null)}
          order={paymentOrder}
          onSuccess={(settledOrder) => {
            setPaymentOrder(null);
            setMessage({
              type: 'success',
              text: `Payment for Order #${(settledOrder?.id || paymentOrder?.id || '').slice(0, 13).toUpperCase()} settled successfully via Razorpay!`,
            });
            loadOffers();
          }}
        />
      </main>
    </div>
  );
}
