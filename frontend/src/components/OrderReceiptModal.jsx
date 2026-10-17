import React from 'react';
import {
  X,
  CheckCircle2,
  Printer,
  Sprout,
  MapPin,
  Calendar,
  User,
  Phone,
  FileText,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Lock,
  Truck,
  Navigation,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OrderReceiptModal({ isOpen, onClose, order, onPayNow, onTrackDelivery }) {
  const navigate = useNavigate();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Receipt Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-emerald-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                Official Trade Receipt
              </span>
              <h3 className="text-lg font-extrabold text-white">Order Confirmed</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 font-sans">
          {/* Order Ref & Status Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <div>
              <span className="text-[11px] text-slate-500 font-mono block">Order Reference ID</span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                #{order.id.slice(0, 13).toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:text-right">
              <div>
                <span className="text-[11px] text-slate-500 font-mono block">Booking Date</span>
                <span className="text-xs text-slate-300 font-mono">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full font-mono">
                {order.status}
              </span>
            </div>
          </div>

          {/* Purchased Produce Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Item Details
            </h4>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono">
                  <tr>
                    <th className="py-2.5 px-4">Commodity</th>
                    <th className="py-2.5 px-4 text-center">Quantity</th>
                    <th className="py-2.5 px-4 text-right">Agreed Rate</th>
                    <th className="py-2.5 px-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-emerald-400" />
                      {listing?.cropName || 'Produce Batch'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium">
                      {quantity.toLocaleString('en-IN')} {listing?.unit || 'unit'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      ₹{unitPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Total Calculation Row */}
              <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-300">Total Settlement Amount</span>
                <span className="text-lg font-extrabold text-emerald-400 font-mono">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Razorpay Settlement Details Card */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-lg">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">Payment Gateway</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    Razorpay <span className="text-[10px] text-amber-400 font-mono font-medium">(Test Mode)</span>
                  </span>
                </div>
              </div>

              <div>
                {order.payment?.status === 'SUCCESS' ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Settled (PAID)
                  </span>
                ) : order.payment?.status === 'FAILED' ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 font-mono">
                    Payment Failed
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 font-mono">
                    Payment Pending
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-900 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">Transaction Reference</span>
                <span className="text-slate-300 font-bold">
                  {order.payment?.transactionId ? (
                    <span className="text-sky-400">{order.payment.transactionId}</span>
                  ) : (
                    <span className="text-slate-500 italic">Awaiting Payment</span>
                  )}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Settled Timestamp</span>
                <span className="text-slate-300">
                  {order.payment?.paidAt
                    ? new Date(order.payment.paidAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Unconfirmed'}
                </span>
              </div>
            </div>

            {order.payment?.status !== 'SUCCESS' && onPayNow && (
              <div className="pt-2 border-t border-slate-900 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPayNow(order);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pay Now with Razorpay Test Mode</span>
                </button>
              </div>
            )}
          </div>

          {/* Milestone 8: Consignment & Delivery Tracking Card */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">Consignment Tracking</span>
                  <span className="font-bold text-white flex items-center gap-1.5 font-mono">
                    {order.delivery?.trackingNumber || (
                      <span className="text-slate-500 italic font-sans font-normal">Awaiting Carrier Dispatch</span>
                    )}
                  </span>
                </div>
              </div>

              <div>
                {order.delivery?.status === 'DELIVERED' ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Delivered
                  </span>
                ) : order.delivery?.status === 'OUT_FOR_DELIVERY' ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 font-mono">
                    <Truck className="w-3 h-3" /> Out for Delivery
                  </span>
                ) : order.delivery?.status === 'IN_TRANSIT' ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1 font-mono">
                    <Navigation className="w-3 h-3" /> In Transit
                  </span>
                ) : order.delivery?.status === 'DISPATCHED' ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1 font-mono">
                    <Truck className="w-3 h-3" /> Dispatched
                  </span>
                ) : order.delivery?.status === 'PREPARING' ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1 font-mono">
                    Preparing Batch
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 font-mono">
                    Pending Dispatch
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-900 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">Estimated Arrival</span>
                <span className="text-slate-300">
                  {order.delivery?.estimatedDelivery
                    ? new Date(order.delivery.estimatedDelivery).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Scheduled after dispatch'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Dispatch Timestamp</span>
                <span className="text-slate-300">
                  {order.delivery?.shippedAt
                    ? new Date(order.delivery.shippedAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Awaiting Pickup'}
                </span>
              </div>
            </div>

            {onTrackDelivery && (
              <div className="pt-2 border-t border-slate-900 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTrackDelivery(order.id);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>View Interactive Delivery Timeline</span>
                </button>
              </div>
            )}
          </div>

          {/* Parties & Delivery Coordinate Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Farmer / Seller */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold font-mono text-[11px]">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Seller / Producer</span>
              </div>
              <p className="font-bold text-white text-sm">{order.farmer?.name || 'Farmer Seller'}</p>
              {order.farmer?.phone && (
                <p className="text-slate-400 font-mono flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" /> {order.farmer.phone}
                </p>
              )}
            </div>

            {/* Buyer / Customer */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold font-mono text-[11px]">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Purchaser</span>
              </div>
              <p className="font-bold text-white text-sm">{order.buyer?.name || 'Registered Buyer'}</p>
              {order.buyer?.phone && (
                <p className="text-slate-400 font-mono flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" /> {order.buyer.phone}
                </p>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold font-mono text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Registered Dispatch &amp; Delivery Destination</span>
            </div>
            <p className="text-slate-200 font-mono leading-relaxed">{order.shippingAddress}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={() => {
              onClose();
              navigate('/orders');
            }}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
