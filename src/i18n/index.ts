import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import deTranslations from "./locales/de.json";
import enTranslations from "./locales/en.json";
import esTranslations from "./locales/es.json";
import etTranslations from "./locales/et.json";
import frTranslations from "./locales/fr.json";
import itTranslations from "./locales/it.json";
import nlTranslations from "./locales/nl.json";
import plTranslations from "./locales/pl.json";
import ptTranslations from "./locales/pt.json";

export const SUPPORTED_LANGUAGES = {
  de: "Deutsch",
  en: "English",
  es: "Español",
  et: "Eesti",
  fr: "Français",
  it: "Italiano",
  nl: "Nederlands",
  pl: "Polski",
  pt: "Português",
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
    de: { translation: deTranslations },
    en: { translation: enTranslations },
    es: { translation: esTranslations },
    et: { translation: etTranslations },
    fr: { translation: frTranslations },
    it: { translation: itTranslations },
    nl: { translation: nlTranslations },
    pl: { translation: plTranslations },
    pt: { translation: ptTranslations },
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
