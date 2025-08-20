/**
 * Language Selector with ZH-TW Focus
 * Only EN-US and ZH-TW are available, others marked as "Coming Soon"
 */

import { useState } from "react";
import { Globe, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

export type AvailableLanguage = "en" | "zh-TW";
export type ComingSoonLanguage = "es" | "ja" | "zh-CN" | "de";

interface LanguageOption {
  code: AvailableLanguage | ComingSoonLanguage;
  name: string;
  nativeName: string;
  flag: string;
  available: boolean;
}

const languageOptions: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", available: true },
  { code: "zh-TW", name: "Traditional Chinese", nativeName: "繁體中文", flag: "🇹🇼", available: true },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", available: false },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", available: false },
  { code: "zh-CN", name: "Simplified Chinese", nativeName: "简体中文", flag: "🇨🇳", available: false },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", available: false },
];

interface LanguageSelectorZhTwProps {
  variant?: "default" | "compact" | "icon-only";
  showFlags?: boolean;
  className?: string;
}

export function LanguageSelectorZhTw({ 
  variant = "default", 
  showFlags = true,
  className = ""
}: LanguageSelectorZhTwProps) {
  const { i18n } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const currentLang = i18n.language as AvailableLanguage;
  const currentOption = languageOptions.find(option => option.code === currentLang) || languageOptions[0];

  const handleLanguageChange = async (newLang: AvailableLanguage) => {
    if (newLang === currentLang) return;
    
    setIsChanging(true);
    try {
      await i18n.changeLanguage(newLang);
      // Update localStorage for persistence
      localStorage.setItem("trainpro-language", newLang);
      // Update document language
      document.documentElement.lang = newLang;
    } catch (error) {
      console.error("Failed to switch language:", error);
    } finally {
      setIsChanging(false);
    }
  };

  const renderTrigger = () => {
    switch (variant) {
      case "icon-only":
        return (
          <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${className}`}>
            <Globe className="h-4 w-4" />
          </Button>
        );
      case "compact":
        return (
          <Button variant="outline" size="sm" className={`h-8 px-2 ${className}`}>
            {showFlags && <span className="mr-1">{currentOption.flag}</span>}
            <span className="text-xs">{currentLang.toUpperCase()}</span>
          </Button>
        );
      default:
        return (
          <Button variant="outline" className={`${className}`}>
            <Globe className="h-4 w-4 mr-2" />
            {showFlags && <span className="mr-2">{currentOption.flag}</span>}
            {currentOption.nativeName}
          </Button>
        );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isChanging}>
        {renderTrigger()}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* Available Languages */}
        <div className="px-2 py-1.5">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Available Languages
          </div>
        </div>
        
        {languageOptions.filter(option => option.available).map((option) => {
          const isSelected = option.code === currentLang;
          
          return (
            <DropdownMenuItem
              key={option.code}
              onClick={() => handleLanguageChange(option.code as AvailableLanguage)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center">
                {showFlags && (
                  <span className="mr-3 text-lg">{option.flag}</span>
                )}
                <div>
                  <div className="font-medium">{option.nativeName}</div>
                  <div className="text-xs text-gray-500">{option.name}</div>
                </div>
              </div>
              {isSelected && <Check className="h-4 w-4 text-blue-600" />}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        {/* Coming Soon Languages */}
        <div className="px-2 py-1.5">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Coming Soon
          </div>
        </div>
        
        {languageOptions.filter(option => !option.available).map((option) => (
          <DropdownMenuItem
            key={option.code}
            disabled
            className="flex items-center justify-between opacity-60"
          >
            <div className="flex items-center">
              {showFlags && (
                <span className="mr-3 text-lg">{option.flag}</span>
              )}
              <div>
                <div className="font-medium">{option.nativeName}</div>
                <div className="text-xs text-gray-500">{option.name}</div>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Soon
            </Badge>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            More languages coming in future updates
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}