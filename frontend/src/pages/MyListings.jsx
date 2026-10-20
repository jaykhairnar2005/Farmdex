import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Sprout, Edit, Trash2, Eye } from 'lucide-react';
import {
  PageHeader, StatCard, InlineAlert, FilterPills, SkeletonTable, EmptyState,
  ConfirmDialog, Button, ButtonLink, Tooltip, StatusBadge,
} from '../components/ui';
import AppLayout from '../layouts/AppLayout';
import CropListingModal from '../components/CropListingModal';
import {
  fetchMyCropListingsApi, createCropListingApi, updateCropListingApi,
  updateListingStatusApi, deleteCropListingApi, uploadListingImageApi,
} from '../services/api';
import { getCropImageUrl, handleImageFallback } from '../utils/cropImages';
import { formatCurrency, formatNumber } from '../utils/formatters';

export default function MyListings() {
  const { t } = useTranslation();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [listingToEdit, setListingToEdit] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: '', text: '' });
  const [statusFilter, setStatusFilter] = useState('');
  const [changingStatusId, setChangingStatusId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const statusPills = useMemo(() => [
    { id: '', label: t('common.all', 'All') },
    { id: 'ACTIVE', label: t('status.active', 'Active') },
    { id: 'INACTIVE', label: t('status.inactive', 'Inactive') },
    { id: 'SOLD_OUT', label: t('status.soldOut', 'Sold out') },
    { id: 'ARCHIVED', label: t('status.archived', 'Archived') },
  ], [t]);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await fetchMyCropListingsApi(params);
      if (res.success && Array.isArray(res.data)) setListings(res.data);
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.message || t('common.error', 'Failed to load crop listings') });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => { loadListings(); }, [loadListings]);

  const handleSaveListing = async (listingData, pendingFiles = []) => {
    setAlert({ type: '', text: '' });
    setSubmitting(true);
    try {
      if (listingToEdit) {
        await updateCropListingApi(listingToEdit.id, listingData);
        setAlert({ type: 'success', text: t('common.saved', 'Listing updated successfully.') });
      } else {
        const res = await createCropListingApi(listingData);
        const newListing = res.data;
        let uploadWarning = '';
        if (pendingFiles?.length > 0 && newListing?.id) {
          for (const file of pendingFiles) {
            try {
              const fd = new FormData();
              fd.append('image', file);
              await uploadListingImageApi(newListing.id, fd);
            } catch (imgErr) {
              uploadWarning = imgErr.response?.data?.message || imgErr.message || 'Image upload issue';
            }
          }
        }
        setAlert({
          type: 'success',
          text: uploadWarning
            ? `Listing published. (Image note: ${uploadWarning})`
            : t('common.saved', 'New listing published successfully.'),
        });
      }
      setModalOpen(false);
      await loadListings();
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.message || err.message || t('common.error', 'Failed to save listing') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCropListingApi(deleteTarget.id);
      setAlert({ type: 'success', text: `"${deleteTarget.cropName}" deleted.` });
      setDeleteTarget(null);
      await loadListings();
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.message || t('common.error', 'Failed to delete listing') });
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (listingId, newStatus) => {
    setChangingStatusId(listingId);
    try {
      await updateListingStatusApi(listingId, newStatus);
      await loadListings();
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.message || t('common.error', 'Failed to change status') });
    } finally {
      setChangingStatusId(null);
    }
  };

  const active   = listings.filter((l) => l.status === 'ACTIVE').length;
  const inactive = listings.filter((l) => l.status === 'INACTIVE').length;
  const sold     = listings.filter((l) => l.status === 'SOLD_OUT').length;

  return (
    <AppLayout>
      <div className="space-y-6 fade-in">
        <PageHeader
          icon={<Sprout />}
          eyebrow={t('home.heroTag', 'Agricultural marketplace')}
          title={t('myListings.title', 'My Produce Batches')}
          subtitle={t('myListings.subtitle', 'Manage your listed harvests, adjust pricing, and track remaining quantities.')}
          actions={
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => { setListingToEdit(null); setModalOpen(true); }}>
              {t('myListings.listNew', 'List New Harvest')}
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label={t('home.stats.activeListings', 'Total batches')} value={listings.length} icon={<Sprout />} />
          <StatCard label={t('status.active', 'Active in market')} value={active} icon={<Sprout />} tone="success" />
          <StatCard label={t('status.inactive', 'Inactive / draft')} value={inactive} icon={<Sprout />} />
          <StatCard label={t('status.soldOut', 'Sold out')} value={sold} icon={<Sprout />} tone="warning" />
        </div>

        {alert.text && (
          <InlineAlert type={alert.type} message={alert.text} onDismiss={() => setAlert({ type: '', text: '' })} />
        )}

        {/* Filter */}
        <FilterPills items={statusPills} value={statusFilter} onChange={(v) => { setStatusFilter(v); }} />

        {/* Table */}
        {loading ? (
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <SkeletonTable rows={5} cols={6} />
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            icon={Sprout}
            title={t('myListings.empty', 'No produce listed yet')}
            message={t('myListings.emptyDesc', 'Publish your first crop batch to the marketplace and start receiving buyer offers.')}
            action={{ label: t('myListings.listNew', 'Add first produce'), onClick: () => { setListingToEdit(null); setModalOpen(true); } }}
          />
        ) : (
          <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted border-b border-line text-[11px] uppercase font-semibold text-ink-subtle tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">{t('myListings.table.crop', 'Produce')}</th>
                    <th className="px-4 py-3.5 hidden sm:table-cell">{t('common.filter', 'Category')}</th>
                    <th className="px-4 py-3.5">{t('myListings.table.price', 'Price / unit')}</th>
                    <th className="px-4 py-3.5 hidden md:table-cell">{t('myListings.table.quantity', 'Quantity')}</th>
                    <th className="px-4 py-3.5 hidden lg:table-cell">{t('myListings.table.farm', 'Farm')}</th>
                    <th className="px-4 py-3.5">{t('myListings.table.status', 'Status')}</th>
                    <th className="px-4 py-3.5 text-right">{t('myListings.table.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {listings.map((item) => {
                    const primaryImage = item.productImages?.[0]?.imageUrl;
                    const busy = changingStatusId === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-surface-muted/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-surface-muted border border-line overflow-hidden shrink-0">
                              <img
                                src={getCropImageUrl(item.cropName, item.category?.name, primaryImage)}
                                alt={item.cropName}
                                onError={(e) => handleImageFallback(e, item.cropName, item.category?.name)}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-semibold text-ink flex items-center gap-1.5">
                                {item.cropName}
                                {item.isOrganic && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-800 border border-brand-100">
                                    {t('marketplace.organic', 'Organic')}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-ink-subtle mt-0.5">{item.location || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-ink-muted hidden sm:table-cell">{item.category?.name}</td>
                        <td className="px-4 py-3.5 font-semibold text-brand-800">
                          {formatCurrency(item.pricePerUnit)}/{item.unit}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-ink hidden md:table-cell">
                          {formatNumber(item.quantity)} {item.unit}
                        </td>
                        <td className="px-4 py-3.5 text-ink-muted hidden lg:table-cell">{item.farm?.name || '—'}</td>
                        <td className="px-4 py-3.5">
                          <select
                            value={item.status}
                            disabled={busy}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            className="h-7 px-2 text-[11px] font-medium border border-line rounded-lg bg-surface cursor-pointer focus:outline-none disabled:opacity-50"
                          >
                            <option value="ACTIVE">{t('status.active', 'Active')}</option>
                            <option value="INACTIVE">{t('status.inactive', 'Inactive')}</option>
                            <option value="SOLD_OUT">{t('status.soldOut', 'Sold out')}</option>
                            <option value="ARCHIVED">{t('status.archived', 'Archived')}</option>
                          </select>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            <Tooltip label={t('common.view', 'View listing')}>
                              <Link
                                to={`/crops/${item.id}`}
                                className="w-7 h-7 flex items-center justify-center text-ink-subtle hover:text-brand-800 hover:bg-brand-50 rounded-lg border border-line transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                            </Tooltip>
                            <Tooltip label={t('common.edit', 'Edit')}>
                              <button
                                onClick={() => { setListingToEdit(item); setModalOpen(true); }}
                                className="w-7 h-7 flex items-center justify-center text-ink-subtle hover:text-brand-800 hover:bg-brand-50 rounded-lg border border-line transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                            <Tooltip label={t('common.delete', 'Delete')}>
                              <button
                                onClick={() => setDeleteTarget(item)}
                                className="w-7 h-7 flex items-center justify-center text-ink-subtle hover:text-danger hover:bg-danger-soft rounded-lg border border-line transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <CropListingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveListing}
        listingToEdit={listingToEdit}
        submitting={submitting}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title={t('common.delete', 'Delete listing')}
        message={`Are you sure you want to delete "${deleteTarget?.cropName}"?`}
        confirmLabel={t('common.delete', 'Delete')}
        cancelLabel={t('common.cancel', 'Cancel')}
        tone="danger"
      />
    </AppLayout>
  );
}
