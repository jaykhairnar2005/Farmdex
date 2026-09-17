import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Tractor } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {farmToEdit ? 'Edit Farm Location' : 'Register New Farm'}
              </h3>
              <p className="text-xs text-slate-400">
                {farmToEdit ? 'Update details of your existing farm' : 'Add a new farm location to your profile'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Farm Name *
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g. Sunrise Organic Farm Plot A"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
            />
            {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Authoritative Farm Size (Acres/Hectares)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('size')}
              placeholder="5.25"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm font-mono"
            />
            {errors.size && <p className="text-xs text-rose-400">{errors.size.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Street Address / Gut Number
            </label>
            <input
              type="text"
              {...register('address')}
              placeholder="Gut No. 142, Post Dindori"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                District
              </label>
              <input
                type="text"
                {...register('district')}
                placeholder="Nashik"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                State
              </label>
              <input
                type="text"
                {...register('state')}
                placeholder="Maharashtra"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Pincode (6 Digits)
              </label>
              <input
                type="text"
                maxLength={6}
                {...register('pincode')}
                placeholder="422202"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm font-mono"
              />
              {errors.pincode && <p className="text-xs text-rose-400">{errors.pincode.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Latitude (-90 to 90)
              </label>
              <input
                type="number"
                step="0.000001"
                {...register('latitude')}
                placeholder="20.2011"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm font-mono"
              />
              {errors.latitude && <p className="text-xs text-rose-400">{errors.latitude.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Longitude (-180 to 180)
              </label>
              <input
                type="number"
                step="0.000001"
                {...register('longitude')}
                placeholder="73.8321"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm font-mono"
              />
              {errors.longitude && <p className="text-xs text-rose-400">{errors.longitude.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium shadow-md shadow-emerald-950/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {farmToEdit ? 'Update Farm' : 'Create Farm'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
