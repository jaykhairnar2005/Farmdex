import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Shield, CheckCircle2, AlertCircle, Save, Tractor, ShoppingBag, MapPin } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { getMeProfileApi, updateFarmerProfileApi, updateBuyerProfileApi } from '../services/api';

const pincodeRule = z
  .string()
  .optional()
  .refine((val) => !val || /^\d{6}$/.test(val), { message: 'Pincode must be exactly 6 numeric digits' });

const farmerSchema = z.object({
  farmName: z.string().max(100).optional(),
  farmSize: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  address: z.string().max(255).optional(),
  district: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: pincodeRule,
  latitude: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  longitude: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
});

const buyerSchema = z.object({
  businessName: z.string().max(100).optional(),
  businessType: z.enum(['RETAILER', 'WHOLESALER', 'RESTAURANT', 'CONSUMER']).optional(),
  address: z.string().max(255).optional(),
  district: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: pincodeRule,
});

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const isFarmer = user?.role === 'FARMER';
  const schema = isFarmer ? farmerSchema : buyerSchema;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await getMeProfileApi();
        if (res.success && res.data) {
          setProfileData(res.data);
          const p = isFarmer ? res.data.farmerProfile : res.data.buyerProfile;
          if (p) {
            reset({
              farmName: p.farmName || '',
              farmSize: p.farmSize ? String(p.farmSize) : '',
              businessName: p.businessName || '',
              businessType: p.businessType || 'RETAILER',
              address: p.address || '',
              district: p.district || '',
              state: p.state || '',
              pincode: p.pincode || '',
              latitude: p.latitude ? String(p.latitude) : '',
              longitude: p.longitude ? String(p.longitude) : '',
            });
          }
        }
      } catch (err) {
        setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load profile' });
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [isFarmer, reset]);

  const onSubmit = async (formData) => {
    setMessage({ type: '', text: '' });
    setSubmitting(true);
    try {
      if (isFarmer) {
        await updateFarmerProfileApi(formData);
      } else {
        await updateBuyerProfileApi(formData);
      }
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      await refreshUser();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSubmitting(false);
    }
  };

  const farmerP = profileData?.farmerProfile;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto w-full p-4 sm:p-8 space-y-8 flex-1">
        {/* User Overview Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                {user?.name}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  {user?.role}
                </span>
              </h1>
              <p className="text-sm text-slate-400 font-mono">{user?.email}</p>
            </div>
          </div>

          {/* Read-Only Verification Status */}
          {isFarmer && (
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl text-xs">
              <Shield className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-slate-500 block">Verification Status</span>
                <span className="font-semibold text-emerald-400 font-mono">
                  {farmerP?.verificationStatus || 'PENDING'} (Read-Only)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
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

        {/* Profile Edit Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            {isFarmer ? <Tractor className="w-6 h-6 text-emerald-400" /> : <ShoppingBag className="w-6 h-6 text-emerald-400" />}
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {isFarmer ? 'Farmer Profile & Location Settings' : 'Buyer Business & Location Settings'}
              </h2>
              <p className="text-xs text-slate-400">Update your profile details. All fields support partial updates.</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 font-mono text-sm animate-pulse">
              Loading profile data...
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {isFarmer ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Primary Farm Name
                    </label>
                    <input
                      type="text"
                      {...register('farmName')}
                      placeholder="Green Harvest Organics"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Total Farm Size (Summary Acreage)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('farmSize')}
                      placeholder="12.5"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm font-mono"
                    />
                    {errors.farmSize && <p className="text-xs text-rose-400">{errors.farmSize.message}</p>}
                    <p className="text-[10px] text-slate-500">Summary size. Individual farm sizes are managed under My Farms.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Business Name
                    </label>
                    <input
                      type="text"
                      {...register('businessName')}
                      placeholder="Agri Produce Traders"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Business Type
                    </label>
                    <select
                      {...register('businessType')}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm"
                    >
                      <option value="RETAILER">Retailer</option>
                      <option value="WHOLESALER">Wholesaler</option>
                      <option value="RESTAURANT">Restaurant</option>
                      <option value="CONSUMER">Consumer</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Address Details */}
              <div className="space-y-4 pt-2 border-t border-slate-800/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> Location Details
                </h3>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Street Address
                  </label>
                  <input
                    type="text"
                    {...register('address')}
                    placeholder="Village Road, Sector 4"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      placeholder="422001"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm font-mono"
                    />
                    {errors.pincode && <p className="text-xs text-rose-400">{errors.pincode.message}</p>}
                  </div>
                </div>

                {isFarmer && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Latitude (-90 to 90)
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        {...register('latitude')}
                        placeholder="19.9975"
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
                        placeholder="73.7898"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-sm font-mono"
                      />
                      {errors.longitude && <p className="text-xs text-rose-400">{errors.longitude.message}</p>}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Profile Updates
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
