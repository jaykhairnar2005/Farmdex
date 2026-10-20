import { getLanguageConfig, DEFAULT_LANGUAGE } from '../i18n/languages';

/**
 * FarmDex Localized Formatting Utilities
 * Formats numbers, currencies (INR), and dates according to active language locale.
 */

export function getActiveLocale(lng) {
  const cfg = getLanguageConfig(lng || DEFAULT_LANGUAGE);
  return cfg.locale || 'en-IN';
}

/**
 * Format currency amount with INR (₹) symbol.
 * Example: 150000 -> ₹1,50,000 (Indian grouping)
 */
export function formatCurrency(amount, lng = 'en') {
  if (amount == null || isNaN(amount)) return '₹0';
  const num = Number(amount);
  const locale = getActiveLocale(lng);
  try {
    const formatted = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(num);
    return `₹${formatted}`;
  } catch {
    return `₹${num.toLocaleString('en-IN')}`;
  }
}

/**
 * Format standard number with locale grouping.
 */
export function formatNumber(num, lng = 'en', options = {}) {
  if (num == null || isNaN(num)) return '0';
  const val = Number(num);
  const locale = getActiveLocale(lng);
  try {
    return new Intl.NumberFormat(locale, options).format(val);
  } catch {
    return val.toLocaleString('en-IN');
  }
}

/**
 * Format date in locale style.
 */
export function formatDate(dateInput, lng = 'en', options = {}) {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  const locale = getActiveLocale(lng);
  const defaultOpts = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  };
  try {
    return new Intl.DateTimeFormat(locale, defaultOpts).format(date);
  } catch {
    return date.toLocaleDateString('en-IN', defaultOpts);
  }
}

/**
 * Format date with time.
 */
export function formatDateTime(dateInput, lng = 'en') {
  return formatDate(dateInput, lng, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Relative time formatter with localized strings.
 */
export function formatRelativeTime(dateInput, t) {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return t ? t('common.justNow', 'Just now') : 'Just now';
  if (diffMins < 60) return `${diffMins}${t ? t('common.minuteShort', 'm ago') : 'm ago'}`;
  if (diffHours < 24) return `${diffHours}${t ? t('common.hourShort', 'h ago') : 'h ago'}`;
  return `${diffDays}${t ? t('common.dayShort', 'd ago') : 'd ago'}`;
}
