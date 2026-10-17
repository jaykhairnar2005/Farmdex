import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Sprout,
  MapPin,
  Tag,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Package,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { fetchCategoriesApi, fetchCropListingsApi } from '../services/api';

export default function Marketplace() {
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter and pagination states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isOrganic, setIsOrganic] = useState(false);
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 12 });

  // Load active categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetchCategoriesApi();
        if (res.success && Array.isArray(res.data)) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch listings with current filter parameters
  const loadListings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 12,
        sort,
      };
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
        setError(res.message || 'Failed to load crop listings');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching marketplace listings');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, minPrice, maxPrice, isOrganic, sort]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-8 flex-1">
        {/* Marketplace Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-1">
              <Sprout className="w-4 h-4" />
              <span>Real-Time Mandi &amp; Farm Direct</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Agricultural Marketplace</h1>
            <p className="text-sm text-slate-400 mt-1">
              Browse farm-fresh crops, grains, and produce directly listed by verified farmers across India.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              {pagination.total} Active Listings
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by crop name (e.g. Wheat, Basmati, Tomato) or district/mandi..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition-all shadow-md cursor-pointer"
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                title="Reset All Filters"
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Secondary Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-800/80 text-xs">
            {/* Category Select */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-emerald-500 text-xs"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Min Price (₹)
              </label>
              <input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-emerald-500 text-xs font-mono"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Max Price (₹)
              </label>
              <input
                type="number"
                placeholder="10000"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-emerald-500 text-xs font-mono"
              />
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Sort By
              </label>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:border-emerald-500 text-xs"
              >
                <option value="latest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="quantity_desc">Quantity: High to Low</option>
              </select>
            </div>

            {/* Organic Switch */}
            <div className="flex items-center sm:justify-start pt-5">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOrganic}
                  onChange={(e) => {
                    setIsOrganic(e.target.checked);
                    setPage(1);
                  }}
                  className="w-4 h-4 text-emerald-600 rounded bg-slate-950 border-slate-800 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-emerald-400">Organic Only</span>
              </label>
            </div>
          </div>
        </section>

        {/* Listings Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-3 font-mono text-sm text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p>Loading marketplace produce listings...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-center space-y-2">
            <p className="font-semibold">{error}</p>
            <button
              onClick={loadListings}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs rounded-lg transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center space-y-4 shadow-xl max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg text-white">No Produce Listings Found</h3>
            <p className="text-xs text-slate-400">
              No crop listings matched your search criteria or price filters. Try adjusting or clearing your filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl shadow-md transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((item) => {
              const primaryImage = item.productImages?.[0]?.imageUrl;
              const farmer = item.farmerProfile;
              const farmerUser = farmer?.user;

              return (
                <Link
                  key={item.id}
                  to={`/crops/${item.id}`}
                  className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 shadow-xl transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Image or Styled Fallback */}
                    <div className="relative aspect-video bg-slate-950 overflow-hidden">
                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={item.cropName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 space-y-1 bg-gradient-to-br from-slate-950 to-slate-900">
                          <Sprout className="w-8 h-8 text-emerald-500/30" />
                          <span className="text-[11px] font-mono text-slate-500">FarmDex Produce</span>
                        </div>
                      )}

                      {/* Organic Badge */}
                      {item.isOrganic && (
                        <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
                          ORGANIC
                        </span>
                      )}

                      {/* Category Badge */}
                      <span className="absolute bottom-2.5 left-2.5 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-950/80 text-slate-300 border border-slate-800 backdrop-blur-sm">
                        {item.category?.name}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                          {item.cropName}
                        </h3>
                        {item.location && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </p>
                        )}
                      </div>

                      {/* Price and Quantity Pills */}
                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <div className="text-xs text-slate-500">Price</div>
                          <div className="text-lg font-bold text-emerald-400 font-mono">
                            ₹{Number(item.pricePerUnit).toLocaleString('en-IN')}
                            <span className="text-xs font-normal text-slate-400"> / {item.unit}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-slate-500">Available</div>
                          <div className="text-sm font-semibold text-slate-200 font-mono">
                            {Number(item.quantity).toLocaleString('en-IN')} {item.unit}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer with Farmer info */}
                  <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/40 text-xs flex items-center justify-between">
                    <span className="text-slate-400 truncate">
                      Farmer: <strong className="text-slate-300">{farmerUser?.name || farmer?.farmName || 'Verified Farmer'}</strong>
                    </span>
                    <span className="text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                      View Details &rarr;
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 pt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <span className="text-xs font-mono text-slate-400">
              Page {page} of {pagination.totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages || loading}
              className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
