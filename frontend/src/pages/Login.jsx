import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sprout, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { FormField, Input, InlineAlert, Button } from '../components/ui';
import AuthBrandPanel from '../components/AuthBrandPanel';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setServerError('');
    setSubmitting(true);
    try {
      const res = await login(data.email, data.password);
      const u = res?.user;
      if (location.state?.from?.pathname) {
        navigate(location.state.from.pathname, { replace: true });
      } else if (u?.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (u?.role === 'FARMER') {
        navigate('/my-listings', { replace: true });
      } else {
        navigate('/marketplace', { replace: true });
      }
    } catch (err) {
      setServerError(err.response?.data?.message || err.message || 'Login failed. Please try again.');
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
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-brand-800 rounded-lg flex items-center justify-center">
                <Sprout className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-ink">{t('nav.brand')}</span>
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-ink">{t('auth.signInTitle')}</h1>
            <p className="mt-2 text-sm text-ink-muted">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-brand-800 hover:text-brand-900 font-medium">
                {t('nav.getStarted')}
              </Link>
            </p>
          </div>

          {serverError && (
            <InlineAlert type="error" message={serverError} onDismiss={() => setServerError('')} />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField label={t('auth.email')} htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" placeholder="you@example.com" invalid={!!errors.email} {...register('email')} />
            </FormField>

            <FormField label={t('auth.password')} htmlFor="password" error={errors.password?.message}>
              <Input id="password" type="password" placeholder="••••••••" invalid={!!errors.password} {...register('password')} />
            </FormField>

            <Button type="submit" className="w-full" size="lg" loading={submitting} iconEnd={<ArrowRight className="w-4 h-4" />}>
              {t('nav.signIn')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
