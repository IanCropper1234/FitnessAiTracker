import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import DailyWellnessCheckin from "@/components/daily-wellness-checkin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, Calendar, ArrowLeft, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { RPAnalysis } from "@/components/rp-analysis";
import { RPRecommendations } from "@/components/rp-recommendations";

interface RPCoachPageProps {
  userId: number;
}

export default function RPCoachPage({ userId }: RPCoachPageProps) {
  const [, setLocation] = useLocation();
  const [isCheckinExpanded, setIsCheckinExpanded] = useState(true);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const [isRecommendationsExpanded, setIsRecommendationsExpanded] = useState(false);

  return (
    <div className="container mx-auto p-4 space-y-6 pl-[5px] pr-[5px]">
      <div className="flex items-center gap-3 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setLocation('/nutrition')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Brain className="h-8 w-8 text-blue-600" />
        <div>
          
          <p className="text-muted-foreground">Evidence-based intelligent nutrition coaching</p>
        </div>
        
      </div>
      <div className="w-full space-y-4">
        {/* Daily Check-in Section */}
        <Collapsible open={isCheckinExpanded} onOpenChange={setIsCheckinExpanded}>
          <Card className="border-green-300 dark:border-green-600 bg-green-50/50 dark:bg-green-900/10">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer collapsible-trigger hover:bg-accent/50 transition-colors py-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-green-900 dark:text-green-100">Daily Check-in</span>
                  </div>
                  <ChevronDown className="h-4 w-4 chevron-rotate text-green-600 dark:text-green-400" data-state={isCheckinExpanded ? 'open' : 'closed'} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="collapsible-content data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <CardContent className="p-5 space-y-6 pl-[5px] pr-[5px] pt-[0px] pb-[0px]">
                <DailyWellnessCheckin userId={userId} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Analysis Section */}
        <Collapsible open={isAnalysisExpanded} onOpenChange={setIsAnalysisExpanded}>
          <Card className="border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/10">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer collapsible-trigger hover:bg-accent/50 transition-colors py-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-900 dark:text-blue-100">Analysis</span>
                  </div>
                  <ChevronDown className="h-4 w-4 chevron-rotate text-blue-600 dark:text-blue-400" data-state={isAnalysisExpanded ? 'open' : 'closed'} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="collapsible-content data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <CardContent className="p-5 space-y-6 pl-[5px] pr-[5px] pt-[5px] pb-[5px]">
                <RPAnalysis userId={userId} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Recommendations Section */}
        <Collapsible open={isRecommendationsExpanded} onOpenChange={setIsRecommendationsExpanded}>
          <Card className="border-purple-300 dark:border-purple-600 bg-purple-50/50 dark:bg-purple-900/10">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer collapsible-trigger hover:bg-accent/50 transition-colors py-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-purple-900 dark:text-purple-100">Recommendations</span>
                  </div>
                  <ChevronDown className="h-4 w-4 chevron-rotate text-purple-600 dark:text-purple-400" data-state={isRecommendationsExpanded ? 'open' : 'closed'} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="collapsible-content data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <CardContent className="pt-0 space-y-6">
                <RPRecommendations userId={userId} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
}