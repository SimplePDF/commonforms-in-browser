import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "../i18n";

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleChangeLanguage = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newLanguage = event.target.value as SupportedLanguage;
      i18n.changeLanguage(newLanguage);
    },
    [i18n]
  );

  return (
    <select
      value={i18n.language}
      onChange={handleChangeLanguage}
      className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      aria-label="Select language"
    >
      {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
        <option key={code} value={code}>
          {name}
        </option>
      ))}
    </select>
  );
};
