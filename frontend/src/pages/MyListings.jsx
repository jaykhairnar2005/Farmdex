import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Sprout,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Layers,
  ArrowUpDown,
  Filter,
  Image as ImageIcon,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import CropListingModal from '../components/CropListingModal';
import {
  fetchMyCropListingsApi,
  createCropListingApi,
  updateCropListingApi,
  updateListingStatusApi,
  deleteCropListingApi,
  uploadListingImageApi,
} from '../services/api';

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [listingToEdit, setListingToEdit] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [statusFilter, setStatusFilter] = useState('');
  const [changingStatusId, setChangingStatusId] = useState(null);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const res = await fetchMyCropListingsApi(params);
      if (res.success && Array.isArray(res.data)) {
        setListings(res.data);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load your crop listings',
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const handleOpenAddModal = () => {
    setListingToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (listing) => {
    setListingToEdit(listing);
    setModalOpen(true);
  };

  const [deletingId, setDeletingId] = useState(null);

  const handleSaveListing = async (listingData, pendingFiles = []) => {
    setMessage({ type: '', text: '' });
    setSubmitting(true);
    try {
      if (listingToEdit) {
        await updateCropListingApi(listingToEdit.id, listingData);
        setMessage({ type: 'success', text: 'Crop listing updated successfully!' });
      } else {
        const res = await createCropListingApi(listingData);
        const newListing = res.data;
        let uploadWarning = '';

        // Automatically upload any pending photos selected during listing creation
        if (pendingFiles && pendingFiles.length > 0 && newListing?.id) {
          for (const file of pendingFiles) {
            try {
              const formData = new FormData();
              formData.append('image', file);
              await uploadListingImageApi(newListing.id, formData);
            } catch (imgErr) {
              uploadWarning = imgErr.response?.data?.message || imgErr.message || 'Image upload error';
            }
          }
        }

        if (uploadWarning) {
          setMessage({
            type: 'success',
            text: `New crop listing published! (Image note: ${uploadWarning})`,
          });
        } else {
          setMessage({ type: 'success', text: 'New crop listing published successfully!' });
        }
      }
      setModalOpen(false);
      await loadListings();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to save crop listing',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteListing = async (listing) => {
    if (!window.confirm(`Are you sure you want to delete "${listing.cropName}"? This action cannot be undone.`)) {
      return;
    }
    setMessage({ type: '', text: '' });
    setDeletingId(listing.id);
    try {
      await deleteCropListingApi(listing.id);
      setMessage({ type: 'success', text: `"${listing.cropName}" deleted successfully!` });
      await loadListings();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete listing',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (listingId, newStatus) => {
    setMessage({ type: '', text: '' });
    setChangingStatusId(listingId);
    try {
      await updateListingStatusApi(listingId, newStatus);
      setMessage({ type: 'success', text: `Listing status updated to ${newStatus}` });
      await loadListings();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change listing status',
      });
    } finally {
      setChangingStatusId(null);
    }
  };

  const activeCount = listings.filter((l) => l.status === 'ACTIVE').length;
  const inactiveCount = listings.filter((l) => l.status === 'INACTIVE').length;
  const soldOutCount = listings.filter((l) => l.status === 'SOLD_OUT').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sprout className="w-7 h-7 text-emerald-400" /> My Produce Listings
            </h1>
            <p className="text-sm text-slate-400">
              Manage your published agricultural batches, pricing, inventory, and photos
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto text-sm"
          >
            <Plus className="w-4 h-4" /> Add New Produce
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Total Produce</span>
            <div className="text-2xl font-bold text-white font-mono">{listings.length}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Active in Market</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{activeCount}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Inactive / Draft</span>
            <div className="text-2xl font-bold text-slate-300 font-mono">{inactiveCount}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400">Sold Out</span>
            <div className="text-2xl font-bold text-amber-400 font-mono">{soldOutCount}</div>
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
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:border-emerald-500 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SOLD_OUT">SOLD_OUT</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        </div>

        {/* Listings Content */}
        {loading ? (
          <div className="py-16 text-center text-slate-500 font-mono text-sm animate-pulse">
            Loading your produce inventory...
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xl max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">No Produce Listed Yet</h3>
            <p className="text-xs text-slate-400">
              You haven&apos;t published any crops or produce yet. Click below to add your first batch to the marketplace.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add First Produce
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Produce</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Price / Unit</th>
                    <th className="px-4 py-3.5">Quantity</th>
                    <th className="px-4 py-3.5">Origin Farm</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {listings.map((item) => {
                    const primaryImage = item.productImages?.[0]?.imageUrl;

                    let statusBadgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
                    if (item.status === 'ACTIVE') statusBadgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                    if (item.status === 'SOLD_OUT') statusBadgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                    if (item.status === 'ARCHIVED') statusBadgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {primaryImage ? (
                                <img src={primaryImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Sprout className="w-4 h-4 text-emerald-500/40" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                                {item.cropName}
                                {item.isOrganic && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                                    BIO
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500">{item.location || 'Location unassigned'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-slate-300">{item.category?.name}</td>

                        <td className="px-4 py-3.5 font-mono text-emerald-400 font-semibold">
                          ₹{Number(item.pricePerUnit).toLocaleString('en-IN')}/{item.unit}
                        </td>

                        <td className="px-4 py-3.5 font-mono text-slate-200">
                          {Number(item.quantity).toLocaleString('en-IN')} {item.unit}
                        </td>

                        <td className="px-4 py-3.5 text-slate-400">{item.farm?.name || '—'}</td>

                        <td className="px-4 py-3.5">
                          <select
                            value={item.status}
                            disabled={changingStatusId === item.id}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className={`px-2 py-1 rounded-md text-[10px] font-mono font-semibold border focus:outline-none cursor-pointer ${statusBadgeClass}`}
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                            <option value="SOLD_OUT">SOLD_OUT</option>
                            <option value="ARCHIVED">ARCHIVED</option>
                          </select>
                        </td>

                        <td className="px-4 py-3.5 text-right space-x-2">
                          <Link
                            to={`/crops/${item.id}`}
                            title="View Public Details"
                            className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 transition-colors inline-block"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit Listing & Manage Photos"
                            className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-lg border border-slate-800 transition-colors cursor-pointer inline-block"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteListing(item)}
                            disabled={deletingId === item.id}
                            title="Delete Listing"
                            className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 transition-colors cursor-pointer inline-block disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        <CropListingModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveListing}
          listingToEdit={listingToEdit}
          submitting={submitting}
        />
      </main>
    </div>
  );
}
