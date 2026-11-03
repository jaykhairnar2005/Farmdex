import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, CheckCircle2, Truck, Handshake, ShieldCheck } from 'lucide-react';

/**
 * FarmDex public marketplace footer — translated, single-band.
 */
export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-surface border-t border-line mt-20 relative overflow-hidden">
      {/* Decorative top accent line */}
      <div className="h-1 bg-gradient-to-r from-brand-800 via-lime-500 to-brand-600" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-line">
          {/* Brand & mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-700 to-brand-900 rounded-xl flex items-center justify-center shadow-sm">
                <Sprout className="w-5.5 h-5.5 text-lime-400" />
              </div>
              <span className="text-xl font-bold tracking-tight text-ink">
                Farm<span className="text-lime-600 dark:text-lime-400">Dex</span>
              </span>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed max-w-sm">
              {t('footer.description', 'A direct agricultural marketplace. Farmers list harvests, buyers negotiate fair prices, and every order is tracked from dispatch to delivery.')}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-50 dark:bg-lime-950/40 border border-lime-300/60 dark:border-lime-700/60 text-xs font-semibold text-lime-800 dark:text-lime-300">
              <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
              Live Mandi Settlement Network
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-4">
              {t('footer.platform', 'Platform')}
            </h4>
            <ul className="space-y-2.5 text-sm text-ink-muted">
              <li><Link to="/marketplace" className="hover:text-brand-800 dark:hover:text-lime-400 transition-colors font-medium">{t('footer.browseProduce', 'Browse produce')}</Link></li>
              <li><Link to="/register" className="hover:text-brand-800 dark:hover:text-lime-400 transition-colors font-medium">{t('footer.listHarvest', 'List your harvest')}</Link></li>
              <li><Link to="/offers" className="hover:text-brand-800 dark:hover:text-lime-400 transition-colors font-medium">{t('nav.offers', 'Trade Offers')}</Link></li>
              <li><Link to="/orders" className="hover:text-brand-800 dark:hover:text-lime-400 transition-colors font-medium">{t('nav.orders', 'Consignments')}</Link></li>
              <li><Link to="/login" className="hover:text-brand-800 dark:hover:text-lime-400 transition-colors font-medium">{t('footer.signIn', 'Sign in')}</Link></li>
            </ul>
          </div>

          {/* Sourcing & Trust */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-4">
              {t('footer.howItWorks', 'How it works')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-ink-muted">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-muted/50 border border-line">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-xs font-medium leading-snug">{t('footer.directListings', 'Direct farmer listings')}</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-muted/50 border border-line">
                <Handshake className="w-4 h-4 text-brand-700 dark:text-lime-400 mt-0.5 shrink-0" />
                <span className="text-xs font-medium leading-snug">{t('footer.transparentNegotiation', 'Transparent negotiation')}</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-muted/50 border border-line">
                <Truck className="w-4 h-4 text-brand-700 dark:text-lime-400 mt-0.5 shrink-0" />
                <span className="text-xs font-medium leading-snug">{t('footer.realTimeTracking', 'Real-time tracking')}</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-muted/50 border border-line">
                <ShieldCheck className="w-4 h-4 text-brand-700 dark:text-lime-400 mt-0.5 shrink-0" />
                <span className="text-xs font-medium leading-snug">{t('footer.verifiedSettlement', 'Verified settlement')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-subtle">
          <span>&copy; {new Date().getFullYear()} FarmDex Technologies Inc. {t('footer.allRightsReserved', 'All rights reserved.')}</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Verified Agri-Trade Platform
            </span>
            <span>·</span>
            <span>{t('footer.demoDisclaimer', 'Razorpay Test Escrow')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
