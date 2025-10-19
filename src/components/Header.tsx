import { useTranslation, Trans } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const { t } = useTranslation();

  return (
    <>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <span>{t("header.title")}</span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <iframe
              src="https://ghbtns.com/github-btn.html?user=SimplePDF&repo=commonforms-web&type=star&count=true&size=large"
              width="150"
              height="30"
              title="GitHub"
              className="shrink-0"
            ></iframe>
          </div>
        </h1>
        <p className="text-gray-600 text-base md:text-lg">{t("header.subtitle")}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <a
            href="https://github.com/jbarrow/commonforms"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-sky-100 text-sky-800 rounded-full text-sm font-medium border border-sky-200 hover:bg-sky-200 transition-colors cursor-pointer"
          >
            CommonForms
          </a>
          <a
            href="https://onnxruntime.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium border border-emerald-200 hover:bg-emerald-200 transition-colors cursor-pointer"
          >
            ONNX Runtime Web
          </a>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium border border-indigo-200">
            {t("header.runsInBrowser")}
          </span>
          <a
            href="https://simplepdf.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded-full text-sm font-medium border hover:opacity-80 transition-opacity cursor-pointer"
            style={{
              backgroundColor: "#e6effe",
              color: "#2448a8",
              borderColor: "#b3ccfc",
            }}
          >
            SimplePDF
          </a>
          <span
            className="px-3 py-1 rounded-full text-sm font-medium border text-white"
            style={{
              backgroundColor: "oklch(81% 0.117 11.638)",
              borderColor: "oklch(70% 0.117 11.638)",
              textShadow: "0 1px 2px oklch(70% 0.117 11.638)",
            }}
          >
            {t("header.privacyFriendly")}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="p-3 bg-sky-50 rounded-lg border border-sky-200">
          <h3 className="text-lg font-semibold text-sky-900 mb-2">{t("header.aboutCommonForms")}</h3>
          <p className="text-sky-800 text-sm">
            <Trans
              i18nKey="header.aboutCommonFormsDescription"
              components={{
                0: (
                  <a
                    href="https://github.com/jbarrow/commonforms"
                    className="text-sky-900 hover:text-sky-700 underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
                1: (
                  <a
                    href="https://x.com/barrowjoseph"
                    className="text-sky-900 hover:text-sky-700 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
              }}
            />
          </p>
          <a
            href="https://arxiv.org/abs/2509.16506"
            className="inline-block mt-3 text-sky-900 hover:text-sky-700 underline font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("header.arxivPaper")}
          </a>
        </div>

        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <h3 className="text-lg font-semibold text-emerald-900 mb-2">{t("header.howItWorks")}</h3>
          <ul className="text-emerald-800 text-sm space-y-1">
            <li>
              •{" "}
              <Trans
                i18nKey="header.howItWorksBullet1"
                components={{
                  0: (
                    <a
                      href="https://onnxruntime.ai/"
                      className="text-emerald-900 hover:text-emerald-700 underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  ),
                }}
              />
            </li>
            <li>• {t("header.howItWorksBullet2")}</li>
            <li>• {t("header.howItWorksBullet3")}</li>
            <li>• {t("header.howItWorksBullet4")}</li>
          </ul>
        </div>
      </div>
    </>
  );
}
