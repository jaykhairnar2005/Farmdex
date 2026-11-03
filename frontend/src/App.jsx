import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sprout, ArrowRight, Handshake, Shield, Truck, Package,
  ShoppingBag, Tractor, Layers, ShieldCheck, Store, MapPin, Sparkles, CheckCircle2,
} from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './components/ui';
import { useAuth } from './hooks/useAuth';
import { fetchCropListingsApi, fetchCategoriesApi } from './services/api';
import { formatCurrency, formatNumber } from './utils/formatters';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Farms from './pages/Farms';
import Marketplace from './pages/Marketplace';
import CropDetail from './pages/CropDetail';
import MyListings from './pages/MyListings';
import OffersDashboard from './pages/OffersDashboard';
import Orders from './pages/Orders';
import Messages from './pages/Messages';
import AdminDashboard from './pages/AdminDashboard';
import { ProtectedRoute } from './routes/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AppLayout from './layouts/AppLayout';
import FarmerDashboard from './components/dashboard/FarmerDashboard';
import BuyerDashboard from './components/dashboard/BuyerDashboard';
import { getCropImageUrl, handleImageFallback, CATEGORY_IMAGE_MAP } from './utils/cropImages';

/* ─── Route gate ───────────────────────────────────────────── */
function HomeDashboard() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <LandingPage />;
  if (user?.role === 'FARMER') return <AppLayout width="wide"><FarmerDashboard user={user} /></AppLayout>;
  if (user?.role === 'BUYER') return <AppLayout width="wide"><BuyerDashboard user={user} /></AppLayout>;
  return <AuthenticatedHome />;
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE  — public homepage with real photography
═══════════════════════════════════════════════════════════════ */
function LandingPage() {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const [listRes, catRes] = await Promise.allSettled([
        fetchCropListingsApi({ limit: 6, sort: 'latest' }),
        fetchCategoriesApi(),
      ]);
      if (listRes.status === 'fulfilled' && listRes.value?.success)
        setFeatured(listRes.value.data || []);
      if (catRes.status === 'fulfilled' && catRes.value?.success)
        setCategories(catRes.value.data || []);
    }
    load();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/marketplace${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`);
  };

  /* Category → cover image */
  const catImage = (name) => {
    const key = Object.keys(CATEGORY_IMAGE_MAP).find((k) => name?.toLowerCase().includes(k));
    return key ? CATEGORY_IMAGE_MAP[key] : CATEGORY_IMAGE_MAP['fruits & vegetables'];
  };

  const quickTags = ['Indrayani Rice', 'Nashik Red Onions', 'Organic Wheat', 'Soybean', 'Cotton'];

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <Navbar />

      {/* ── Hero Section ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brand-950 py-20 sm:py-28 lg:py-36 text-white" aria-label="Hero">
        {/* Cinematic Agritech Photography Background */}
        <div
          className="absolute inset-0 bg-center bg-cover scale-105 transform opacity-35 filter brightness-75"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2000&q=85')`,
          }}
          role="presentation"
          aria-hidden="true"
        />
        {/* Multi-layered forest gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/80 to-transparent" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/70 to-transparent" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline & Search */}
            <div className="lg:col-span-8 space-y-7">
              {/* Live Badge */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-lime-400/15 border border-lime-400/30 text-lime-300 text-xs sm:text-sm font-semibold backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                <span>DIRECT FROM 5,000+ VERIFIED INDIAN PRODUCERS • ZERO BROKERAGE</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-white">
                Fair Prices for Farmers. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-emerald-300 to-white">
                  Fresh Produce for Buyers.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg lg:text-xl text-brand-100/85 leading-relaxed max-w-2xl font-normal">
                Discover quality agricultural harvests, negotiate real-time trade offers, and track consignments with verified escrow protection.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="max-w-xl">
                <div className="flex flex-col sm:flex-row gap-2.5 p-2 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl shadow-2xl">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('home.searchPlaceholder', 'Search crops, vegetables, grains, or state...')}
                    aria-label={t('common.search', 'Search')}
                    className="w-full h-12 px-4 bg-transparent text-white placeholder:text-white/60 text-sm focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="h-12 px-7 bg-lime-500 hover:bg-lime-400 text-brand-950 font-bold rounded-xl transition-all duration-200 text-sm shrink-0 flex items-center justify-center gap-2 shadow-md shadow-lime-500/20 active:scale-[0.98] cursor-pointer"
                  >
                    {t('common.search', 'Search')} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Quick Tags */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-brand-200/80">
                <span className="font-semibold text-white/90">Popular:</span>
                {quickTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => navigate(`/marketplace?q=${encodeURIComponent(tag)}`)}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 transition-colors cursor-pointer text-xs"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Primary Call-to-actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/marketplace"
                  className="inline-flex items-center gap-2 h-12 px-6 bg-lime-500 hover:bg-lime-400 text-brand-950 font-bold text-sm rounded-xl shadow-lg shadow-lime-500/20 transition-all active:scale-[0.98]"
                >
                  <Store className="w-4.5 h-4.5" />
                  {t('home.browseMarketplace', 'Browse Marketplace')}
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 h-12 px-6 bg-white/10 hover:bg-white/20 border border-white/25 text-white text-sm font-semibold rounded-xl backdrop-blur-md transition-all active:scale-[0.98]"
                >
                  <Sprout className="w-4.5 h-4.5 text-lime-400" />
                  {t('home.listYourHarvest', 'List Your Harvest')}
                </Link>
              </div>
            </div>

            {/* Right Column: Live Trading Pulse Card */}
            <div className="lg:col-span-4 hidden lg:block">
              <div className="p-6 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-2xl shadow-2xl space-y-5 text-white">
                <div className="flex items-center justify-between border-b border-white/15 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-pulse" />
                    <span className="font-bold text-xs uppercase tracking-wider text-lime-300">Live Trading Desk</span>
                  </div>
                  <span className="text-[11px] font-mono text-white/70">Mandi Verified</span>
                </div>

                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">Indrayani Rice</span>
                      <span className="text-lime-400 font-mono font-bold">₹150.00 / kg</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-white/70">
                      <span>Nashik, Maharashtra</span>
                      <span className="text-emerald-300">222 Qtl Available</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">Organic Red Onions</span>
                      <span className="text-lime-400 font-mono font-bold">₹24.00 / kg</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-white/70">
                      <span>Lasalgaon Mandi</span>
                      <span className="text-emerald-300">Grade A+ Fresh</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">Sharbati Wheat</span>
                      <span className="text-lime-400 font-mono font-bold">₹38.50 / kg</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-white/70">
                      <span>Sehore, MP</span>
                      <span className="text-emerald-300">Direct Sourcing</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-center text-xs text-brand-100/70">
                  ⚡ 100% Escrow protected settlements via Razorpay
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform Statistics Bar ────────────────────────────── */}
      <section className="bg-surface border-y border-line py-8 shadow-xs relative z-10" aria-label="Platform Statistics">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="space-y-1 p-2">
              <div className="text-3xl sm:text-4xl font-extrabold text-brand-800 dark:text-lime-400 tracking-tight font-mono">₹45M+</div>
              <div className="text-xs sm:text-sm font-semibold text-ink">Direct Farmer Realization</div>
              <div className="text-[11px] text-ink-subtle">Zero brokerage deduction</div>
            </div>
            <div className="space-y-1 p-2">
              <div className="text-3xl sm:text-4xl font-extrabold text-brand-800 dark:text-lime-400 tracking-tight font-mono">14,500+</div>
              <div className="text-xs sm:text-sm font-semibold text-ink">Quintals Produce Traded</div>
              <div className="text-[11px] text-ink-subtle">High grade wholesale crops</div>
            </div>
            <div className="space-y-1 p-2">
              <div className="text-3xl sm:text-4xl font-extrabold text-brand-800 dark:text-lime-400 tracking-tight font-mono">100%</div>
              <div className="text-xs sm:text-sm font-semibold text-ink">Escrow Protected</div>
              <div className="text-[11px] text-ink-subtle">Verified digital payouts</div>
            </div>
            <div className="space-y-1 p-2">
              <div className="text-3xl sm:text-4xl font-extrabold text-brand-800 dark:text-lime-400 tracking-tight font-mono">&lt; 24h</div>
              <div className="text-xs sm:text-sm font-semibold text-ink">Farm-Gate Dispatch</div>
              <div className="text-[11px] text-ink-subtle">4-stage live tracking</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-lime-400 mb-3 border border-brand-200/50 dark:border-brand-800">
                <Layers className="w-3.5 h-3.5" /> Mandi Commodity Sectors
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-heading">
                {t('home.categoriesTitle', 'Browse by harvest category')}
              </h2>
              <p className="text-sm text-ink-muted mt-1 max-w-xl">
                Direct farm gate procurement across major Indian staples, cash crops, and horticulture.
              </p>
            </div>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-800 dark:text-lime-400 hover:text-brand-900 group"
            >
              All Categories <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                to={`/marketplace?categoryId=${cat.id}`}
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-surface-muted border border-line dark:border-line-subtle shadow-card hover:shadow-card-hover transition-all duration-300 card-lift"
              >
                <img
                  src={catImage(cat.name)}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3.5 flex flex-col justify-end">
                  <span className="text-xs sm:text-sm font-bold text-white font-heading group-hover:text-lime-300 transition-colors">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-white/70 font-medium flex items-center gap-1 mt-0.5">
                    View harvests <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured produce ───────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="bg-surface-muted/40 border-y border-line py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-lime-500/10 text-lime-700 dark:text-lime-400 mb-3 border border-lime-500/20">
                  <Sparkles className="w-3.5 h-3.5" /> Verified Fresh Harvests
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-heading">
                  {t('home.featuredTitle', 'Featured produce')}
                </h2>
                <p className="text-sm text-ink-muted mt-1 max-w-xl">
                  Live crop lots ready for immediate farm-gate dispatch or structured price negotiation.
                </p>
              </div>
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-line text-xs font-bold text-ink hover:text-brand-800 dark:hover:text-lime-400 hover:border-brand-300 transition-all shadow-card"
              >
                {t('home.viewAllProduce', 'View all produce')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((item) => {
                const primaryImage = item.productImages?.[0]?.imageUrl;
                const displayImg = getCropImageUrl(item.cropName, item.category?.name, primaryImage);
                return (
                  <Link
                    key={item.id}
                    to={`/crops/${item.id}`}
                    className="group bg-surface border border-line rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col card-lift"
                  >
                    <div className="relative aspect-[16/10] bg-surface-muted overflow-hidden">
                      <img
                        src={displayImg}
                        alt={item.cropName}
                        onError={(e) => handleImageFallback(e, item.cropName, item.category?.name)}
                        className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-surface/90 text-brand-800 dark:text-lime-400 border border-line/60 backdrop-blur-md shadow-sm">
                          {item.category?.name || 'Produce'}
                        </span>
                        {item.qualityGrade && (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-brand-800 text-white shadow-sm">
                            Grade {item.qualityGrade}
                          </span>
                        )}
                      </div>

                      {/* Bottom Image Info */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                        <span className="flex items-center gap-1 font-medium bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-md">
                          <MapPin className="w-3 h-3 text-lime-400" />
                          <span className="line-clamp-1">{item.location || item.farm?.location || 'India'}</span>
                        </span>
                        <span className="font-semibold bg-lime-500 text-brand-950 px-2 py-0.5 rounded-md text-[11px]">
                          Direct Farmer
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-bold text-ink group-hover:text-brand-800 dark:group-hover:text-lime-400 transition-colors font-heading">
                          {item.cropName}
                        </h3>
                        <p className="text-xs text-ink-muted mt-1 line-clamp-2">
                          {item.description || `Fresh high-grade lot directly from verified agricultural producer.`}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-line/70 flex items-end justify-between">
                        <div>
                          <div className="text-[11px] uppercase tracking-wider text-ink-subtle font-semibold">Base Mandi Rate</div>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-xl font-extrabold text-brand-800 dark:text-lime-400 font-mono">
                              {formatCurrency(item.pricePerUnit)}
                            </span>
                            <span className="text-xs text-ink-subtle font-medium">/{item.unit}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] uppercase tracking-wider text-ink-subtle font-semibold">Available</div>
                          <span className="inline-block text-xs font-bold text-ink bg-surface-muted px-2.5 py-1 rounded-lg border border-line mt-0.5">
                            {formatNumber(item.quantity)} {item.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-lime-400 mb-3 border border-brand-200/50 dark:border-brand-800">
            Transparent Agritech Protocol
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-heading">
            {t('footer.howItWorks', 'How FarmDex Works')}
          </h2>
          <p className="text-sm text-ink-muted mt-2">
            A frictionless marketplace bridging farmers and commercial procurers with dynamic bidding and tracked logistics.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              n: '01',
              icon: Tractor,
              title: t('home.features.directTitle', 'Direct Farmer Sourcing'),
              desc: t('home.features.directDesc', 'Connect directly with verified farmers. Eliminating brokers ensures better realization for producers and fresher crops for buyers.')
            },
            {
              n: '02',
              icon: Handshake,
              title: t('home.features.negotiationTitle', 'Dynamic Price Negotiation'),
              desc: t('home.features.negotiationDesc', 'Place formal offers, receive counter-offers, and agree upon mandi-rate settlements with transparent terms.')
            },
            {
              n: '03',
              icon: ShieldCheck,
              title: t('home.features.settlementTitle', 'Protected Payments'),
              desc: t('home.features.settlementDesc', 'Secure test payments with instant receipt generation, verified consignments, and transparent settlement.')
            },
            {
              n: '04',
              icon: Truck,
              title: t('home.features.trackingTitle', 'Carrier Dispatch Tracking'),
              desc: t('home.features.trackingDesc', 'Real-time 4-stage tracking from farm gate dispatch to final destination delivery with waybill logging.')
            },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.n}
                className="relative bg-surface rounded-2xl p-6 border border-line shadow-card hover:shadow-card-hover transition-all card-lift flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-900/40 text-brand-800 dark:text-lime-400 flex items-center justify-center border border-brand-200/50 dark:border-brand-800">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-3xl font-extrabold text-ink-subtle/30 font-mono select-none">
                      {step.n}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-ink mb-2 font-heading">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">{step.desc}</p>
                </div>
                <div className="mt-5 pt-3 border-t border-line/60 flex items-center text-xs font-semibold text-brand-800 dark:text-lime-400">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-lime-500" /> FarmDex Verified
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Dual Persona CTA Band ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Farmer Card */}
          <div className="relative rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 text-white overflow-hidden shadow-2xl border border-brand-700/50 flex flex-col justify-between">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-lime-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-lime-300 border border-white/20 mb-4 backdrop-blur-sm">
                <Sprout className="w-3.5 h-3.5" /> For Agricultural Producers
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading mb-3">
                List Your Harvest & Sell at Better Margins
              </h3>
              <p className="text-sm text-brand-100/90 leading-relaxed mb-6">
                Receive direct procurement offers from institutional buyers and regional mandi traders with zero intermediary cuts.
              </p>
              <div className="space-y-2 mb-8 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>Real-time counter offers and price control</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>Verified carrier dispatch and receipt confirmation</span>
                </div>
              </div>
            </div>
            <div className="relative z-10">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 h-12 px-7 bg-lime-500 hover:bg-lime-400 text-brand-950 font-bold text-sm rounded-xl shadow-lg shadow-lime-500/20 transition-all active:scale-[0.98]"
              >
                Join as a Farmer <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Buyer Card */}
          <div className="relative rounded-3xl p-8 sm:p-10 bg-surface text-ink overflow-hidden shadow-card border border-line flex flex-col justify-between">
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-lime-400 border border-brand-200/50 dark:border-brand-800 mb-4">
                <Store className="w-3.5 h-3.5" /> For Wholesale Buyers & Mandis
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading mb-3">
                Bulk Agri Sourcing with Guaranteed Provenance
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed mb-6">
                Source directly from certified farms across India. Compare mandi pricing, negotiate bulk lots, and track live carrier dispatches.
              </p>
              <div className="space-y-2 mb-8 text-xs text-ink-muted">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-lime-600 dark:text-lime-400 shrink-0" />
                  <span>Transparent grade certificates and harvest dates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-lime-600 dark:text-lime-400 shrink-0" />
                  <span>Standardized trade agreements and waybill documentation</span>
                </div>
              </div>
            </div>
            <div className="relative z-10">
              <Link
                to="/marketplace"
                className="inline-flex items-center justify-center gap-2 h-12 px-7 bg-brand-800 hover:bg-brand-900 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                Browse Available Lots <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AUTHENTICATED HOME — role-aware product home (not a dev dashboard)
═══════════════════════════════════════════════════════════════ */
function AuthenticatedHome() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const farmerLinks = [
    { to: '/my-listings', label: t('nav.myProduce', 'My Produce'), icon: Sprout, desc: t('myListings.subtitle', 'Manage your listed harvests, adjust pricing, and track remaining quantities.') },
    { to: '/farms',       label: t('nav.myFarms', 'My Farms'),   icon: Tractor, desc: t('farms.subtitle', 'Manage the agricultural land, soil types, and acreage where your produce is cultivated.') },
    { to: '/offers',      label: t('nav.offers', 'Offers'), icon: Handshake, desc: t('offers.subtitleFarmer', 'Review incoming buyer offers, send counter-proposals, and finalize agricultural trade agreements.') },
    { to: '/orders',      label: t('nav.orders', 'Orders'),      icon: Truck, desc: t('orders.subtitle', 'Track purchase orders, confirm settlements, and follow real-time carrier dispatch updates.') },
  ];
  const buyerLinks = [
    { to: '/marketplace', label: t('footer.browseProduce', 'Browse produce'), icon: Store, desc: t('marketplace.subtitle', 'Crops listed directly by registered farmers. Compare prices, negotiate offers, and track consignments in real time.') },
    { to: '/offers',      label: t('nav.myOffers', 'My Offers'),     icon: Handshake, desc: t('offers.subtitleBuyer', 'Track your price offers, review farmer counter-proposals, and complete consignment checkout.') },
    { to: '/orders',      label: t('nav.orders', 'Orders'),     icon: Package, desc: t('orders.subtitle', 'Track purchase orders, confirm settlements, and follow real-time carrier dispatch updates.') },
    { to: '/messages',    label: t('nav.messages', 'Messages'),       icon: ShoppingBag, desc: t('messages.subtitle', 'Direct negotiation with farmers and verified buyers') },
  ];
  const adminLinks = [
    { to: '/admin',       label: t('nav.adminPanel', 'Admin Panel'), icon: ShieldCheck, desc: t('admin.subtitle', 'Platform oversight, user verification, listing moderation, and dispute resolution') },
    { to: '/marketplace', label: t('nav.marketplace', 'Marketplace'),     icon: Store, desc: t('marketplace.subtitle', 'Browse fresh produce directly from farmers') },
  ];

  const links =
    user?.role === 'FARMER' ? farmerLinks :
    user?.role === 'ADMIN'  ? adminLinks  : buyerLinks;

  const roleLabel =
    user?.role === 'FARMER' ? t('home.farmerDashboardSub', 'Manage your farm operations, inventory, and trade negotiations') :
    user?.role === 'ADMIN'  ? t('home.adminDashboardSub', 'Platform governance, user verification, and dispute resolution') :
    t('home.buyerDashboardSub', 'Browse fresh produce, negotiate deals, and track your consignments');

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Navbar />
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-1 space-y-8 fade-in">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            {t('home.welcomeBack', { name: user?.name?.split(' ')[0] || 'User' })}
          </h1>
          <p className="text-sm text-ink-muted mt-1">{roleLabel}</p>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className="group bg-surface border border-line rounded-xl p-5 hover:shadow-card-hover transition-shadow shadow-card"
              >
                <div className="w-9 h-9 bg-brand-50 text-brand-800 rounded-lg flex items-center justify-center mb-3 group-hover:bg-brand-100 transition-colors">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-semibold text-ink text-sm">{link.label}</h3>
                <p className="text-xs text-ink-muted mt-1 line-clamp-2">{link.desc}</p>
              </Link>
            );
          })}
        </div>

        {/* Role-specific CTA panel */}
        {user?.role === 'FARMER' && (
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-ink">{t('myListings.listNew', 'List New Harvest')}</h3>
              <p className="text-sm text-ink-muted mt-0.5">
                {t('myListings.emptyDesc', 'List your first agricultural harvest to start receiving trade offers from wholesale buyers.')}
              </p>
            </div>
            <Link
              to="/my-listings"
              className="shrink-0 inline-flex items-center gap-2 h-9 px-5 bg-brand-800 hover:bg-brand-900 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Sprout className="w-4 h-4" /> {t('myListings.listNew', 'List New Harvest')}
            </Link>
          </div>
        )}
        {user?.role === 'BUYER' && (
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-ink">{t('marketplace.title', 'Browse fresh produce')}</h3>
              <p className="text-sm text-ink-muted mt-0.5">
                {t('marketplace.subtitle', 'Crops listed directly by registered farmers. Compare prices, negotiate offers, and track consignments in real time.')}
              </p>
            </div>
            <Link
              to="/marketplace"
              className="shrink-0 inline-flex items-center gap-2 h-9 px-5 bg-brand-800 hover:bg-brand-900 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Store className="w-4 h-4" /> {t('home.browseMarketplace', 'Browse marketplace')}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── Router ────────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>
              <Routes>
                <Route path="/" element={<HomeDashboard />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/crops/:id" element={<CropDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/farms"
                  element={
                    <ProtectedRoute allowedRoles={['FARMER']}>
                      <Farms />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-listings"
                  element={
                    <ProtectedRoute allowedRoles={['FARMER']}>
                      <MyListings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/offers"
                  element={
                    <ProtectedRoute>
                      <OffersDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <Messages />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
