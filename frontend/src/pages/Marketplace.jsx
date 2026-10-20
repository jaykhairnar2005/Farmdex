import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search, MapPin, ChevronLeft, ChevronRight, RotateCcw, Package, Leaf,
  SlidersHorizontal, ShieldCheck, X,
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
        <div className="pb-6 border-b border-line">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700 mb-1">
            {t('home.heroTag', 'Agricultural marketplace')}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            {t('marketplace.title', 'Browse fresh produce')}
          </h1>
          <p className="text-sm text-ink-muted mt-1.5 max-w-2xl">
            {t('marketplace.subtitle', 'Crops listed directly by registered farmers. Compare prices, negotiate offers, and track consignments in real time.')}
          </p>
        </div>

        {/* Search + controls */}
        <div className="bg-surface border border-line rounded-xl p-4 sm:p-5 my-6 shadow-card space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-ink-subtle" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('marketplace.searchPlaceholder', 'Search by crop, variety, or district...')}
                className="w-full pl-10 pr-9 h-10 bg-surface-muted border border-line rounded-lg text-ink placeholder:text-ink-subtle text-sm transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setPage(1); }}
                  aria-label={t('common.clear', 'Clear')}
                  className="absolute right-2.5 top-2 p-1 text-ink-subtle hover:text-ink rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="h-10 px-5 bg-brand-800 hover:bg-brand-900 text-white font-medium text-sm rounded-lg transition-colors shrink-0"
            >
              {t('common.search', 'Search')}
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-10 px-3 border rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                showFilters || activeFilterCount > 0
                  ? 'bg-brand-50 border-brand-200 text-brand-800'
                  : 'bg-surface border-line text-ink-muted hover:bg-surface-muted'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">{t('marketplace.filters', 'Filters')}</span>
              {activeFilterCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 bg-brand-800 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-line fade-in">
              <FilterField label={t('common.filter', 'Category')}>
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                  className="w-full h-9 px-3 bg-surface-muted border border-line rounded-lg text-ink text-sm"
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
                  className="w-full h-9 px-3 bg-surface-muted border border-line rounded-lg text-ink text-sm"
                />
              </FilterField>
              <FilterField label={`${t('common.price', 'Price')} Max (₹)`}>
                <input
                  type="number"
                  placeholder="10000"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                  className="w-full h-9 px-3 bg-surface-muted border border-line rounded-lg text-ink text-sm"
                />
              </FilterField>
              <FilterField label={t('marketplace.sortBy', 'Sort order')}>
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  className="w-full h-9 px-3 bg-surface-muted border border-line rounded-lg text-ink text-sm"
                >
                  <option value="latest">{t('marketplace.sortLatest', 'Latest Listings')}</option>
                  <option value="price_asc">{t('marketplace.sortPriceAsc', 'Price: Low to High')}</option>
                  <option value="price_desc">{t('marketplace.sortPriceDesc', 'Price: High to Low')}</option>
                  <option value="quantity_desc">{t('common.quantity', 'Quantity')}</option>
                </select>
              </FilterField>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 cursor-pointer pb-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={isOrganic}
                    onChange={(e) => { setIsOrganic(e.target.checked); setPage(1); }}
                    className="w-4 h-4 rounded border-line text-brand-800 accent-brand-800 cursor-pointer"
                  />
                  <span className="flex items-center gap-1 text-brand-800 font-medium">
                    <Leaf className="w-3.5 h-3.5" /> {t('marketplace.organic', 'Organic')}
                  </span>
                </label>
                <button
                  onClick={handleResetFilters}
                  title={t('common.resetFilters', 'Reset filters')}
                  className="pb-2 text-xs text-ink-subtle hover:text-ink flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> {t('common.reset', 'Reset')}
                </button>
              </div>
            </div>
          )}

          {/* Summary line */}
          <div className="flex items-center justify-between text-xs text-ink-muted pt-1 border-t border-line/60">
            <span>
              {t('marketplace.showingListings', {
                count: listings.length,
                total: pagination.total,
                defaultValue: `Showing ${listings.length} of ${pagination.total} active listings`
              })}
            </span>
            {activeFilterCount > 0 && (
              <button onClick={handleResetFilters} className="text-brand-800 hover:text-brand-900 font-medium flex items-center gap-1 cursor-pointer">
                <RotateCcw className="w-3 h-3" /> {t('common.resetFilters', 'Reset filters')}
              </button>
            )}
          </div>
        </div>

        {/* Listings grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger">
              {listings.map((item) => {
                const primaryImage = item.productImages?.[0]?.imageUrl;
                const displayImg = getCropImageUrl(item.cropName, item.category?.name, primaryImage);
                const farmer = item.farmerProfile;
                const farmerUser = farmer?.user;

                return (
                  <Link
                    key={item.id}
                    to={`/crops/${item.id}`}
                    className="group bg-surface border border-line rounded-xl overflow-hidden hover:shadow-card-hover transition-shadow flex flex-col shadow-card"
                  >
                    <div className="relative aspect-[4/3] bg-surface-muted overflow-hidden">
                      <img
                        src={displayImg}
                        alt={item.cropName}
                        loading="lazy"
                        onError={(e) => handleImageFallback(e, item.cropName, item.category?.name)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {item.isOrganic && (
                        <span className="absolute top-3 left-3">
                          <Badge colour="brand" size="sm" icon={<Leaf className="w-3 h-3" />}>
                            {t('marketplace.organic', 'Organic')}
                          </Badge>
                        </span>
                      )}
                      {item.quality && (
                        <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface/95 text-ink border border-line backdrop-blur-sm">
                          {t('marketplace.grade', { grade: item.quality, defaultValue: `Grade ${item.quality}` })}
                        </span>
                      )}
                      <span className="absolute bottom-3 left-3 text-[11px] font-medium px-2.5 py-1 rounded-md bg-surface/95 text-ink-muted border border-line backdrop-blur-sm">
                        {item.category?.name}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-semibold text-ink group-hover:text-brand-800 transition-colors line-clamp-1">
                        {item.cropName}
                      </h3>
                      {item.location && (
                        <p className="text-xs text-ink-muted flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 flex-shrink-0 text-brand-700" />
                          <span className="truncate">{item.location}</span>
                        </p>
                      )}

                      <div className="mt-auto pt-3 flex items-end justify-between border-t border-line">
                        <div>
                          <span className="text-[11px] text-ink-subtle block">{t('common.price', 'Price')}</span>
                          <span className="text-lg font-semibold text-brand-800">
                            {formatCurrency(item.pricePerUnit)}
                          </span>
                          <span className="text-xs text-ink-subtle ml-0.5">/{item.unit}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-ink-subtle block">{t('marketplace.available', 'Available')}</span>
                          <span className="text-xs font-semibold text-ink">
                            {formatNumber(item.quantity)} {item.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-2.5 bg-surface-muted/60 border-t border-line text-xs flex items-center justify-between">
                      <span className="text-ink-muted truncate flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" />
                        <span className="truncate">{farmerUser?.name || farmer?.farmName || t('cropDetail.verifiedSeller', 'Verified Producer')}</span>
                      </span>
                      <span className="text-brand-800 font-semibold group-hover:translate-x-0.5 transition-transform shrink-0">
                        {t('common.view', 'View')} &rarr;
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              onChange={setPage}
            />
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
      <label className="block text-xs font-medium text-ink-muted mb-1">{label}</label>
      {children}
    </div>
  );
}
