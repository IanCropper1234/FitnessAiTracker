/**
 * Translation Audit Report Component
 * Shows actual translation completeness status
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { auditAllLanguages, getTranslationSummary, getMissingKeysWithContext, type Language } from "@/utils/translation-audit";

export function TranslationAuditReport() {
  const [auditResults, setAuditResults] = useState<any>(null);
  const [expandedLanguages, setExpandedLanguages] = useState<Set<Language>>(new Set());
  
  useEffect(() => {
    const results = getTranslationSummary();
    setAuditResults(results);
  }, []);

  if (!auditResults) {
    return <div>Loading audit results...</div>;
  }

  const toggleLanguage = (lang: Language) => {
    const newExpanded = new Set(expandedLanguages);
    if (newExpanded.has(lang)) {
      newExpanded.delete(lang);
    } else {
      newExpanded.add(lang);
    }
    setExpandedLanguages(newExpanded);
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage === 100) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (percentage > 0) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  const getStatusColor = (percentage: number) => {
    if (percentage === 100) return "bg-green-500";
    if (percentage > 50) return "bg-yellow-500";
    if (percentage > 0) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Critical Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Translation Status Alert:</strong> Most languages are incomplete. 
          Only English has full translations. Other languages have basic translations for common terms only.
        </AlertDescription>
      </Alert>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Translation Completeness Overview</CardTitle>
          <CardDescription>
            Analysis of {auditResults.totalLanguages} supported languages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{auditResults.englishKeys}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Keys (EN)</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{auditResults.fullyCompleted}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Fully Complete</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{auditResults.partiallyCompleted}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Partial</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{auditResults.notStarted}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Not Started</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Details */}
      <Card>
        <CardHeader>
          <CardTitle>Language-by-Language Analysis</CardTitle>
          <CardDescription>
            Detailed completeness status for each supported language
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {auditResults.reports.map((report: any) => (
            <Collapsible key={report.language}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto"
                  onClick={() => toggleLanguage(report.language)}
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(report.completionPercentage)}
                    <div className="text-left">
                      <div className="font-medium">
                        {report.language.toUpperCase()} 
                        {report.language === 'en' && <Badge className="ml-2" variant="secondary">Reference</Badge>}
                      </div>
                      <div className="text-sm text-gray-500">
                        {report.translatedKeys}/{report.totalKeys} keys translated
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24">
                      <Progress 
                        value={report.completionPercentage} 
                        className="h-2"
                      />
                    </div>
                    <Badge variant={report.completionPercentage === 100 ? "default" : "secondary"}>
                      {report.completionPercentage}%
                    </Badge>
                    {expandedLanguages.has(report.language) ? 
                      <ChevronDown className="w-4 h-4" /> : 
                      <ChevronRight className="w-4 h-4" />
                    }
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                {report.language !== 'en' && report.missingKeys.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-sm">Missing Translations (sample):</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {getMissingKeysWithContext(report.language).map(({ key, englishValue }) => (
                        <div key={key} className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="font-mono text-blue-600">{key}</div>
                          <div className="text-gray-600 dark:text-gray-400">"{englishValue}"</div>
                        </div>
                      ))}
                    </div>
                    {report.missingKeys.length > 10 && (
                      <div className="text-xs text-gray-500">
                        ...and {report.missingKeys.length - 10} more missing translations
                      </div>
                    )}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>

      {/* Action Recommendations */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="text-orange-700 dark:text-orange-300">
            Recommendations for React-i18next Migration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium">Current Status: NOT Ready for Full Migration</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Only English translations are complete. Other languages have 10-30% coverage for basic terms only.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium">Immediate Action: Complete Missing Translations</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Need to translate ~{auditResults.englishKeys - 20} keys per language before activation.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium">Safe Current Approach: Keep English-Only</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Current EN-US standard is correct until translations are completed.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}