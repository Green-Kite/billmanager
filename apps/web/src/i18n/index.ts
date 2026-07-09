import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import de from './locales/de.json';

export const SUPPORTED_LANGUAGES = ['en', 'de'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = 'billmanager:language';

function getStoredLanguage(): SupportedLanguage | null {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(stored ?? '')
    ? (stored as SupportedLanguage)
    : null;
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  lng: getStoredLanguage() ?? 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes output
  },
});

export function setLanguage(lang: SupportedLanguage): void {
  window.localStorage.setItem(STORAGE_KEY, lang);
  i18n.changeLanguage(lang);
}

/**
 * Applies the server-configured DEFAULT_LOCALE (e.g. "de-DE") as the UI
 * language, but only if the user hasn't explicitly picked one via the
 * language switcher. Called once by ConfigContext after config load, so
 * the app doesn't need a second, independent language-default mechanism.
 */
export function applyLocaleDefault(locale: string): void {
  if (getStoredLanguage()) return;
  const lang = locale.split(/[-_]/)[0].toLowerCase();
  if ((SUPPORTED_LANGUAGES as readonly string[]).includes(lang)) {
    i18n.changeLanguage(lang as SupportedLanguage);
  }
}

export default i18n;
