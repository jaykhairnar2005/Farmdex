import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sprout, User, Tractor, LogOut, Handshake, ShieldCheck, MessageSquare,
  Package, Menu, X, Store,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../context/SocketContext';
import NotificationDropdown from './NotificationDropdown';
import ThemeToggle, { MobileThemeToggle } from './ThemeToggle';
import LanguageSelector from './LanguageSelector';

/**
 * FarmDex primary navigation — refined top-nav shell with i18n & theme.
 */
export default function Navbar() {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadMessagesCount } = useSocket();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Close profile popover on outside click
  useEffect(() => {
    function onClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const navLinkClass = (path, extraPaths = []) => {
    const active = isActive(path) || extraPaths.some((p) => location.pathname.startsWith(p));
    return [
      'relative inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200',
      active
        ? 'text-brand-900 dark:text-lime-400 bg-brand-100/70 dark:bg-brand-950/80 font-semibold shadow-xs'
        : 'text-ink-muted hover:text-ink hover:bg-surface-muted/80',
    ].join(' ');
  };

  const links = (
    <>
      <Link to="/marketplace" className={navLinkClass('/marketplace', ['/crops'])}>
        <Store className="w-4 h-4" />
        {t('nav.marketplace', 'Marketplace')}
      </Link>

      {isAuthenticated && (
        <>
          {user?.role === 'FARMER' && (
            <>
              <Link to="/my-listings" className={navLinkClass('/my-listings')}>
                <Sprout className="w-4 h-4" />
                {t('nav.myProduce', 'My Produce')}
              </Link>
              <Link to="/farms" className={navLinkClass('/farms')}>
                <Tractor className="w-4 h-4" />
                {t('nav.myFarms', 'My Farms')}
              </Link>
            </>
          )}

          <Link to="/offers" className={navLinkClass('/offers')}>
            <Handshake className="w-4 h-4" />
            {user?.role === 'FARMER' ? t('nav.offers', 'Offers') : t('nav.myOffers', 'My Offers')}
          </Link>

          <Link to="/orders" className={navLinkClass('/orders')}>
            <Package className="w-4 h-4" />
            {t('nav.orders', 'Orders')}
          </Link>

          <Link to="/messages" className={navLinkClass('/messages')}>
            <MessageSquare className="w-4 h-4" />
            {t('nav.messages', 'Messages')}
            {unreadMessagesCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 bg-brand-800 text-white font-semibold rounded-full text-[10px] flex items-center justify-center">
                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
              </span>
            )}
          </Link>

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className={[
                'relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive('/admin')
                  ? 'text-warning bg-warning-soft'
                  : 'text-warning hover:bg-warning-soft',
              ].join(' ')}
            >
              <ShieldCheck className="w-4 h-4" />
              {t('nav.admin', 'Admin')}
            </Link>
          )}
        </>
      )}
    </>
  );

  return (
    <header className="glass-panel border-b border-line/80 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative w-10 h-10 bg-gradient-to-br from-brand-700 to-brand-900 rounded-xl flex items-center justify-center shadow-md shadow-brand-900/15 group-hover:scale-105 transition-transform duration-200">
              <Sprout className="w-5.5 h-5.5 text-lime-400 group-hover:rotate-12 transition-transform duration-300" />
              <span className="w-2 h-2 rounded-full bg-lime-400 absolute -top-0.5 -right-0.5 ring-2 ring-surface animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-ink group-hover:text-brand-800 transition-colors">
                  Farm<span className="text-lime-600 dark:text-lime-400">Dex</span>
                </span>
                <span className="text-[10px] tracking-wider uppercase font-bold text-brand-800 dark:text-brand-300 bg-brand-100/80 dark:bg-brand-950 px-1.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800/80">
                  {t('nav.beta', 'PRO')}
                </span>
              </div>
              <span className="hidden sm:block text-[10px] text-ink-subtle font-medium -mt-0.5">Agri Commodity Exchange</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1.5">{links}</nav>

          {/* Right cluster: Language Selector, Theme Toggle, Notifications, Profile / Auth */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <LanguageSelector />
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <NotificationDropdown />

                {/* Profile menu */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen((o) => !o)}
                    className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-xl border border-transparent hover:border-line hover:bg-surface-muted/80 transition-all cursor-pointer"
                    aria-label={t('nav.profileSettings', 'Profile & settings')}
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden md:block text-left leading-tight">
                      <span className="block text-sm font-semibold text-ink truncate max-w-[120px]">{user?.name}</span>
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-surface-muted text-brand-800 dark:text-brand-300 border border-line">
                        {user?.role}
                      </span>
                    </span>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-surface border border-line rounded-2xl shadow-popover overflow-hidden scale-in z-50">
                      <div className="px-4 py-3.5 border-b border-line bg-surface-muted/30">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-ink truncate">{user?.name}</p>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-800 border border-brand-200">
                            {user?.role}
                          </span>
                        </div>
                        <p className="text-xs text-ink-subtle truncate">{user?.email}</p>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <Link to="/profile" className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink rounded-lg transition-colors">
                          <User className="w-4 h-4 text-brand-700" /> {t('nav.profileSettings', 'Profile & settings')}
                        </Link>
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-danger hover:bg-danger-soft rounded-lg transition-colors cursor-pointer text-left"
                        >
                          <LogOut className="w-4 h-4" /> {t('nav.signOut', 'Sign out')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile menu toggle */}
                <button
                  onClick={() => setMobileMenuOpen((o) => !o)}
                  className="lg:hidden p-2 text-ink-muted hover:bg-surface-muted rounded-lg cursor-pointer"
                  aria-label="Toggle menu"
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-semibold text-ink-muted hover:text-ink hover:bg-surface-muted/80 rounded-xl transition-all"
                >
                  {t('nav.signIn', 'Sign in')}
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center h-10 px-4.5 bg-brand-800 hover:bg-brand-900 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-card-hover active:scale-[0.98]"
                >
                  {t('nav.getStarted', 'Get started')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-line bg-surface fade-in">
          <div className="px-4 pt-3 pb-3 border-b border-line space-y-3">
            <MobileThemeToggle />
            <LanguageSelector variant="mobile" />
          </div>
          <nav className="px-4 py-3 flex flex-col gap-1">
            <Link to="/marketplace" className={navLinkClass('/marketplace', ['/crops'])}>
              <Store className="w-4 h-4" /> {t('nav.marketplace', 'Marketplace')}
            </Link>
            {isAuthenticated && (
              <>
                {user?.role === 'FARMER' && (
                  <>
                    <Link to="/my-listings" className={navLinkClass('/my-listings')}>
                      <Sprout className="w-4 h-4" /> {t('nav.myProduce', 'My Produce')}
                    </Link>
                    <Link to="/farms" className={navLinkClass('/farms')}>
                      <Tractor className="w-4 h-4" /> {t('nav.myFarms', 'My Farms')}
                    </Link>
                  </>
                )}
                <Link to="/offers" className={navLinkClass('/offers')}>
                  <Handshake className="w-4 h-4" /> {user?.role === 'FARMER' ? t('nav.offers', 'Offers') : t('nav.myOffers', 'My Offers')}
                </Link>
                <Link to="/orders" className={navLinkClass('/orders')}>
                  <Package className="w-4 h-4" /> {t('nav.orders', 'Orders')}
                </Link>
                <Link to="/messages" className={navLinkClass('/messages')}>
                  <MessageSquare className="w-4 h-4" /> {t('nav.messages', 'Messages')}
                  {unreadMessagesCount > 0 && (
                    <span className="ml-1 min-w-[18px] h-[18px] px-1 bg-brand-800 text-white font-semibold rounded-full text-[10px] flex items-center justify-center">
                      {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                    </span>
                  )}
                </Link>
                <Link to="/profile" className={navLinkClass('/profile')}>
                  <User className="w-4 h-4" /> {t('nav.profile', 'Profile')}
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link to="/admin" className={navLinkClass('/admin')}>
                    <ShieldCheck className="w-4 h-4" /> {t('nav.adminPanel', 'Admin Panel')}
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-danger hover:bg-danger-soft transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> {t('nav.signOut', 'Sign out')}
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

