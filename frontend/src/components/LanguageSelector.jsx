import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { LANGUAGES, getLanguageConfig } from '../i18n/languages';
import { changeAppLanguage } from '../i18n';

export default function LanguageSelector({ variant = 'desktop' }) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = getLanguageConfig(i18n.language);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = async (code) => {
    await changeAppLanguage(code);
    setIsOpen(false);
  };

  // Mobile drawer inline variant
  if (variant === 'mobile') {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-charcoal-500 dark:text-charcoal-400">
          <Globe className="w-4 h-4 text-forest-600 dark:text-emerald-400" />
          <span>{t('common.language', 'Language')}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 p-1 mt-1 bg-sand-100/60 dark:bg-charcoal-800/80 rounded-xl border border-sand-200/80 dark:border-charcoal-700/80">
          {LANGUAGES.map((lang) => {
            const isActive = (i18n.language || 'en').startsWith(lang.code);
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-forest-600 text-white dark:bg-emerald-600 font-semibold shadow-xs'
                    : 'text-charcoal-700 dark:text-charcoal-200 hover:bg-white dark:hover:bg-charcoal-700'
                }`}
              >
                <div className="flex flex-col text-left leading-tight">
                  <span className="font-semibold">{lang.nativeName}</span>
                  <span className={`text-[10px] ${isActive ? 'text-forest-100 dark:text-emerald-100' : 'text-charcoal-400 dark:text-charcoal-400'}`}>
                    {lang.name}
                  </span>
                </div>
                {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop Navbar button + dropdown
  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        id="farmdex-language-selector-btn"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sand-300/80 dark:border-charcoal-700 bg-sand-50/80 dark:bg-charcoal-800/80 text-charcoal-700 dark:text-charcoal-200 hover:bg-sand-100 dark:hover:bg-charcoal-700/90 transition-all text-xs font-medium shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-forest-500/30 dark:focus:ring-emerald-400/30"
        title={t('common.selectLanguage', 'Select Language')}
      >
        <Globe className="w-4 h-4 text-forest-600 dark:text-emerald-400 shrink-0" />
        <span className="font-semibold tracking-tight">
          {currentLang.nativeName}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-charcoal-400 dark:text-charcoal-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={t('common.selectLanguage', 'Select Language')}
          className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-2xl bg-white dark:bg-charcoal-850 p-2 shadow-xl ring-1 ring-black/5 dark:ring-white/10 border border-sand-200 dark:border-charcoal-750 focus:outline-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-2 border-b border-sand-100 dark:border-charcoal-750 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-charcoal-700 dark:text-charcoal-200">
              <Globe className="w-3.5 h-3.5 text-forest-600 dark:text-emerald-400" />
              <span>{t('common.selectLanguage', 'Select Language')}</span>
            </div>
            <span className="text-[10px] text-charcoal-400 dark:text-charcoal-400 uppercase tracking-wider font-mono">
              10 Languages
            </span>
          </div>

          <div className="py-1 max-h-80 overflow-y-auto divide-y divide-transparent">
            {LANGUAGES.map((lang) => {
              const isActive = (i18n.language || 'en').startsWith(lang.code);
              return (
                <button
                  key={lang.code}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 my-0.5 rounded-xl text-left text-xs transition-colors ${
                    isActive
                      ? 'bg-forest-50 dark:bg-forest-950/40 text-forest-700 dark:text-emerald-400 font-semibold'
                      : 'text-charcoal-700 dark:text-charcoal-300 hover:bg-sand-100/80 dark:hover:bg-charcoal-750/90'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm leading-tight text-charcoal-900 dark:text-white">
                      {lang.nativeName}
                    </span>
                    <span className="text-[11px] text-charcoal-500 dark:text-charcoal-400">
                      {lang.name}
                    </span>
                  </div>
                  {isActive ? (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-forest-600 dark:bg-emerald-500 text-white text-xs">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="text-[10px] text-charcoal-400 dark:text-charcoal-400 font-mono">
                      {lang.code.toUpperCase()}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
