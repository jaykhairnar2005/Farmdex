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
      'relative inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
      active ? 'text-brand-800 bg-brand-50' : 'text-ink-muted hover:text-ink hover:bg-surface-muted',
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
    <header className="bg-surface/95 backdrop-blur-sm border-b border-line sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-brand-800 rounded-lg flex items-center justify-center ring-1 ring-brand-900/20">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-lg font-semibold text-ink tracking-tight">{t('nav.brand', 'FarmDex')}</span>
              <span className="text-[10px] text-brand-700 font-semibold bg-brand-50 px-1.5 py-0.5 rounded border border-brand-100">
                {t('nav.beta', 'BETA')}
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">{links}</nav>

          {/* Right cluster: Language Selector, Theme Toggle, Notifications, Profile / Auth */}
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />

            {isAuthenticated ? (
              <>
                <NotificationDropdown />

                {/* Profile menu */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen((o) => !o)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-surface-muted transition-colors cursor-pointer"
                    aria-label={t('nav.profileSettings', 'Profile & settings')}
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center text-xs font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden md:block text-left leading-tight">
                      <span className="block text-sm font-medium text-ink">{user?.name}</span>
                      <span className="block text-[10px] text-ink-subtle capitalize">{user?.role?.toLowerCase()}</span>
                    </span>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-surface border border-line rounded-xl shadow-popover overflow-hidden scale-in">
                      <div className="px-4 py-3 border-b border-line">
                        <p className="text-sm font-medium text-ink truncate">{user?.name}</p>
                        <p className="text-xs text-ink-subtle truncate">{user?.email}</p>
                      </div>
                      <div className="py-1.5">
                        <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink transition-colors">
                          <User className="w-4 h-4" /> {t('nav.profileSettings', 'Profile & settings')}
                        </Link>
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-danger-soft transition-colors cursor-pointer text-left"
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
                  className="px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
                >
                  {t('nav.signIn', 'Sign in')}
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center h-9 px-4 bg-brand-800 hover:bg-brand-900 text-white text-sm font-medium rounded-lg transition-colors shadow-card"
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

