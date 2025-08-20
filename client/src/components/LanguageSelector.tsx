/**
 * Language Selector Component
 * Provides a clean UI for language switching with flags and native names
 */

import { useState } from "react";
import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUnifiedLanguage, Language, languageMetadata } from "@/lib/unified-language";

interface LanguageSelectorProps {
  variant?: "default" | "compact" | "icon-only";
  showFlags?: boolean;
  className?: string;
}

export function LanguageSelector({ 
  variant = "default", 
  showFlags = true,
  className = ""
}: LanguageSelectorProps) {
  const { language, switchLanguage, supportedLanguages } = useUnifiedLanguage();
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageChange = async (newLang: Language) => {
    if (newLang === language) return;
    
    setIsChanging(true);
    try {
      await switchLanguage(newLang);
    } catch (error) {
      console.error("Failed to switch language:", error);
    } finally {
      setIsChanging(false);
    }
  };

  const currentLangData = languageMetadata[language];

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
            {showFlags && <span className="mr-1">{currentLangData.flag}</span>}
            <span className="text-xs">{language.toUpperCase()}</span>
          </Button>
        );
      default:
        return (
          <Button variant="outline" className={`${className}`}>
            <Globe className="h-4 w-4 mr-2" />
            {showFlags && <span className="mr-2">{currentLangData.flag}</span>}
            {currentLangData.nativeName}
          </Button>
        );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isChanging}>
        {renderTrigger()}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {supportedLanguages.map((lang) => {
          const langData = languageMetadata[lang];
          const isSelected = lang === language;
          
          return (
            <DropdownMenuItem
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center">
                {showFlags && (
                  <span className="mr-3 text-lg">{langData.flag}</span>
                )}
                <div>
                  <div className="font-medium">{langData.nativeName}</div>
                  <div className="text-xs text-gray-500">{langData.name}</div>
                </div>
              </div>
              {isSelected && <Check className="h-4 w-4 text-blue-600" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}