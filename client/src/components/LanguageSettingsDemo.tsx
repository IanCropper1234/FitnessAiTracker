/**
 * Language Settings Demo Component
 * Demonstrates comprehensive language functionality implementation
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Globe, Code, Settings, Users, Zap } from "lucide-react";
import { LanguageSelector } from "./LanguageSelector";
import { useTranslation } from "react-i18next";
import { useUnifiedLanguage, languageMetadata, Language } from "@/lib/unified-language";

export function LanguageSettingsDemo() {
  const { t, i18n } = useTranslation();
  const { language, languageData, isRTL } = useUnifiedLanguage();
  const [autoDetect, setAutoDetect] = useState(true);
  const [stats, setStats] = useState({
    totalTranslations: 0,
    completedLanguages: 0,
    lastUpdated: new Date()
  });

  // Calculate translation statistics
  useEffect(() => {
    const allLanguages = Object.keys(languageMetadata) as Language[];
    const sampleKeys = ['navigation.dashboard', 'common.save', 'auth.welcome_back'];
    
    let totalKeys = 0;
    let translatedKeys = 0;
    
    allLanguages.forEach(lang => {
      sampleKeys.forEach(key => {
        totalKeys++;
        if (i18n.exists(key, { lng: lang })) {
          translatedKeys++;
        }
      });
    });

    setStats({
      totalTranslations: translatedKeys,
      completedLanguages: allLanguages.filter(lang => 
        sampleKeys.every(key => i18n.exists(key, { lng: lang }))
      ).length,
      lastUpdated: new Date()
    });
  }, [language, i18n]);

  const translationExamples = [
    { key: 'navigation.dashboard', fallback: 'Dashboard' },
    { key: 'common.save', fallback: 'Save' },
    { key: 'nutrition.calories', fallback: 'Calories' },
    { key: 'training.sets', fallback: 'Sets' },
    { key: 'profile.goals', fallback: 'Goals' }
  ];

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Language System Analysis</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive multi-language functionality for TrainPro
        </p>
        <Badge variant="secondary" className="ml-2">
          Current: {languageData.flag} {languageData.nativeName}
        </Badge>
      </div>

      {/* Language Selector Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Language Selection Interface
          </CardTitle>
          <CardDescription>
            Multiple UI variants for different use cases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Default Variant</label>
              <LanguageSelector variant="default" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Compact Variant</label>
              <LanguageSelector variant="compact" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Icon Only</label>
              <LanguageSelector variant="icon-only" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Translation Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-green-600" />
            Translation Examples
          </CardTitle>
          <CardDescription>
            Live translation output for current language: {languageData.nativeName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {translationExamples.map(({ key, fallback }) => (
              <div key={key} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-xs text-gray-500 font-mono">{key}</div>
                <div className="text-lg font-medium">
                  {t(key, { defaultValue: fallback })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Language Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            System Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(languageMetadata).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Supported Languages
              </div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.completedLanguages}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Fully Translated
              </div>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {isRTL ? 'RTL' : 'LTR'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Text Direction
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            Language Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Auto-detect browser language</label>
              <p className="text-xs text-gray-500">
                Automatically set language based on browser preferences
              </p>
            </div>
            <Switch
              checked={autoDetect}
              onCheckedChange={setAutoDetect}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Supported Regions</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(languageMetadata).map(([code, data]) => (
                <Badge 
                  key={code} 
                  variant={code === language ? "default" : "secondary"}
                  className="text-xs"
                >
                  {data.flag} {data.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Implementation Guide
          </CardTitle>
          <CardDescription>
            Simple methods to add multi-language support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Method 1: React Hook</h4>
              <code className="text-xs font-mono text-green-600">
                const {`{ t }`} = useTranslation(); {`// t('key')`}
              </code>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Method 2: Unified System</h4>
              <code className="text-xs font-mono text-blue-600">
                const {`{ t, switchLanguage }`} = useUnifiedLanguage();
              </code>
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Method 3: Direct Import</h4>
              <code className="text-xs font-mono text-purple-600">
                import {`{ t }`} from '@/lib/unified-language';
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Project Status */}
      <Card className="border-2 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-300">
            TrainPro Language Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">UI Language Standard</span>
            <Badge variant="outline">English (EN-US)</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Framework Status</span>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              Ready for Internationalization
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Translation Systems</span>
            <Badge variant="secondary">Dual Architecture (React-i18next + Custom)</Badge>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
            Complete multi-language infrastructure exists and ready for activation when international expansion begins.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}