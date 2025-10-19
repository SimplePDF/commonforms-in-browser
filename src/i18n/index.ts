import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslations from "./locales/en.json";
import frTranslations from "./locales/fr.json";
import deTranslations from "./locales/de.json";
import ptTranslations from "./locales/pt.json";
import itTranslations from "./locales/it.json";

export const SUPPORTED_LANGUAGES = {
  en: "English",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  it: "Italiano",
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

const STORAGE_KEY = "commonforms-language";

const getBrowserLanguage = (): SupportedLanguage => {
  const browserLang = navigator.language.split("-")[0];
  return Object.keys(SUPPORTED_LANGUAGES).includes(browserLang) ? (browserLang as SupportedLanguage) : "en";
};

const getStoredLanguage = (): SupportedLanguage | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && Object.keys(SUPPORTED_LANGUAGES).includes(stored)) {
    return stored as SupportedLanguage;
  }
  return null;
};

const defaultLanguage = getStoredLanguage() ?? getBrowserLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    fr: { translation: frTranslations },
    de: { translation: deTranslations },
    pt: { translation: ptTranslations },
    it: { translation: itTranslations },
  },
  lng: defaultLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (lng: string) => {
  localStorage.setItem(STORAGE_KEY, lng);
});

export default i18n;
