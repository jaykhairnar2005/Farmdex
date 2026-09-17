import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, UserPlus, AlertCircle, CheckCircle2, Tractor, ShoppingBag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const registerFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((v) => /[a-z]/.test(v), 'Must contain a lowercase letter')
    .refine((v) => /[A-Z]/.test(v), 'Must contain an uppercase letter')
    .refine((v) => /\d/.test(v), 'Must contain a number'),
  phone: z.string().optional(),
  role: z.enum(['FARMER', 'BUYER']),
  farmName: z.string().optional(),
  businessName: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
});

export default function Register() {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState('FARMER');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      role: 'FARMER',
    },
  });

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setValue('role', role);
  };

  const onSubmit = async (data) => {
    setServerError('');
    setSubmitting(true);
    try {
      await registerAuth(data);
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 py-12">
      <div className="max-w-lg w-full space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Sprout className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Create your FarmDex Account</h2>
          <p className="text-sm text-slate-400">Directly connect farmers and buyers on a real-time trading platform</p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Select Account Role
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleRoleSelect('FARMER')}
              className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                selectedRole === 'FARMER'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Tractor className="w-6 h-6 flex-shrink-0" />
              <div>
                <div className="font-semibold text-sm text-slate-100 flex items-center gap-1">
                  Farmer {selectedRole === 'FARMER' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="text-xs text-slate-400">List produce &amp; crops</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('BUYER')}
              className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                selectedRole === 'BUYER'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <ShoppingBag className="w-6 h-6 flex-shrink-0" />
              <div>
                <div className="font-semibold text-sm text-slate-100 flex items-center gap-1">
                  Buyer {selectedRole === 'BUYER' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="text-xs text-slate-400">Purchase &amp; bid on produce</div>
              </div>
            </button>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('role')} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Full Name *
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="Ramesh Kumar"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all text-sm"
              />
              {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Phone Number
              </label>
              <input
                type="text"
                {...register('phone')}
                placeholder="+91 9876543210"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all text-sm font-mono"
              />
              {errors.phone && <p className="text-xs text-rose-400">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Email Address *
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="farmer@example.com"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all text-sm font-mono"
            />
            {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Password *
            </label>
            <input
              type="password"
              {...register('password')}
              placeholder="Min 8 chars (Uppercase, Lowercase, Number)"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all text-sm font-mono"
            />
            {errors.password && <p className="text-xs text-rose-400">{errors.password.message}</p>}
          </div>

          {/* Conditional Profile Fields */}
          {selectedRole === 'FARMER' ? (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Farm Name
              </label>
              <input
                type="text"
                {...register('farmName')}
                placeholder="Green Valley Farms"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all text-sm"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Business Name
              </label>
              <input
                type="text"
                {...register('businessName')}
                placeholder="Fresh Produce Wholesale Ltd."
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all text-sm"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Create Account
              </>
            )}
          </button>
        </form>

        {/* Switch to Login */}
        <div className="text-center pt-2 border-t border-slate-800 text-xs text-slate-400">
          Already have a FarmDex account?{' '}
          <Link to="/login" className="text-emerald-400 hover:underline font-semibold">
            Log in instead
          </Link>
        </div>
      </div>
    </div>
  );
}
