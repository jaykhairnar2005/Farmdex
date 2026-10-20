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
    <footer className="bg-surface border-t border-line mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-line">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-brand-800 rounded-lg flex items-center justify-center">
                <Sprout className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-base font-semibold text-ink tracking-tight">{t('nav.brand', 'FarmDex')}</span>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed max-w-md">
              {t('footer.description', 'A direct agricultural marketplace. Farmers list harvests, buyers negotiate fair prices, and every order is tracked from dispatch to delivery.')}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">
              {t('footer.platform', 'Platform')}
            </h4>
            <ul className="space-y-2 text-sm text-ink-muted">
              <li><Link to="/marketplace" className="hover:text-ink transition-colors">{t('footer.browseProduce', 'Browse produce')}</Link></li>
              <li><Link to="/register" className="hover:text-ink transition-colors">{t('footer.listHarvest', 'List your harvest')}</Link></li>
              <li><Link to="/login" className="hover:text-ink transition-colors">{t('footer.signIn', 'Sign in')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">
              {t('footer.howItWorks', 'How it works')}
            </h4>
            <ul className="space-y-2 text-sm text-ink-muted">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> {t('footer.directListings', 'Direct farmer listings')}</li>
              <li className="flex items-center gap-2"><Handshake className="w-4 h-4 text-brand-700" /> {t('footer.transparentNegotiation', 'Transparent negotiation')}</li>
              <li className="flex items-center gap-2"><Truck className="w-4 h-4 text-brand-700" /> {t('footer.realTimeTracking', 'Real-time tracking')}</li>
              <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand-700" /> {t('footer.verifiedSettlement', 'Verified settlement')}</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-subtle">
          <span>&copy; {new Date().getFullYear()} FarmDex. {t('footer.allRightsReserved', 'All rights reserved.')}</span>
          <span>{t('footer.demoDisclaimer', 'Built for demonstration · Razorpay test-mode payments')}</span>
        </div>
      </div>
    </footer>
  );
}
