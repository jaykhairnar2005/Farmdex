import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';
import bn from './locales/bn.json';
import te from './locales/te.json';
import ta from './locales/ta.json';
import gu from './locales/gu.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';
import pa from './locales/pa.json';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './languages';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
  bn: { translation: bn },
  te: { translation: te },
  ta: { translation: ta },
  gu: { translation: gu },
  kn: { translation: kn },
  ml: { translation: ml },
  pa: { translation: pa },
};

const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('farmdex-lang') : null;
const initialLanguage = (savedLanguage && SUPPORTED_LANGUAGES.some(l => l.code === savedLanguage))
  ? savedLanguage
  : DEFAULT_LANGUAGE;

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage;
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    // Development-time missing key check
    saveMissing: import.meta.env?.DEV || false,
    missingKeyHandler: (lngs, ns, key) => {
      if (import.meta.env?.DEV) {
        console.warn(`⚠️ [i18n] Missing translation key: "${key}" for language(s): ${lngs.join(', ')} in namespace: "${ns}"`);
      }
    },
    react: {
      useSuspense: false,
    },
  });

export const changeAppLanguage = async (code) => {
  if (!SUPPORTED_LANGUAGES.some(l => l.code === code)) {
    console.warn(`[i18n] Unsupported language code: ${code}`);
    return;
  }
  try {
    await i18n.changeLanguage(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem('farmdex-lang', code);
      document.documentElement.lang = code;
    }
  } catch (error) {
    console.error(`[i18n] Error changing language to ${code}:`, error);
  }
};

export default i18n;
