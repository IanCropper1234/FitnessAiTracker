/**
 * Translation Audit Utility
 * Analyzes actual translation completeness across all languages
 */

import { translations } from "@/lib/translations";

export type Language = "en" | "es" | "ja" | "zh-CN" | "de" | "zh-TW";

interface TranslationNode {
  [key: string]: string | TranslationNode;
}

interface CompletionReport {
  language: Language;
  totalKeys: number;
  translatedKeys: number;
  completionPercentage: number;
  missingKeys: string[];
  hasContent: boolean;
}

// Recursively extract all keys from nested translation object
function extractKeys(obj: TranslationNode, prefix = ""): string[] {
  const keys: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === "string") {
      keys.push(fullKey);
    } else if (typeof value === "object" && value !== null) {
      keys.push(...extractKeys(value, fullKey));
    }
  }
  
  return keys;
}

// Get all keys from English (reference language)
function getReferenceKeys(): string[] {
  const englishTranslations = translations.en?.translation;
  if (!englishTranslations) return [];
  
  return extractKeys(englishTranslations);
}

// Check if a key exists in a specific language
function hasTranslation(lang: Language, key: string): boolean {
  const langTranslations = translations[lang]?.translation;
  if (!langTranslations) return false;
  
  const keyParts = key.split('.');
  let current: any = langTranslations;
  
  for (const part of keyParts) {
    if (typeof current !== 'object' || current === null || !(part in current)) {
      return false;
    }
    current = current[part];
  }
  
  return typeof current === 'string' && current.trim().length > 0;
}

// Audit a specific language
export function auditLanguage(lang: Language): CompletionReport {
  const referenceKeys = getReferenceKeys();
  const translatedKeys: string[] = [];
  const missingKeys: string[] = [];
  
  for (const key of referenceKeys) {
    if (hasTranslation(lang, key)) {
      translatedKeys.push(key);
    } else {
      missingKeys.push(key);
    }
  }
  
  const completionPercentage = referenceKeys.length > 0 
    ? Math.round((translatedKeys.length / referenceKeys.length) * 100)
    : 0;
  
  return {
    language: lang,
    totalKeys: referenceKeys.length,
    translatedKeys: translatedKeys.length,
    completionPercentage,
    missingKeys,
    hasContent: translatedKeys.length > 0
  };
}

// Audit all languages
export function auditAllLanguages(): CompletionReport[] {
  const languages: Language[] = ["en", "es", "ja", "zh-CN", "de", "zh-TW"];
  return languages.map(lang => auditLanguage(lang));
}

// Get summary statistics
export function getTranslationSummary() {
  const reports = auditAllLanguages();
  const englishReport = reports.find(r => r.language === "en");
  const otherLanguages = reports.filter(r => r.language !== "en");
  
  const fullyCompleted = otherLanguages.filter(r => r.completionPercentage === 100).length;
  const partiallyCompleted = otherLanguages.filter(r => r.completionPercentage > 0 && r.completionPercentage < 100).length;
  const notStarted = otherLanguages.filter(r => r.completionPercentage === 0).length;
  
  return {
    totalLanguages: languages.length,
    englishKeys: englishReport?.totalKeys || 0,
    fullyCompleted,
    partiallyCompleted,
    notStarted,
    reports
  };
}

// Get missing keys for a language with examples
export function getMissingKeysWithContext(lang: Language): { key: string; englishValue: string }[] {
  const report = auditLanguage(lang);
  const result: { key: string; englishValue: string }[] = [];
  
  for (const missingKey of report.missingKeys.slice(0, 10)) { // Limit to first 10
    const englishValue = getEnglishValue(missingKey);
    if (englishValue) {
      result.push({ key: missingKey, englishValue });
    }
  }
  
  return result;
}

function getEnglishValue(key: string): string | null {
  const englishTranslations = translations.en?.translation;
  if (!englishTranslations) return null;
  
  const keyParts = key.split('.');
  let current: any = englishTranslations;
  
  for (const part of keyParts) {
    if (typeof current !== 'object' || current === null || !(part in current)) {
      return null;
    }
    current = current[part];
  }
  
  return typeof current === 'string' ? current : null;
}

const languages: Language[] = ["en", "es", "ja", "zh-CN", "de", "zh-TW"];