import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Sprout,
  Calendar,
  MapPin,
  User,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Printer,
  Eye,
  Filter,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  FileText,
  CreditCard,
  ShieldCheck,
  Truck,
  Navigation,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import OrderReceiptModal from '../components/OrderReceiptModal';
import RazorpayModal from '../components/RazorpayModal';
import DispatchOrderModal from '../components/DispatchOrderModal';
import DeliveryTrackingModal from '../components/DeliveryTrackingModal';
import { useAuth } from '../hooks/useAuth';
import { fetchMyOrdersApi, fetchFarmerOrdersApi } from '../services/api';

export default function Orders() {
  const { user } = useAuth();
  const isFarmer = user?.role === 'FARMER';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState(null);
  const [selectedDispatchOrder, setSelectedDispatchOrder] = useState(null);
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState(null);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState('');
  const [deliverySuccessMessage, setDeliverySuccessMessage] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const res = isFarmer ? await fetchFarmerOrdersApi(params) : await fetchMyOrdersApi(params);
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [isFarmer, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'SHIPPED':
      case 'DISPATCHED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1 font-mono">
            <Truck className="w-3 h-3" /> Dispatched
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1 font-mono">
            <Navigation className="w-3 h-3" /> In Transit
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 font-mono animate-pulse">
            <Truck className="w-3 h-3" /> Out for Delivery
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 font-mono">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 font-mono">
            {status}
          </span>
        );
    }
  };

  const getPaymentBadge = (payment) => {
    if (payment?.status === 'SUCCESS') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
          <CreditCard className="w-3 h-3 text-emerald-400" /> Paid (Razorpay)
        </span>
      );
    }
    if (payment?.status === 'FAILED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 font-mono">
          <AlertCircle className="w-3 h-3 text-rose-400" /> Payment Failed
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 font-mono">
        <Clock className="w-3 h-3 text-amber-400" /> Payment Pending
      </span>
    );
  };

  const getDeliveryBadge = (delivery) => {
    const status = delivery?.status;
    if (!status || status === 'PENDING') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700/60 font-mono flex items-center gap-1">
          <Clock className="w-3 h-3" /> Unfulfilled
        </span>
      );
    }
    if (status === 'PREPARING') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono flex items-center gap-1">
          <Package className="w-3 h-3" /> Preparing
        </span>
      );
    }
    if (status === 'DISPATCHED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono flex items-center gap-1">
          <Truck className="w-3 h-3" /> Dispatched
        </span>
      );
    }
    if (status === 'IN_TRANSIT') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono flex items-center gap-1">
          <Navigation className="w-3 h-3" /> In Transit
        </span>
      );
    }
    if (status === 'OUT_FOR_DELIVERY') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono flex items-center gap-1 animate-pulse">
          <Truck className="w-3 h-3" /> Out for Delivery
        </span>
      );
    }
    if (status === 'DELIVERED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
          <CheckCircle2 className="w-3 h-3" /> Delivered
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                {isFarmer ? 'Produce Sales & Logistics' : 'My Purchase Orders & Tracking'}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Milestones 6, 7 &amp; 8
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                {isFarmer
                  ? 'Manage confirmed orders, dispatch consignments & update delivery checkpoints'
                  : 'Track agricultural trades, Razorpay payments & real-time delivery timelines'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadOrders}
              disabled={loading}
              className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              to="/offers"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
            >
              <span>Manage Offers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Status Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {['', 'CONFIRMED', 'PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === s
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              {s === '' ? 'All Orders' : s}
            </button>
          ))}
        </div>

        {deliverySuccessMessage && (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 shrink-0" />
              <span>{deliverySuccessMessage}</span>
            </div>
            <button
              onClick={() => setDeliverySuccessMessage('')}
              className="text-xs text-blue-300 hover:text-white cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {paymentSuccessMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{paymentSuccessMessage}</span>
            </div>
            <button
              onClick={() => setPaymentSuccessMessage('')}
              className="text-xs text-emerald-300 hover:text-white cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Orders Listing Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-mono">Loading orders &amp; settlement records...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-200">No orders found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {isFarmer
                  ? 'No buyers have placed orders on your accepted offers yet.'
                  : 'You have no confirmed orders. Once an offer is accepted by a farmer, complete checkout to generate your order.'}
              </p>
            </div>
            <div>
              <Link
                to="/offers"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md"
              >
                <span>View Trade Offers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const item = order.orderItems?.[0];
              const listing = item?.listing;
              const photo = listing?.productImages?.[0]?.imageUrl;
              const quantity = Number(item?.quantity || 0);
              const unitPrice = Number(item?.pricePerUnit || 0);
              const totalAmount = Number(order.totalAmount || 0);

              return (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all space-y-4 shadow-lg shadow-black/20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        #{order.id.slice(0, 13).toUpperCase()}
                      </span>
                      {getStatusBadge(order.status)}
                      {getPaymentBadge(order.payment)}
                      {getDeliveryBadge(order.delivery)}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <button
                        onClick={() => setSelectedReceiptOrder(order)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-sans font-medium"
                      >
                        <FileText className="w-3 h-3 text-emerald-400" />
                        <span>View Receipt</span>
                      </button>
                    </div>
                  </div>

                  {/* Order Details Body */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Item & Image */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                        {photo ? (
                          <img src={photo} alt={listing?.cropName} className="w-full h-full object-cover" />
                        ) : (
                          <Sprout className="w-7 h-7 text-emerald-500/40" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          {listing?.cropName || 'Produce Batch'}
                        </h4>
                        <p className="text-xs text-slate-400 font-mono">
                          {quantity.toLocaleString('en-IN')} {listing?.unit || 'unit'} @ ₹
                          {unitPrice.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Counterparty & Delivery Address */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1 text-slate-400">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {isFarmer ? 'Buyer: ' : 'Seller: '}
                          <strong className="text-slate-200">
                            {isFarmer ? order.buyer?.name : order.farmer?.name}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-start gap-1 text-slate-400 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span className="truncate">{order.shippingAddress}</span>
                      </div>
                    </div>

                    {/* Total Amount & Action Controls */}
                    <div className="flex flex-col md:items-end justify-center space-y-2">
                      <div className="text-left md:text-right space-y-0.5">
                        <span className="text-[11px] text-slate-500 font-mono block">Settlement Total</span>
                        <span className="text-lg font-black text-emerald-400 font-mono">
                          ₹{totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Farmer Action Controls */}
                        {isFarmer && (
                          <>
                            {order.payment?.status === 'SUCCESS' ? (
                              !order.delivery || order.delivery.status === 'PENDING' ? (
                                <button
                                  onClick={() => setSelectedDispatchOrder(order)}
                                  className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-950/40 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>Dispatch Order</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => setSelectedTrackingOrderId(order.id)}
                                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 border border-slate-700/80 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Navigation className="w-3.5 h-3.5" />
                                  <span>Delivery Tracking</span>
                                </button>
                              )
                            ) : (
                              <span className="text-[11px] text-amber-400/80 font-mono">
                                Awaiting Payment
                              </span>
                            )}
                          </>
                        )}

                        {/* Buyer Action Controls */}
                        {!isFarmer && (
                          <>
                            {order.payment?.status !== 'SUCCESS' ? (
                              <button
                                onClick={() => setSelectedPaymentOrder(order)}
                                className="px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-sky-950/40 transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Pay Now (Razorpay Test)</span>
                              </button>
                            ) : order.delivery?.trackingNumber ? (
                              <button
                                onClick={() => setSelectedTrackingOrderId(order.id)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700/80 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Track Delivery</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-400" /> Awaiting Dispatch
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Consignment Live Strip (if dispatched) */}
                  {order.delivery?.trackingNumber && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs font-mono">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Truck className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-slate-400 text-[11px]">Consignment:</span>
                        <span className="text-white font-bold text-[11px]">{order.delivery.trackingNumber}</span>
                        {order.delivery.estimatedDelivery && (
                          <span className="text-slate-500 text-[11px]">
                            • Est: {new Date(order.delivery.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedTrackingOrderId(order.id)}
                        className="text-emerald-400 hover:text-emerald-300 font-sans font-semibold text-xs flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                      >
                        <span>View Live Timeline</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Razorpay Test Mode Payment Modal */}
      <RazorpayModal
        isOpen={Boolean(selectedPaymentOrder)}
        onClose={() => setSelectedPaymentOrder(null)}
        order={selectedPaymentOrder}
        onSuccess={(updatedOrder) => {
          setSelectedPaymentOrder(null);
          setPaymentSuccessMessage(
            `Payment for Order #${(updatedOrder?.id || selectedPaymentOrder?.id || '').slice(0, 13).toUpperCase()} verified & settled successfully via Razorpay!`
          );
          loadOrders();
        }}
      />

      {/* Milestone 8: Farmer Dispatch Order Modal */}
      <DispatchOrderModal
        isOpen={Boolean(selectedDispatchOrder)}
        onClose={() => setSelectedDispatchOrder(null)}
        order={selectedDispatchOrder}
        onSuccess={(updatedDelivery) => {
          setSelectedDispatchOrder(null);
          setDeliverySuccessMessage(
            `Consignment dispatched successfully with tracking #${updatedDelivery?.trackingNumber || ''}!`
          );
          loadOrders();
        }}
      />

      {/* Milestone 8: Interactive Delivery Tracking Modal */}
      <DeliveryTrackingModal
        isOpen={Boolean(selectedTrackingOrderId)}
        onClose={() => setSelectedTrackingOrderId(null)}
        orderId={selectedTrackingOrderId}
        isFarmer={isFarmer}
        onStatusUpdated={() => loadOrders()}
      />

      {/* Order Receipt Modal */}
      <OrderReceiptModal
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
        order={selectedReceiptOrder}
        onPayNow={(orderToPay) => setSelectedPaymentOrder(orderToPay)}
        onTrackDelivery={(trkOrderId) => setSelectedTrackingOrderId(trkOrderId)}
      />
    </div>
  );
}
