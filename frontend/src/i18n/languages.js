/**
 * FarmDex Indian Languages Configuration
 * 10 Official Regional Languages for Agricultural Trade
 */
export const LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    locale: 'en-IN',
    flag: '🇮🇳',
    dir: 'ltr',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    locale: 'hi-IN',
    script: 'Devanagari',
    dir: 'ltr',
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    locale: 'mr-IN',
    script: 'Devanagari',
    dir: 'ltr',
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    locale: 'bn-IN',
    script: 'Bengali',
    dir: 'ltr',
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    locale: 'te-IN',
    script: 'Telugu',
    dir: 'ltr',
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    locale: 'ta-IN',
    script: 'Tamil',
    dir: 'ltr',
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    locale: 'gu-IN',
    script: 'Gujarati',
    dir: 'ltr',
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    locale: 'kn-IN',
    script: 'Kannada',
    dir: 'ltr',
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    locale: 'ml-IN',
    script: 'Malayalam',
    dir: 'ltr',
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    locale: 'pa-IN',
    script: 'Gurmukhi',
    dir: 'ltr',
  },
];

export const DEFAULT_LANGUAGE = 'en';
export const STORAGE_LANG_KEY = 'farmdex-lang';
export const SUPPORTED_LANGUAGES = LANGUAGES;

export function getLanguageConfig(code) {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}
