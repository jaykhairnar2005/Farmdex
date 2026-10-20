import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Tractor } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const farmFormSchema = z.object({
  name: z.string().min(2, 'Farm name must be at least 2 characters').max(100, 'Farm name cannot exceed 100 characters'),
  size: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  address: z.string().max(255).optional(),
  district: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{6}$/.test(val), { message: 'Pincode must be exactly 6 numeric digits' }),
  latitude: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  longitude: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
});

export default function FarmModal({ isOpen, onClose, onSave, farmToEdit, submitting }) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(farmFormSchema),
  });

  useEffect(() => {
    if (farmToEdit) {
      reset({
        name: farmToEdit.name || '',
        size: farmToEdit.size ? String(farmToEdit.size) : '',
        address: farmToEdit.address || '',
        district: farmToEdit.district || '',
        state: farmToEdit.state || '',
        pincode: farmToEdit.pincode || '',
        latitude: farmToEdit.latitude ? String(farmToEdit.latitude) : '',
        longitude: farmToEdit.longitude ? String(farmToEdit.longitude) : '',
      });
    } else {
      reset({
        name: '',
        size: '',
        address: '',
        district: '',
        state: '',
        pincode: '',
        latitude: '',
        longitude: '',
      });
    }
  }, [farmToEdit, reset, isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = (data) => {
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-lg w-full bg-surface border border-line rounded-2xl shadow-modal p-6 sm:p-7 space-y-6 fade-in text-ink">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-brand-50 border border-brand-100 rounded-xl text-brand-800">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-ink">
                {farmToEdit ? t('modals.farm.titleEdit') : t('modals.farm.titleNew')}
              </h3>
              <p className="text-xs text-ink-muted">
                {t('modals.farm.subtitle')}
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
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
              {t('modals.farm.name')} *
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g. Sunrise Organic Farm Plot A"
              className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
            />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
              {t('modals.farm.size')}
            </label>
            <input
              type="number"
              step="0.01"
              {...register('size')}
              placeholder="5.25"
              className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
            />
            {errors.size && <p className="text-xs text-danger">{errors.size.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
              {t('profile.address')}
            </label>
            <input
              type="text"
              {...register('address')}
              placeholder="Gut No. 142, Post Dindori"
              className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                {t('modals.farm.district')}
              </label>
              <input
                type="text"
                {...register('district')}
                placeholder="Nashik"
                className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                {t('modals.farm.state')}
              </label>
              <input
                type="text"
                {...register('state')}
                placeholder="Maharashtra"
                className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                {t('modals.farm.pincode')}
              </label>
              <input
                type="text"
                maxLength={6}
                {...register('pincode')}
                placeholder="422202"
                className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
              />
              {errors.pincode && <p className="text-xs text-danger">{errors.pincode.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                Latitude (-90 to 90)
              </label>
              <input
                type="number"
                step="0.000001"
                {...register('latitude')}
                placeholder="20.2011"
                className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
              />
              {errors.latitude && <p className="text-xs text-danger">{errors.latitude.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink">
                Longitude (-180 to 180)
              </label>
              <input
                type="number"
                step="0.000001"
                {...register('longitude')}
                placeholder="73.8321"
                className="w-full px-3.5 py-2.5 bg-surface border border-line rounded-lg text-ink placeholder:text-ink-subtle focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
              />
              {errors.longitude && <p className="text-xs text-danger">{errors.longitude.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-surface hover:bg-surface-muted text-ink border border-line rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {farmToEdit ? t('common.save') : t('modals.farm.submit')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


