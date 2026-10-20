import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Sprout, Upload, Trash2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchCategoriesApi, getFarmsApi, uploadListingImageApi, deleteListingImageApi } from '../services/api';

const listingFormSchema = z.object({
  cropName: z.string().min(2, 'Crop name must be at least 2 characters').max(100),
  categoryId: z.string().min(1, 'Please select a crop category'),
  farmId: z.string().optional(),
  quantity: z.string().min(1, 'Quantity is required').transform((v) => parseFloat(v)),
  unit: z.string().min(1, 'Unit is required'),
  pricePerUnit: z.string().min(1, 'Price per unit is required').transform((v) => parseFloat(v)),
  quality: z.string().optional(),
  harvestDate: z.string().optional(),
  location: z.string().optional(),
  isOrganic: z.boolean().default(false),
  description: z.string().max(2000).optional(),
});

const defaultUnits = ['kg', 'quintal', 'ton', 'crate', 'bag', 'box', 'bunch'];
const defaultQualities = ['Premium / Grade A', 'Grade B', 'Export Quality', 'Standard Market Grade'];

export default function CropListingModal({ isOpen, onClose, onSave, listingToEdit, submitting }) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [farms, setFarms] = useState([]);
  const [images, setImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      cropName: '',
      categoryId: '',
      farmId: '',
      quantity: '',
      unit: 'kg',
      pricePerUnit: '',
      quality: 'Standard Market Grade',
      harvestDate: '',
      location: '',
      isOrganic: false,
      description: '',
    },
  });

  const selectedFarmId = watch('farmId');

  // Load categories and farmer's farms when modal opens
  useEffect(() => {
    if (isOpen) {
      async function loadDependencies() {
        try {
          const [catRes, farmRes] = await Promise.all([
            fetchCategoriesApi(),
            getFarmsApi(),
          ]);
          if (catRes.success && Array.isArray(catRes.data)) {
            setCategories(catRes.data);
          }
          if (farmRes.success && Array.isArray(farmRes.data)) {
            setFarms(farmRes.data);
          }
        } catch (err) {
          console.error('Failed to load listing dependencies:', err);
        }
      }
      loadDependencies();
    }
  }, [isOpen]);

  // Sync form state when listingToEdit changes
  useEffect(() => {
    if (listingToEdit) {
      reset({
        cropName: listingToEdit.cropName || '',
        categoryId: listingToEdit.categoryId || '',
        farmId: listingToEdit.farmId || '',
        quantity: listingToEdit.quantity ? String(listingToEdit.quantity) : '',
        unit: listingToEdit.unit || 'kg',
        pricePerUnit: listingToEdit.pricePerUnit ? String(listingToEdit.pricePerUnit) : '',
        quality: listingToEdit.quality || 'Standard Market Grade',
        harvestDate: listingToEdit.harvestDate ? listingToEdit.harvestDate.slice(0, 10) : '',
        location: listingToEdit.location || '',
        isOrganic: Boolean(listingToEdit.isOrganic),
        description: listingToEdit.description || '',
      });
      setImages(listingToEdit.productImages || []);
    } else {
      reset({
        cropName: '',
        categoryId: '',
        farmId: '',
        quantity: '',
        unit: 'kg',
        pricePerUnit: '',
        quality: 'Standard Market Grade',
        harvestDate: '',
        location: '',
        isOrganic: false,
        description: '',
      });
      setImages([]);
    }
    // Clean up any pending preview URLs
    pendingFiles.forEach((p) => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });
    setPendingFiles([]);
    setImageError('');
  }, [listingToEdit, reset, isOpen]);

  // Auto-fill location when farm is selected
  useEffect(() => {
    if (selectedFarmId && farms.length > 0) {
      const selectedFarm = farms.find((f) => f.id === selectedFarmId);
      if (selectedFarm) {
        const loc = [selectedFarm.district, selectedFarm.state].filter(Boolean).join(', ');
        if (loc) setValue('location', loc);
      }
    }
  }, [selectedFarmId, farms, setValue]);

  if (!isOpen) return null;

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image exceeds the 5 MB limit.');
      e.target.value = '';
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageError('Only JPEG, PNG, and WebP raster images are supported.');
      e.target.value = '';
      return;
    }

    setImageError('');

    if (!listingToEdit?.id) {
      // Create mode: Create local object preview and queue for upload on publish
      const previewUrl = URL.createObjectURL(file);
      setPendingFiles((prev) => [
        ...prev,
        { id: Math.random().toString(36).substring(2, 9), file, previewUrl },
      ]);
      e.target.value = '';
      return;
    }

    // Edit mode: Upload immediately to existing listing
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await uploadListingImageApi(listingToEdit.id, formData);
      if (res.success && res.data) {
        setImages((prev) => [...prev, res.data]);
      }
    } catch (err) {
      setImageError(err.response?.data?.message || err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handlePendingFileDelete = (id) => {
    setPendingFiles((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleImageDelete = async (imageId) => {
    if (!listingToEdit?.id) return;
    try {
      await deleteListingImageApi(listingToEdit.id, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setImageError(err.response?.data?.message || err.message || 'Failed to remove image');
    }
  };

  const handleFormSubmit = (data) => {
    // If farmId is empty string, convert to null
    const payload = {
      ...data,
      farmId: data.farmId ? data.farmId : null,
      harvestDate: data.harvestDate ? new Date(data.harvestDate).toISOString() : null,
    };
    onSave(payload, pendingFiles.map((p) => p.file));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full bg-surface border border-line rounded-2xl shadow-modal p-6 sm:p-8 space-y-6 my-8 fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-brand-50 border border-brand-100 rounded-xl text-brand-800">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-ink">
                {listingToEdit ? t('modals.cropListing.titleEdit') : t('modals.cropListing.titleNew')}
              </h3>
              <p className="text-xs text-ink-muted">
                {t('modals.cropListing.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-subtle hover:text-ink-muted hover:bg-surface-sunken rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Row 1: Crop Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                {t('modals.cropListing.cropName')} *
              </label>
              <input
                type="text"
                {...register('cropName')}
                placeholder="e.g. Sharbati Wheat, Alphonso Mango"
                className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
              />
              {errors.cropName && <p className="text-xs text-danger">{errors.cropName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                {t('modals.cropListing.category')} *
              </label>
              <select
                {...register('categoryId')}
                className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
              >
                <option value="">{t('common.selectLanguage')}...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="text-xs text-danger">{errors.categoryId.message}</p>}
            </div>
          </div>

          {/* Row 2: Farm Location & Quality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                {t('modals.cropListing.farm')} ({t('common.optional')})
              </label>
              <select
                {...register('farmId')}
                className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
              >
                <option value="">{t('common.all')}</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.district || f.state || 'Registered'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                {t('modals.cropListing.grade')}
              </label>
              <select
                {...register('quality')}
                className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
              >
                {defaultQualities.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Quantity, Unit & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                {t('modals.cropListing.quantity')} *
              </label>
              <input
                type="number"
                step="0.001"
                {...register('quantity')}
                placeholder="500"
                className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
              />
              {errors.quantity && <p className="text-xs text-danger">{errors.quantity.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                {t('modals.cropListing.unit')} *
              </label>
              <select
                {...register('unit')}
                className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
              >
                {defaultUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              {errors.unit && <p className="text-xs text-danger">{errors.unit.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                {t('modals.cropListing.pricePerUnit')} *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('pricePerUnit')}
                placeholder="2450.00"
                className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
              />
              {errors.pricePerUnit && <p className="text-xs text-danger">{errors.pricePerUnit.message}</p>}
            </div>
          </div>

          {/* Row 4: Harvest Date, Location, Organic Switch */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                {t('modals.cropListing.harvestDate')}
              </label>
              <input
                type="date"
                {...register('harvestDate')}
                className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                {t('common.location')}
              </label>
              <input
                type="text"
                {...register('location')}
                placeholder="e.g. Nashik, Maharashtra"
                className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
              />
            </div>

            <div className="space-y-1.5 flex flex-col justify-end pb-2">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isOrganic')}
                  className="w-4 h-4 text-brand-800 rounded border-line-strong focus:ring-brand-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-brand-800 uppercase tracking-wider">
                  {t('modals.cropListing.isOrganic')}
                </span>
              </label>
            </div>
          </div>

          {/* Row 5: Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
              {t('modals.cropListing.description')}
            </label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Describe variety, moisture content, storage conditions, packaging, etc."
              className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
            ></textarea>
          </div>

          {/* Image Management Section */}
          <div className="pt-3 border-t border-line space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                  {t('modals.cropListing.photos')} {listingToEdit ? `(${images.length})` : pendingFiles.length > 0 ? `(${pendingFiles.length})` : ''}
                </label>
                <p className="text-[11px] text-ink-muted">
                  {listingToEdit
                    ? 'Manage photos for your active produce listing'
                    : 'Attach photos (JPEG, PNG, WebP up to 5 MB)'}
                </p>
              </div>
              <label className="px-3 py-1.5 bg-surface-sunken hover:bg-surface-muted text-ink text-xs font-medium rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-brand-800" />
                {uploadingImage ? 'Uploading to Cloudinary...' : listingToEdit ? 'Upload Image' : 'Select Photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>

            {imageError && (
              <div className="p-3 rounded-lg bg-danger-soft border border-danger-edge text-danger text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{imageError}</span>
              </div>
            )}

            {/* Display either existing uploaded images or pending images selected for creation */}
            {listingToEdit ? (
              images.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {images.map((img) => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden border border-line aspect-video bg-surface-sunken">
                      <img src={img.imageUrl} alt="Produce" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleImageDelete(img.id)}
                        className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 hover:bg-red-700 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Delete image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-line bg-surface-muted/50 text-center text-xs text-ink-muted flex items-center justify-center gap-2">
                  <ImageIcon className="w-4 h-4 text-ink-subtle" />
                  <span>No images uploaded yet. Upload JPEG, PNG or WebP images (max 5 MB).</span>
                </div>
              )
            ) : pendingFiles.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {pendingFiles.map((item) => (
                  <div key={item.id} className="relative group rounded-lg overflow-hidden border border-brand-200 aspect-video bg-surface-sunken">
                    <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-brand-800/90 text-white text-[9px] font-semibold">
                      Ready to upload
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePendingFileDelete(item.id)}
                      className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 hover:bg-red-700 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-line bg-surface-muted/50 text-center text-xs text-ink-muted flex items-center justify-center gap-2">
                <ImageIcon className="w-4 h-4 text-ink-subtle" />
                <span>No photos selected. You can select photos now or add them later after publishing.</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-surface hover:bg-surface-muted text-ink text-sm font-medium rounded-lg border border-line transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{listingToEdit ? t('common.save') : t('modals.cropListing.submit')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


