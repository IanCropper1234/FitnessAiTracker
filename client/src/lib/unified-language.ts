/**
 * Unified Language Management System for TrainPro
 * Integrates react-i18next with custom LanguageProvider for consistent translation experience
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { translations } from "./translations";

// Supported languages
export type Language = "en" | "es" | "ja" | "zh-CN" | "de" | "zh-TW";

// Language metadata for UI display
export const languageMetadata: Record<Language, { 
  name: string; 
  nativeName: string; 
  flag: string;
  direction: 'ltr' | 'rtl';
}> = {
  en: { name: "English", nativeName: "English", flag: "🇺🇸", direction: 'ltr' },
  es: { name: "Spanish", nativeName: "Español", flag: "🇪🇸", direction: 'ltr' },
  ja: { name: "Japanese", nativeName: "日本語", flag: "🇯🇵", direction: 'ltr' },
  "zh-CN": { name: "Chinese (Simplified)", nativeName: "简体中文", flag: "🇨🇳", direction: 'ltr' },
  de: { name: "German", nativeName: "Deutsch", flag: "🇩🇪", direction: 'ltr' },
  "zh-TW": { name: "Chinese (Traditional)", nativeName: "繁體中文", flag: "🇹🇼", direction: 'ltr' }
};

// Browser language detection
export function detectBrowserLanguage(): Language {
  if (typeof window === "undefined") return "en";
  
  const browserLang = navigator.language.toLowerCase();
  
  // Direct matches
  if (browserLang === "zh-cn" || browserLang === "zh") return "zh-CN";
  if (browserLang === "zh-tw" || browserLang === "zh-hk") return "zh-TW";
  
  // Prefix matches
  if (browserLang.startsWith("es")) return "es";
  if (browserLang.startsWith("ja")) return "ja";
  if (browserLang.startsWith("de")) return "de";
  if (browserLang.startsWith("zh-cn")) return "zh-CN";
  if (browserLang.startsWith("zh-tw")) return "zh-TW";
  
  return "en"; // Default fallback
}

// Storage management
export function getStoredLanguage(): Language | null {
  if (typeof window === "undefined") return null;
  
  const stored = localStorage.getItem("trainpro-language") as Language;
  return stored && languageMetadata[stored] ? stored : null;
}

export function setStoredLanguage(lang: Language): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("trainpro-language", lang);
}

// Initialize unified i18n system
export async function initializeUnifiedI18n(): Promise<typeof i18n> {
  const storedLang = getStoredLanguage();
  const browserLang = detectBrowserLanguage();
  const initialLang = storedLang || browserLang;

  await i18n
    .use(initReactI18next)
    .init({
      resources: translations,
      lng: initialLang,
      fallbackLng: "en",
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      // Add namespace support for better organization
      defaultNS: "translation",
      debug: process.env.NODE_ENV === "development",
    });

  // Update document language
  if (typeof document !== "undefined") {
    document.documentElement.lang = initialLang;
  }

  return i18n;
}

// Language switching utility
export async function switchLanguage(lang: Language): Promise<void> {
  if (!languageMetadata[lang]) {
    console.warn(`Unsupported language: ${lang}`);
    return;
  }

  await i18n.changeLanguage(lang);
  setStoredLanguage(lang);
  
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
    document.documentElement.dir = languageMetadata[lang].direction;
  }
}

// Translation helpers
export function t(key: string, options?: any): string {
  return i18n.t(key, options) as string;
}

export function getCurrentLanguage(): Language {
  return (i18n.language as Language) || "en";
}

export function isLanguageSupported(lang: string): lang is Language {
  return lang in languageMetadata;
}

// React hook for unified language management
export function useUnifiedLanguage() {
  const currentLang = getCurrentLanguage();
  
  return {
    language: currentLang,
    languageData: languageMetadata[currentLang],
    supportedLanguages: Object.keys(languageMetadata) as Language[],
    switchLanguage,
    t,
    isRTL: languageMetadata[currentLang].direction === 'rtl'
  };
}