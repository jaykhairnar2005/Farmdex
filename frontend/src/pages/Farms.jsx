import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Tractor, Edit2, Trash2, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import FarmModal from '../components/FarmModal';
import { getFarmsApi, createFarmApi, updateFarmApi, deleteFarmApi } from '../services/api';

export default function Farms() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [farmToEdit, setFarmToEdit] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [deletingId, setDeletingId] = useState(null);

  const loadFarms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getFarmsApi();
      if (res.success && Array.isArray(res.data)) {
        setFarms(res.data);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load farms' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  const handleOpenAddModal = () => {
    setFarmToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (farm) => {
    setFarmToEdit(farm);
    setModalOpen(true);
  };

  const handleSaveFarm = async (farmData) => {
    setMessage({ type: '', text: '' });
    setSubmitting(true);
    try {
      if (farmToEdit) {
        await updateFarmApi(farmToEdit.id, farmData);
        setMessage({ type: 'success', text: 'Farm updated successfully!' });
      } else {
        await createFarmApi(farmData);
        setMessage({ type: 'success', text: 'Farm registered successfully!' });
      }
      setModalOpen(false);
      await loadFarms();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save farm details' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFarm = async (farmId, farmName) => {
    if (!window.confirm(`Are you sure you want to delete '${farmName}'?`)) return;

    setMessage({ type: '', text: '' });
    setDeletingId(farmId);
    try {
      await deleteFarmApi(farmId);
      setMessage({ type: 'success', text: `Farm '${farmName}' deleted successfully.` });
      await loadFarms();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete farm' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Tractor className="w-7 h-7 text-emerald-400" /> My Registered Farms
            </h1>
            <p className="text-sm text-slate-400">
              Manage your individual farm locations, sizes, and geographic coordinates
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto text-sm"
          >
            <Plus className="w-4 h-4" /> Add New Farm
          </button>
        </div>

        {/* Status Alert */}
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

        {/* Farms Grid */}
        {loading ? (
          <div className="py-16 text-center text-slate-500 font-mono text-sm animate-pulse">
            Loading your registered farms...
          </div>
        ) : farms.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-xl max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Tractor className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">No Farms Registered Yet</h3>
            <p className="text-xs text-slate-400">
              You haven&apos;t registered any farm locations. Click below to add your first farm.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add First Farm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farms.map((farm) => (
              <div
                key={farm.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-lg text-white line-clamp-1">{farm.name}</h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(farm)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit Farm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFarm(farm.id, farm.name)}
                        disabled={deletingId === farm.id}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete Farm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400">
                    {farm.size && (
                      <p>
                        <span className="text-slate-500 font-semibold">Authoritative Size:</span>{' '}
                        <span className="text-emerald-400 font-mono font-semibold">{farm.size} Acres</span>
                      </p>
                    )}

                    <div className="flex items-start gap-1 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                      <span>
                        {[farm.address, farm.district, farm.state, farm.pincode].filter(Boolean).join(', ') ||
                          'Location not specified'}
                      </span>
                    </div>

                    {(farm.latitude || farm.longitude) && (
                      <p className="font-mono text-[11px] text-slate-500 pt-1">
                        GPS: {farm.latitude || 'N/A'}, {farm.longitude || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono flex justify-between items-center">
                  <span>ID: {farm.id.substring(0, 8)}...</span>
                  <span>Registered: {new Date(farm.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <FarmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveFarm}
        farmToEdit={farmToEdit}
        submitting={submitting}
      />
    </div>
  );
}
