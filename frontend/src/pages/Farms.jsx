import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tractor, Trash2, MapPin, Edit2 } from 'lucide-react';
import {
  PageHeader, StatCard, Card, InlineAlert, EmptyState, Button, Tooltip,
  ConfirmDialog, SkeletonBlock,
} from '../components/ui';
import AppLayout from '../layouts/AppLayout';
import FarmModal from '../components/FarmModal';
import { getFarmsApi, createFarmApi, updateFarmApi, deleteFarmApi } from '../services/api';
import { DEFAULT_FARM_HERO_IMAGE } from '../utils/cropImages';
import { formatDate } from '../utils/formatters';

export default function Farms() {
  const { t } = useTranslation();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [farmToEdit, setFarmToEdit] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: '', text: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadFarms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getFarmsApi();
      if (res.success && Array.isArray(res.data)) setFarms(res.data);
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.message || t('common.error', 'Failed to load farms') });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadFarms(); }, [loadFarms]);

  const handleSaveFarm = async (farmData) => {
    setAlert({ type: '', text: '' });
    setSubmitting(true);
    try {
      if (farmToEdit) {
        await updateFarmApi(farmToEdit.id, farmData);
        setAlert({ type: 'success', text: t('common.saved', 'Farm updated successfully.') });
      } else {
        await createFarmApi(farmData);
        setAlert({ type: 'success', text: t('common.saved', 'Farm registered successfully.') });
      }
      setModalOpen(false);
      await loadFarms();
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.message || t('common.error', 'Failed to save farm') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFarmApi(deleteTarget.id);
      setAlert({ type: 'success', text: `Farm "${deleteTarget.name}" deleted.` });
      setDeleteTarget(null);
      await loadFarms();
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.message || t('common.error', 'Failed to delete farm') });
    } finally {
      setDeleting(false);
    }
  };

  const totalAcreage = farms.reduce((acc, f) => acc + (parseFloat(f.size) || 0), 0);

  return (
    <AppLayout width="narrow">
      <div className="space-y-6 fade-in">
        <PageHeader
          icon={<Tractor />}
          eyebrow={t('home.heroTag', 'Agricultural marketplace')}
          title={t('farms.title', 'My Registered Farms')}
          subtitle={t('farms.subtitle', 'Manage the agricultural land, soil types, and acreage where your produce is cultivated.')}
          actions={
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => { setFarmToEdit(null); setModalOpen(true); }}>
              {t('farms.registerNew', 'Register New Farm')}
            </Button>
          }
        />

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label={t('farms.title', 'Registered Farms')} value={farms.length} icon={<Tractor />} tone="brand" />
          <StatCard
            label={t('farms.acres', { count: totalAcreage > 0 ? totalAcreage.toFixed(1) : 0, defaultValue: `${totalAcreage.toFixed(1)} Acres` })}
            value={totalAcreage > 0 ? `${totalAcreage.toFixed(1)} acres` : '—'}
            icon={<Tractor />}
          />
          <StatCard
            label={t('common.location', 'Location')}
            value={farms[0]?.state ? [farms[0].district, farms[0].state].filter(Boolean).join(', ') : '—'}
            icon={<MapPin />}
          />
        </div>

        {alert.text && (
          <InlineAlert type={alert.type} message={alert.text} onDismiss={() => setAlert({ type: '', text: '' })} />
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <SkeletonBlock className="h-28 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <SkeletonBlock className="h-4 w-2/3" />
                  <SkeletonBlock className="h-3 w-full" />
                  <SkeletonBlock className="h-3 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : farms.length === 0 ? (
          <EmptyState
            icon={Tractor}
            title={t('farms.empty', 'No farms registered yet')}
            message={t('farms.emptyDesc', 'Register your farm locations so buyers can trace the verified origin of your produce.')}
            action={{ label: t('farms.registerFirst', 'Register your first farm'), onClick: () => { setFarmToEdit(null); setModalOpen(true); } }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
            {farms.map((farm) => (
              <Card key={farm.id} className="overflow-hidden flex flex-col hover:shadow-card-hover transition-shadow">
                {/* Banner */}
                <div className="h-28 relative overflow-hidden">
                  <img
                    src={DEFAULT_FARM_HERO_IMAGE}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-brand-950/55" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-white/15 text-white backdrop-blur-sm border border-white/20">
                        {t('cropDetail.registeredFarm', 'Farm plot')}
                      </span>
                      <div className="flex items-center gap-1">
                        <Tooltip label={t('common.edit', 'Edit farm')}>
                          <button
                            onClick={() => { setFarmToEdit(farm); setModalOpen(true); }}
                            className="p-1.5 text-white/85 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip label={t('common.delete', 'Delete farm')}>
                          <button
                            onClick={() => setDeleteTarget(farm)}
                            className="p-1.5 text-white/85 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                    <h3 className="font-semibold text-base text-white tracking-tight line-clamp-1">{farm.name}</h3>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 text-xs">
                    {farm.size && (
                      <div className="flex items-center justify-between bg-brand-50/70 px-3 py-1.5 rounded-md border border-brand-100">
                        <span className="text-ink-muted">{t('modals.farm.size', 'Land size')}</span>
                        <span className="text-brand-800 font-semibold">{t('farms.acres', { count: farm.size })}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-1.5 text-ink-muted pt-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-700 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">
                        {[farm.address, farm.district, farm.state, farm.pincode].filter(Boolean).join(', ') || '—'}
                      </span>
                    </div>
                    {(farm.soilType || farm.waterSource) && (
                      <p className="text-[11px] text-ink-subtle">
                        {[farm.soilType, farm.waterSource].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="pt-3 border-t border-line text-[11px] text-ink-subtle flex justify-between">
                    <span className="font-mono">ID: {farm.id.substring(0, 8)}…</span>
                    <span>{formatDate(farm.createdAt)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <FarmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveFarm}
        farmToEdit={farmToEdit}
        submitting={submitting}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title={t('common.delete', 'Delete farm')}
        message={t('farms.deleteConfirm', `Are you sure you want to delete this farm? Existing crop listings tied to this farm may be affected.`)}
        confirmLabel={t('common.delete', 'Delete')}
        cancelLabel={t('common.cancel', 'Cancel')}
        tone="danger"
      />
    </AppLayout>
  );
}
