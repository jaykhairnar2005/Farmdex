import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShoppingBag, Store, Handshake, Truck, TrendingUp, Package,
  MapPin, CheckCircle2, Clock, ChevronRight, DollarSign, Sprout, ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { Card, CardHeader, CardBody, StatCard, Badge, StatusBadge, Button, ButtonLink } from '../ui';
import {
  fetchMyOffersApi, fetchMyOrdersApi, fetchCropListingsApi
} from '../../services/api';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import { getCropImageUrl, handleImageFallback } from '../../utils/cropImages';

export default function BuyerDashboard({ user }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [featuredCrops, setFeaturedCrops] = useState([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [offersRes, ordersRes, cropsRes] = await Promise.allSettled([
          fetchMyOffersApi({ limit: 6 }),
          fetchMyOrdersApi({ limit: 6 }),
          fetchCropListingsApi({ limit: 4, sort: 'latest' }),
        ]);

        if (offersRes.status === 'fulfilled' && offersRes.value?.success) {
          setOffers(offersRes.value.data || []);
        }
        if (ordersRes.status === 'fulfilled' && ordersRes.value?.success) {
          setOrders(ordersRes.value.data || []);
        }
        if (cropsRes.status === 'fulfilled' && cropsRes.value?.success) {
          setFeaturedCrops(cropsRes.value.data || []);
        }
      } catch (err) {
        console.error('Error loading buyer dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalSpent = orders.reduce((sum, ord) => sum + (parseFloat(ord.totalAmount) || 0), 0);
  const activeOffers = offers.filter((o) => o.status === 'PENDING' || o.status === 'COUNTERED');
  const acceptedOffers = offers.filter((o) => o.status === 'ACCEPTED');
  const inTransitOrders = orders.filter((o) => ['CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(o.status));

  // Monthly procurement chart
  const procurementData = [
    { month: 'Jun', amount: 15000 },
    { month: 'Jul', amount: 35000 },
    { month: 'Aug', amount: 52000 },
    { month: 'Sep', amount: 80000 },
    { month: 'Oct', amount: 110000 },
    { month: 'Nov', amount: Math.max(145000, Math.round(totalSpent)) },
  ];

  return (
    <div className="space-y-8 fade-in">
      {/* Executive Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 text-white p-7 sm:p-9 shadow-xl border border-brand-700/50">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/20 border border-lime-400/30 text-lime-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
              Wholesale Buyer Procurement Desk
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {t('home.welcomeBack', { name: user?.name?.split(' ')[0] || 'Buyer' })}
            </h1>
            <p className="text-brand-100/80 text-sm sm:text-base leading-relaxed">
              Source verified harvests directly from farmers with zero broker fees, protected escrow payments, and live carrier tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <ButtonLink
              to="/marketplace"
              variant="lime"
              size="lg"
              icon={<Store className="w-5 h-5" />}
            >
              Browse Marketplace
            </ButtonLink>
            <ButtonLink
              to="/orders"
              variant="secondary"
              size="lg"
              icon={<Truck className="w-5 h-5 text-brand-700" />}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md"
            >
              Track Deliveries
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Procurement Spend"
          value={formatCurrency(totalSpent)}
          icon={<DollarSign className="text-emerald-700 dark:text-emerald-400" />}
          tone="brand"
          trend={{ value: 'Escrow Protected', positive: true }}
          hint="Total settled orders"
        />
        <StatCard
          label="Active Bids & Negotiations"
          value={activeOffers.length}
          icon={<Handshake className="text-amber-700 dark:text-amber-400" />}
          tone="warning"
          trend={{ value: `${acceptedOffers.length} Accepted`, positive: true }}
          hint="Offers placed on crops"
        />
        <StatCard
          label="Consignments in Transit"
          value={inTransitOrders.length}
          icon={<Truck className="text-blue-700 dark:text-blue-400" />}
          tone="info"
          hint="Carrier dispatch active"
        />
        <StatCard
          label="Delivered Orders"
          value={orders.filter((o) => o.status === 'DELIVERED').length}
          icon={<CheckCircle2 className="text-lime-700 dark:text-lime-400" />}
          tone="lime"
          hint="Verified delivery receipt"
        />
      </div>

      {/* Accepted Offer Action Banner if any accepted offers are waiting for checkout */}
      {acceptedOffers.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-lime-500/15 via-emerald-500/10 to-transparent border border-lime-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-lime-500 text-brand-950 flex items-center justify-center font-bold">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-ink">
                You have {acceptedOffers.length} accepted offer{acceptedOffers.length > 1 ? 's' : ''} ready for checkout!
              </h3>
              <p className="text-xs text-ink-muted">
                The farmer accepted your trade terms. Complete checkout to secure stock with escrow protection.
              </p>
            </div>
          </div>
          <ButtonLink to="/offers" variant="lime" size="sm" iconEnd={<ArrowRight className="w-4 h-4" />}>
            Proceed to Checkout
          </ButtonLink>
        </div>
      )}

      {/* Two Column Section: Active Offers / Bids & Consignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
        {/* Left: Active Offers / Bidding */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Handshake className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">My Trade Offers & Bids</h2>
                <p className="text-xs text-ink-muted">Active price negotiations with farmers</p>
              </div>
            </div>
            <Link to="/offers" className="text-xs font-semibold text-brand-800 dark:text-lime-400 hover:underline flex items-center gap-1">
              View All ({offers.length}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardBody className="divide-y divide-line p-0">
            {offers.length === 0 ? (
              <div className="p-8 text-center text-ink-muted text-sm space-y-2">
                <Handshake className="w-8 h-8 mx-auto text-ink-subtle opacity-50" />
                <p className="font-medium">No active offers placed</p>
                <Link to="/marketplace" className="inline-block mt-2 text-xs font-bold text-brand-800 hover:underline">
                  Browse Produce to Place Offers →
                </Link>
              </div>
            ) : (
              offers.slice(0, 4).map((offer) => (
                <div key={offer.id} className="p-4.5 flex items-center justify-between gap-4 hover:bg-surface-muted/40 transition-colors">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-ink truncate">{offer.listing?.cropName || 'Crop Harvest'}</span>
                      <StatusBadge type="offer" status={offer.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-muted">
                      <span>Quantity: <strong className="text-ink font-medium">{formatNumber(offer.quantity)} Qtl</strong></span>
                      <span>•</span>
                      <span>Offered Price: <strong className="text-brand-800 dark:text-lime-400 font-bold">{formatCurrency(offer.offeredPrice)}</strong></span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <Link
                      to="/offers"
                      className="px-3 py-1.5 text-xs font-semibold bg-brand-800 hover:bg-brand-900 text-white rounded-lg transition-colors shadow-xs"
                    >
                      {offer.status === 'ACCEPTED' ? 'Checkout' : 'View'}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Right: Active Consignment Deliveries */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">Active Consignments</h2>
                <p className="text-xs text-ink-muted">Live 4-stage logistics tracking</p>
              </div>
            </div>
            <Link to="/orders" className="text-xs font-semibold text-brand-800 dark:text-lime-400 hover:underline flex items-center gap-1">
              All Orders ({orders.length}) <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardBody className="divide-y divide-line p-0">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-ink-muted text-sm space-y-2">
                <Truck className="w-8 h-8 mx-auto text-ink-subtle opacity-50" />
                <p className="font-medium">No consignment orders yet</p>
                <p className="text-xs text-ink-subtle">Check out an accepted offer to initiate farm-gate dispatch.</p>
              </div>
            ) : (
              orders.slice(0, 4).map((ord) => (
                <div key={ord.id} className="p-4 flex items-center justify-between gap-4 hover:bg-surface-muted/40 transition-colors">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-800 dark:text-lime-400">
                        #{ord.id.slice(-6).toUpperCase()}
                      </span>
                      <StatusBadge type="order" status={ord.status} size="sm" />
                    </div>
                    <div className="text-xs text-ink-muted truncate">
                      Farmer: <strong className="text-ink font-medium">{ord.farmer?.name || 'Verified Producer'}</strong>
                    </div>
                    <div className="text-xs font-bold text-ink">
                      {formatCurrency(ord.totalAmount)}
                    </div>
                  </div>
                  <Link
                    to="/orders"
                    className="text-xs font-semibold text-brand-800 hover:text-brand-900 dark:text-lime-400 hover:underline shrink-0"
                  >
                    Track Status →
                  </Link>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      {/* Featured Produce Directly From Farmers */}
      {featuredCrops.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink">Featured Produce Directly From Farmers</h2>
              <p className="text-xs text-ink-muted">Fresh harvests available for direct wholesale offer placement</p>
            </div>
            <Link to="/marketplace" className="text-xs font-semibold text-brand-800 dark:text-lime-400 hover:underline flex items-center gap-1">
              Explore All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredCrops.map((crop) => {
              const primaryImage = crop.productImages?.[0]?.imageUrl;
              const displayImg = getCropImageUrl(crop.cropName, crop.category?.name, primaryImage);
              return (
                <Link
                  key={crop.id}
                  to={`/crops/${crop.id}`}
                  className="group bg-surface border border-line rounded-2xl overflow-hidden hover:shadow-card-hover transition-all card-lift flex flex-col"
                >
                  <div className="relative aspect-[4/3] bg-surface-muted overflow-hidden">
                    <img
                      src={displayImg}
                      alt={crop.cropName}
                      onError={(e) => handleImageFallback(e, crop.cropName, crop.category?.name)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface/90 text-ink backdrop-blur-sm border border-line/40">
                      {crop.category?.name}
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-ink group-hover:text-brand-800 transition-colors line-clamp-1">
                        {crop.cropName}
                      </h3>
                      <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">
                        {crop.location || 'India'}
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-line flex items-center justify-between">
                      <span className="font-bold text-base text-brand-800 dark:text-lime-400">
                        {formatCurrency(crop.pricePerUnit)}
                        <span className="text-xs font-normal text-ink-subtle">/{crop.unit}</span>
                      </span>
                      <span className="text-[11px] font-medium text-ink-subtle">
                        {formatNumber(crop.quantity)} {crop.unit}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

