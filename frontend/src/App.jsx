import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sprout, ArrowRight, Handshake, Shield, Truck, Package,
  ShoppingBag, Tractor, Layers, ShieldCheck, Store,
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
import { getCropImageUrl, handleImageFallback, CATEGORY_IMAGE_MAP } from './utils/cropImages';

/* ─── Route gate ───────────────────────────────────────────── */
function HomeDashboard() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AuthenticatedHome /> : <LandingPage />;
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

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" aria-label="Hero">
        {/* Authentic high-res farm photography */}
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80')`,
          }}
          role="presentation"
          aria-hidden="true"
        />
        {/* Intentional dark-green overlay — not a gradient blob */}
        <div className="absolute inset-0 bg-brand-950/72" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-2xl">
            <p className="text-brand-300 text-sm font-semibold uppercase tracking-widest mb-4">
              {t('home.heroTag', 'Agricultural marketplace')}
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-semibold text-white leading-tight">
              {t('home.heroTitle', 'Better harvests. Smarter trade.')}
            </h1>
            <p className="mt-5 text-brand-100/80 text-lg leading-relaxed max-w-lg">
              {t('home.heroSubtitle', 'Discover quality agricultural produce, connect directly with farmers, and trade with confidence.')}
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="mt-9 flex flex-col sm:flex-row gap-3 max-w-xl">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('home.searchPlaceholder', 'Search crops, vegetables, grains, or state...')}
                  aria-label={t('common.search', 'Search')}
                  className="w-full h-12 pl-4 pr-4 bg-white/10 border border-white/25 rounded-lg text-white placeholder:text-white/50 text-sm backdrop-blur-sm focus-visible:bg-white/15 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="h-12 px-7 bg-brand-800 hover:bg-brand-900 text-white font-medium rounded-lg transition-colors text-sm shrink-0"
              >
                {t('common.search', 'Search')}
              </button>
            </form>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 h-10 px-5 bg-white text-brand-900 text-sm font-semibold rounded-lg shadow-card hover:bg-brand-50 transition-colors"
              >
                {t('home.browseMarketplace', 'Browse marketplace')} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 h-10 px-5 border border-white/30 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-colors"
              >
                {t('home.listYourHarvest', 'List harvest')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ────────────────────────────────────────── */}
      <div className="bg-surface border-y border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-ink-muted">
            <span className="flex items-center gap-2"><Handshake className="w-4 h-4 text-brand-700" /> {t('home.benefits.smartNegotiation', 'Real-time offer negotiation')}</span>
            <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-brand-700" /> {t('home.benefits.secureSettlements', 'Verified escrow payments')}</span>
            <span className="flex items-center gap-2"><Truck className="w-4 h-4 text-brand-700" /> {t('home.benefits.transparentLogistics', 'End-to-end dispatch tracking')}</span>
            <span className="flex items-center gap-2"><Sprout className="w-4 h-4 text-brand-700" /> {t('home.benefits.directTrade', 'Zero intermediary margins')}</span>
          </div>
        </div>
      </div>

      {/* ── Categories ─────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-semibold text-ink tracking-tight mb-8">
            {t('home.categoriesTitle', 'Browse by harvest category')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                to={`/marketplace?categoryId=${cat.id}`}
                className="group relative rounded-xl overflow-hidden aspect-[4/3] bg-surface-muted border border-line hover:shadow-card-hover transition-shadow"
              >
                <img
                  src={catImage(cat.name)}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-950/80 via-brand-950/20 to-transparent" />
                <span className="absolute bottom-0 left-0 right-0 px-3 pb-3 text-xs font-semibold text-white">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured produce ───────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="bg-surface border-t border-line">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-ink tracking-tight">
                {t('home.featuredTitle', 'Featured produce')}
              </h2>
              <Link
                to="/marketplace"
                className="text-sm font-medium text-brand-800 hover:text-brand-900 flex items-center gap-1 transition-colors"
              >
                {t('home.viewAllProduce', 'View all produce')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map((item) => {
                const primaryImage = item.productImages?.[0]?.imageUrl;
                const displayImg = getCropImageUrl(item.cropName, item.category?.name, primaryImage);
                return (
                  <Link
                    key={item.id}
                    to={`/crops/${item.id}`}
                    className="group bg-surface border border-line rounded-xl overflow-hidden hover:shadow-card-hover transition-shadow flex flex-col shadow-card"
                  >
                    <div className="relative aspect-[16/9] bg-surface-muted overflow-hidden">
                      <img
                        src={displayImg}
                        alt={item.cropName}
                        onError={(e) => handleImageFallback(e, item.cropName, item.category?.name)}
                        className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                      />
                      <span className="absolute bottom-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-md bg-surface/95 text-ink-muted border border-line/50 backdrop-blur-sm">
                        {item.category?.name}
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-semibold text-ink group-hover:text-brand-800 transition-colors mb-1">
                        {item.cropName}
                      </h3>
                      <p className="text-xs text-ink-muted mb-3 line-clamp-1">{item.location || 'India'}</p>
                      <div className="mt-auto flex items-end justify-between">
                        <div>
                          <span className="text-lg font-semibold text-brand-800">
                            {formatCurrency(item.pricePerUnit)}
                          </span>
                          <span className="text-xs text-ink-subtle ml-1">/{item.unit}</span>
                        </div>
                        <span className="text-xs text-ink-subtle">
                          {formatNumber(item.quantity)} {item.unit} {t('marketplace.available', 'Available')}
                        </span>
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-semibold text-ink tracking-tight mb-10">
          {t('footer.howItWorks', 'How it works')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              n: '01',
              title: t('home.features.directTitle', 'Direct Farmer Sourcing'),
              desc: t('home.features.directDesc', 'Connect directly with verified farmers. Eliminating brokers ensures better realization for producers and fresher crops for buyers.')
            },
            {
              n: '02',
              title: t('home.features.negotiationTitle', 'Dynamic Price Negotiation'),
              desc: t('home.features.negotiationDesc', 'Place formal offers, receive counter-offers, and agree upon mandi-rate settlements with transparent terms.')
            },
            {
              n: '03',
              title: t('home.features.settlementTitle', 'Protected Payments'),
              desc: t('home.features.settlementDesc', 'Secure test payments with instant receipt generation, verified consignments, and transparent settlement.')
            },
            {
              n: '04',
              title: t('home.features.trackingTitle', 'Carrier Dispatch Tracking'),
              desc: t('home.features.trackingDesc', 'Real-time 4-stage tracking from farm gate dispatch to final destination delivery with waybill logging.')
            },
          ].map((step) => (
            <div key={step.n} className="relative">
              <span className="text-7xl font-bold text-brand-50 leading-none select-none block">{step.n}</span>
              <div className="-mt-6 pl-1">
                <h3 className="text-base font-semibold text-ink mb-1">{step.title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA band ──────────────────────────────────────────── */}
      <section className="bg-brand-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-3">
            {t('home.ctaTitle', 'Ready to transform your agricultural trade?')}
          </h2>
          <p className="text-brand-200 max-w-md mx-auto text-sm mb-7 leading-relaxed">
            {t('home.ctaSubtitle', 'Join thousands of farmers and buyers negotiating directly on FarmDex today.')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="h-11 px-7 inline-flex items-center bg-white text-brand-900 font-semibold text-sm rounded-lg hover:bg-brand-50 transition-colors"
            >
              {t('nav.getStarted', 'Get started')}
            </Link>
            <Link
              to="/marketplace"
              className="h-11 px-7 inline-flex items-center border border-brand-500/60 text-brand-100 font-medium text-sm rounded-lg hover:bg-brand-900 transition-colors"
            >
              {t('home.browseMarketplace', 'Browse marketplace')}
            </Link>
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
