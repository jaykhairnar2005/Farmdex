import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, Tractor, ShoppingBag, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { FormField, Input, InlineAlert, Button } from '../components/ui';
import AuthBrandPanel from '../components/AuthBrandPanel';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
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
  const { t } = useTranslation();
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
  } = useForm({ resolver: zodResolver(schema), defaultValues: { role: 'FARMER' } });

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
    <div className="min-h-screen bg-canvas flex">
      <AuthBrandPanel
        headline={t('auth.brandQuote')}
        points={[
          t('footer.directListings'),
          t('footer.transparentNegotiation'),
          t('footer.realTimeTracking'),
        ]}
      />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-lg space-y-6">
          <div className="lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-brand-800 rounded-lg flex items-center justify-center">
                <Sprout className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-ink">{t('nav.brand')}</span>
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-ink">{t('auth.signUpTitle')}</h1>
            <p className="mt-2 text-sm text-ink-muted">
              {t('auth.haveAccount')}{' '}
              <Link to="/login" className="text-brand-800 hover:text-brand-900 font-medium">{t('nav.signIn')}</Link>
            </p>
          </div>

          {serverError && (
            <InlineAlert type="error" message={serverError} onDismiss={() => setServerError('')} />
          )}

          {/* Role selector */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-ink">{t('auth.role')}</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'FARMER', label: t('auth.roleFarmer'), sub: t('home.roleFarmerTitle'), Icon: Tractor },
                { id: 'BUYER', label: t('auth.roleBuyer'), sub: t('home.roleBuyerTitle'), Icon: ShoppingBag },
              ].map((r) => {
                const active = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSelect(r.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-colors flex items-center gap-3 cursor-pointer ${
                      active ? 'border-brand-800 bg-brand-50 dark:bg-brand-950/40' : 'border-line bg-surface hover:border-line-strong'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      active ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200' : 'bg-surface-muted text-ink-subtle'
                    }`}>
                      <r.Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink">{r.label}</div>
                      <div className="text-xs text-ink-muted">{r.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('role')} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('auth.fullName')} htmlFor="name" required error={errors.name?.message}>
                <Input id="name" placeholder="Ramesh Kumar" invalid={!!errors.name} {...register('name')} />
              </FormField>
              <FormField label={t('auth.phone')} htmlFor="phone">
                <Input id="phone" placeholder="+91 9876543210" {...register('phone')} />
              </FormField>
            </div>

            <FormField label={t('auth.email')} htmlFor="email" required error={errors.email?.message}>
              <Input id="email" type="email" placeholder="you@example.com" invalid={!!errors.email} {...register('email')} />
            </FormField>

            <FormField label={t('auth.password')} htmlFor="password" required error={errors.password?.message} hint="Min 8 chars · upper, lower, number">
              <Input id="password" type="password" placeholder="••••••••" invalid={!!errors.password} {...register('password')} />
            </FormField>

            {selectedRole === 'FARMER' ? (
              <FormField label={t('profile.farmName')} htmlFor="farmName">
                <Input id="farmName" placeholder="Green Valley Farms" {...register('farmName')} />
              </FormField>
            ) : (
              <FormField label={t('profile.businessName')} htmlFor="businessName">
                <Input id="businessName" placeholder="Fresh Produce Wholesale Ltd." {...register('businessName')} />
              </FormField>
            )}

            <Button type="submit" className="w-full" size="lg" loading={submitting} icon={<UserPlus className="w-4 h-4" />}>
              {t('nav.getStarted')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
