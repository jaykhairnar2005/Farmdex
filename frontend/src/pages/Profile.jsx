import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Shield, Save, Tractor, ShoppingBag, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  PageHeader, Card, FormField, Input, Select, Button, Badge,
  InlineAlert, PageSpinner,
} from '../components/ui';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { getMeProfileApi, updateFarmerProfileApi, updateBuyerProfileApi } from '../services/api';

const pincodeRule = z
  .string()
  .optional()
  .refine((v) => !v || /^\d{6}$/.test(v), { message: 'Pincode must be exactly 6 digits' });

const farmerSchema = z.object({
  farmName: z.string().max(100).optional(),
  farmSize: z.string().optional().transform((v) => (v ? parseFloat(v) : undefined)),
  address: z.string().max(255).optional(),
  district: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: pincodeRule,
  latitude: z.string().optional().transform((v) => (v ? parseFloat(v) : undefined)),
  longitude: z.string().optional().transform((v) => (v ? parseFloat(v) : undefined)),
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
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: '', text: '' });

  const isFarmer = user?.role === 'FARMER';
  const schema = isFarmer ? farmerSchema : buyerSchema;

  const {
    register, handleSubmit, reset, formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

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
        setAlert({ type: 'error', text: err.response?.data?.message || 'Failed to load profile' });
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [isFarmer, reset]);

  const onSubmit = async (formData) => {
    setAlert({ type: '', text: '' });
    setSubmitting(true);
    try {
      if (isFarmer) await updateFarmerProfileApi(formData);
      else await updateBuyerProfileApi(formData);
      setAlert({ type: 'success', text: t('profile.success') });
      await refreshUser();
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSubmitting(false);
    }
  };

  const farmerP = profileData?.farmerProfile;

  return (
    <AppLayout width="narrow">
      <div className="space-y-6 fade-in">
        <PageHeader
          icon={<User />}
          eyebrow={t('nav.profile')}
          title={t('profile.title')}
          subtitle={t('profile.subtitle')}
        />

        {/* Identity card */}
        <Card className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-semibold text-xl border border-brand-200">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-ink flex items-center gap-2">
                {user?.name}
                <Badge colour="brand">{user?.role === 'FARMER' ? t('auth.roleFarmer') : t('auth.roleBuyer')}</Badge>
              </h1>
              <p className="text-sm text-ink-muted mt-0.5">{user?.email}</p>
            </div>
          </div>

          {isFarmer && (
            <div className="flex items-center gap-2.5 bg-brand-50 border border-brand-100 px-3.5 py-2.5 rounded-lg text-xs">
              <Shield className="w-4 h-4 text-brand-800" />
              <div>
                <span className="text-ink-muted block text-[11px]">{t('admin.userTable.verification')}</span>
                <span className="font-semibold text-brand-800">{farmerP?.verificationStatus || 'VERIFIED'}</span>
              </div>
            </div>
          )}
        </Card>

        {alert.text && (
          <InlineAlert type={alert.type} message={alert.text} onDismiss={() => setAlert({ type: '', text: '' })} />
        )}

        {/* Edit form */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-line pb-4">
            <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-800 flex items-center justify-center">
              {isFarmer ? <Tractor className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">
                {isFarmer ? t('profile.farmerDetails') : t('profile.buyerDetails')}
              </h2>
              <p className="text-xs text-ink-muted">{t('profile.subtitle')}</p>
            </div>
          </div>

          {loading ? (
            <PageSpinner message={t('common.loading')} />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {isFarmer ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label={t('profile.farmName')} htmlFor="farmName">
                    <Input id="farmName" placeholder="Green Harvest Organics" {...register('farmName')} />
                  </FormField>
                  <FormField label={t('modals.farm.size')} htmlFor="farmSize" error={errors.farmSize?.message}>
                    <Input id="farmSize" type="number" step="0.01" placeholder="12.5" {...register('farmSize')} />
                  </FormField>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label={t('profile.businessName')} htmlFor="businessName">
                    <Input id="businessName" placeholder="Agri Produce Traders" {...register('businessName')} />
                  </FormField>
                  <FormField label={t('profile.businessType')} htmlFor="businessType">
                    <Select id="businessType" {...register('businessType')}>
                      <option value="RETAILER">Retailer</option>
                      <option value="WHOLESALER">Wholesaler</option>
                      <option value="RESTAURANT">Restaurant</option>
                      <option value="CONSUMER">Consumer</option>
                    </Select>
                  </FormField>
                </div>
              )}

              {/* Location */}
              <div className="space-y-4 pt-4 border-t border-line">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> {t('common.location')}
                </h3>

                <FormField label={t('profile.address')} htmlFor="address">
                  <Input id="address" placeholder="Village Road, Sector 4" {...register('address')} />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label={t('profile.district')} htmlFor="district">
                    <Input id="district" placeholder="Nashik" {...register('district')} />
                  </FormField>
                  <FormField label={t('profile.state')} htmlFor="state">
                    <Input id="state" placeholder="Maharashtra" {...register('state')} />
                  </FormField>
                  <FormField label={t('profile.pincode')} htmlFor="pincode" error={errors.pincode?.message} hint="6 digits">
                    <Input id="pincode" maxLength={6} placeholder="422001" {...register('pincode')} />
                  </FormField>
                </div>

                {isFarmer && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <FormField label="Latitude" htmlFor="latitude" error={errors.latitude?.message} hint="-90 to 90">
                      <Input id="latitude" type="number" step="0.000001" placeholder="19.9975" {...register('latitude')} />
                    </FormField>
                    <FormField label="Longitude" htmlFor="longitude" error={errors.longitude?.message} hint="-180 to 180">
                      <Input id="longitude" type="number" step="0.000001" placeholder="73.7898" {...register('longitude')} />
                    </FormField>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-line">
                <Button type="submit" loading={submitting} icon={<Save className="w-4 h-4" />}>
                  {t('profile.saveChanges')}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
