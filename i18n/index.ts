import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from './locales';
import type { LanguageCode } from '@/store/userStore';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });
}

export function setAppLanguage(lng: LanguageCode) {
  if (i18n.language !== lng) {
    i18n.changeLanguage(lng);
  }
}

export default i18n;
