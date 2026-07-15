import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import Storage from 'expo-sqlite/kv-store';

import en from './locales/en.json';
import de from './locales/de.json';
import {
  normalizeLanguage,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from './language';
import { mobileSettingsResources } from '../features/settings/mobileResources';
import { mobileCoreResources } from '../features/mobileCoreResources';
import { authSecurityResources } from '../features/authSecurityResources';
import { mobileParityResources } from '../features/mobileParityResources';

export { normalizeLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from './language';

const LANGUAGE_STORAGE_KEY = 'billmanager:language';

const deviceLanguage = normalizeLanguage(getLocales()[0]?.languageTag);

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        ...en,
        mobileCore: mobileCoreResources.en,
        mobileSettings: mobileSettingsResources.en,
        mobileAuth: authSecurityResources.en.auth,
        mobileSecurity: authSecurityResources.en.security,
        mobileParity: mobileParityResources.en,
      },
    },
    de: {
      translation: {
        ...de,
        mobileCore: mobileCoreResources.de,
        mobileSettings: mobileSettingsResources.de,
        mobileAuth: authSecurityResources.de.auth,
        mobileSecurity: authSecurityResources.de.security,
        mobileParity: mobileParityResources.de,
      },
    },
  },
  lng: deviceLanguage,
  fallbackLng: 'en',
  supportedLngs: [...SUPPORTED_LANGUAGES],
  load: 'languageOnly',
  returnNull: false,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export async function hydrateLanguage(defaultLocale?: string): Promise<SupportedLanguage> {
  const stored = await Storage.getItem(LANGUAGE_STORAGE_KEY);
  const language = normalizeLanguage(stored ?? defaultLocale ?? deviceLanguage);
  await i18n.changeLanguage(language);
  return language;
}

export async function setLanguage(language: SupportedLanguage): Promise<void> {
  await Storage.setItem(LANGUAGE_STORAGE_KEY, language);
  await i18n.changeLanguage(language);
}

export default i18n;
