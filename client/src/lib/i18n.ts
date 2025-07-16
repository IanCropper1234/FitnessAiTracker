import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { translations } from "./translations";

export async function initializeI18n() {
  await i18n
    .use(initReactI18next)
    .init({
      resources: translations,
      lng: "en",
      fallbackLng: "en",
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

  return i18n;
}
