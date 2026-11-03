import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search, MapPin, ChevronLeft, ChevronRight, RotateCcw, Package, Leaf,
  SlidersHorizontal, ShieldCheck, X, Sparkles, ArrowRight, CheckCircle2,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Pagination, FilterPills, SkeletonCard, EmptyState, ErrorState, Badge,
} from '../components/ui';
import { fetchCategoriesApi, fetchCropListingsApi } from '../services/api';
import { getCropImageUrl, handleImageFallback } from '../utils/cropImages';
import { formatCurrency, formatNumber } from '../utils/formatters';

export default function Marketplace() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter + pagination state (initialised from URL so the homepage search works)
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isOrganic, setIsOrganic] = useState(false);
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 12 });

  // Categories (one-time)
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetchCategoriesApi();
        if (res.success && Array.isArray(res.data)) setCategories(res.data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch listings
  const loadListings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 12, sort };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.categoryId = selectedCategory;
      if (minPrice) params.minPrice = parseFloat(minPrice);
      if (maxPrice) params.maxPrice = parseFloat(maxPrice);
      if (isOrganic) params.isOrganic = 'true';

      const res = await fetchCropListingsApi(params);
      if (res.success) {
        setListings(res.data || []);
        setPagination({
          total: res.total || 0,
          totalPages: res.totalPages || 1,
          limit: res.limit || 12,
        });
      } else {
        setError(res.message || t('common.error', 'Failed to load crop listings'));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('common.error', 'Error fetching marketplace listings'));
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, minPrice, maxPrice, isOrganic, sort, t]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  // Keep URL in sync (sharable, back-button friendly) — only the search term + category
  useEffect(() => {
    const next = new URLSearchParams();
    if (search.trim()) next.set('q', search.trim());
    if (selectedCategory) next.set('categoryId', selectedCategory);
    setSearchParams(next, { replace: true });
  }, [search, selectedCategory, setSearchParams]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setIsOrganic(false);
    setSort('latest');
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadListings();
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId === selectedCategory ? '' : catId);
    setPage(1);
  };

  const activeFilterCount =
    (search ? 1 : 0) + (selectedCategory ? 1 : 0) + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (isOrganic ? 1 : 0);

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-line gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-lime-400 border border-brand-200/50 dark:border-brand-800">
                <Sparkles className="w-3.5 h-3.5" /> Mandi Spot Exchange
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-lime-500/15 text-lime-700 dark:text-lime-400 border border-lime-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse" />
                Live Trading
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-heading">
              {t('marketplace.title', 'Browse Fresh Produce')}
            </h1>
            <p className="text-sm text-ink-muted mt-1 max-w-2xl">
              {t('marketplace.subtitle', 'Crops listed directly by registered farmers. Compare prices, negotiate offers, and track consignments in real time.')}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2 rounded-xl bg-surface border border-line shadow-card text-right">
              <span className="text-[11px] uppercase tracking-wider text-ink-subtle font-semibold block">Total Harvests</span>
              <span className="text-lg font-extrabold text-brand-800 dark:text-lime-400 font-mono">
                {formatNumber(pagination.total)} Lots
              </span>
            </div>
          </div>
        </div>

        {/* Search + controls container */}
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-6 my-6 shadow-card space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-ink-subtle" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('marketplace.searchPlaceholder', 'Search by crop, variety, or district...')}
                className="w-full pl-10 pr-9 h-11 bg-surface-muted border border-line rounded-xl text-ink placeholder:text-ink-subtle text-sm focus:outline-none focus:border-brand-500 transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setPage(1); }}
                  aria-label={t('common.clear', 'Clear')}
                  className="absolute right-2.5 top-2.5 p-1 text-ink-subtle hover:text-ink rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="h-11 px-6 bg-brand-800 hover:bg-brand-900 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-[0.98] shrink-0 cursor-pointer"
            >
              {t('common.search', 'Search')}
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-11 px-4 border rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                showFilters || activeFilterCount > 0
                  ? 'bg-brand-50 border-brand-300 text-brand-800 dark:bg-brand-900/40 dark:text-lime-400'
                  : 'bg-surface border-line text-ink-muted hover:bg-surface-muted'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">{t('marketplace.filters', 'Filters')}</span>
              {activeFilterCount > 0 && (
                <span className="min-w-[20px] h-[20px] px-1.5 bg-brand-800 dark:bg-lime-500 text-white dark:text-brand-950 text-[11px] font-extrabold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </form>

          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <FilterPills
              items={[
                { id: '', label: t('category.all', 'All categories') },
                ...categories.map((c) => ({ id: c.id, label: c.name })),
              ]}
              value={selectedCategory}
              onChange={handleCategorySelect}
            />
          </div>

          {/* Expandable advanced filters */}
          {showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 border-t border-line fade-in">
              <FilterField label={t('modals.cropListing.category', 'Harvest Category')}>
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                  className="w-full h-10 px-3 bg-surface-muted border border-line rounded-xl text-ink text-sm focus:outline-none focus:border-brand-500"
                >
                  <option value="">{t('category.all', 'All categories')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </FilterField>
              <FilterField label={`${t('common.price', 'Price')} Min (₹)`}>
                <input
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                  className="w-full h-10 px-3 bg-surface-muted border border-line rounded-xl text-ink text-sm focus:outline-none focus:border-brand-500"
                />
              </FilterField>
              <FilterField label={`${t('common.price', 'Price')} Max (₹)`}>
                <input
                  type="number"
                  placeholder="10000"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                  className="w-full h-10 px-3 bg-surface-muted border border-line rounded-xl text-ink text-sm focus:outline-none focus:border-brand-500"
                />
              </FilterField>
              <FilterField label={t('marketplace.sortBy', 'Sort order')}>
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  className="w-full h-10 px-3 bg-surface-muted border border-line rounded-xl text-ink text-sm focus:outline-none focus:border-brand-500"
                >
                  <option value="latest">{t('marketplace.sortLatest', 'Latest Listings')}</option>
                  <option value="price_asc">{t('marketplace.sortPriceAsc', 'Price: Low to High')}</option>
                  <option value="price_desc">{t('marketplace.sortPriceDesc', 'Price: High to Low')}</option>
                  <option value="quantity_desc">{t('common.quantity', 'Quantity')}</option>
                </select>
              </FilterField>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 cursor-pointer pb-2 text-sm text-ink select-none">
                  <input
                    type="checkbox"
                    checked={isOrganic}
                    onChange={(e) => { setIsOrganic(e.target.checked); setPage(1); }}
                    className="w-4 h-4 rounded border-line text-brand-800 accent-lime-600 cursor-pointer"
                  />
                  <span className="flex items-center gap-1 font-semibold text-brand-800 dark:text-lime-400">
                    <Leaf className="w-3.5 h-3.5 text-lime-500" /> {t('marketplace.organic', 'Organic')}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  title={t('common.resetFilters', 'Reset filters')}
                  className="pb-2 text-xs font-semibold text-ink-subtle hover:text-ink flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> {t('common.reset', 'Reset')}
                </button>
              </div>
            </div>
          )}

          {/* Summary line */}
          <div className="flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-line/60">
            <span className="font-medium">
              {t('marketplace.showingListings', {
                count: listings.length,
                total: pagination.total,
                defaultValue: `Showing ${listings.length} of ${pagination.total} active listings`
              })}
            </span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-brand-800 dark:text-lime-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> {t('common.resetFilters', 'Clear active filters')}
              </button>
            )}
          </div>
        </div>

        {/* Listings grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadListings} />
        ) : listings.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('marketplace.noProduceFound', 'No produce found')}
            message={t('marketplace.noProduceDesc', 'Try clearing search filters or selecting another crop category.')}
            action={{ label: t('common.resetFilters', 'Reset filters'), onClick: handleResetFilters }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((item) => {
                const primaryImage = item.productImages?.[0]?.imageUrl;
                const displayImg = getCropImageUrl(item.cropName, item.category?.name, primaryImage);
                const farmer = item.farmerProfile;
                const farmerUser = farmer?.user;

                return (
                  <Link
                    key={item.id}
                    to={`/crops/${item.id}`}
                    className="group bg-surface border border-line rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col card-lift"
                  >
                    <div className="relative aspect-[4/3] bg-surface-muted overflow-hidden">
                      <img
                        src={displayImg}
                        alt={item.cropName}
                        loading="lazy"
                        onError={(e) => handleImageFallback(e, item.cropName, item.category?.name)}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        {item.isOrganic ? (
                          <Badge colour="lime" size="sm" icon={<Leaf className="w-3 h-3" />}>
                            {t('marketplace.organic', 'Organic')}
                          </Badge>
                        ) : (
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-surface/90 text-brand-800 dark:text-lime-400 border border-line/60 backdrop-blur-md shadow-sm">
                            {item.category?.name || 'Produce'}
                          </span>
                        )}
                        {item.quality && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-brand-800 text-white shadow-sm">
                            {t('marketplace.grade', { grade: item.quality, defaultValue: `Grade ${item.quality}` })}
                          </span>
                        )}
                      </div>

                      {/* Location bar on image */}
                      {item.location && (
                        <div className="absolute bottom-3 left-3 right-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-md">
                            <MapPin className="w-3 h-3 text-lime-400" />
                            <span className="truncate">{item.location}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-ink group-hover:text-brand-800 dark:group-hover:text-lime-400 transition-colors line-clamp-1 font-heading text-base">
                          {item.cropName}
                        </h3>
                        <p className="text-xs text-ink-muted mt-1 line-clamp-2">
                          {item.description || 'Direct farm harvest available for immediate negotiation and dispatch.'}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 flex items-end justify-between border-t border-line/70">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider text-ink-subtle font-semibold block">{t('common.price', 'Price')}</span>
                          <div className="flex items-baseline gap-0.5 mt-0.5">
                            <span className="text-lg font-extrabold text-brand-800 dark:text-lime-400 font-mono">
                              {formatCurrency(item.pricePerUnit)}
                            </span>
                            <span className="text-xs text-ink-subtle font-medium">/{item.unit}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] uppercase tracking-wider text-ink-subtle font-semibold block">{t('marketplace.available', 'Available')}</span>
                          <span className="inline-block text-xs font-bold text-ink bg-surface-muted px-2 py-0.5 rounded-md border border-line mt-0.5">
                            {formatNumber(item.quantity)} {item.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Farmer Bar */}
                    <div className="px-4 py-2.5 bg-surface-muted/60 border-t border-line text-xs flex items-center justify-between">
                      <span className="text-ink-muted truncate flex items-center gap-1.5 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" />
                        <span className="truncate">{farmerUser?.name || farmer?.farmName || t('cropDetail.verifiedSeller', 'Verified Producer')}</span>
                      </span>
                      <span className="text-brand-800 dark:text-lime-400 font-bold group-hover:translate-x-1 transition-transform shrink-0 flex items-center gap-0.5">
                        {t('common.view', 'Trade')} &rarr;
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-10">
              <Pagination
                page={page}
                totalPages={pagination.totalPages}
                onChange={setPage}
              />
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-muted mb-1">{label}</label>
      {children}
    </div>
  );
}
