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
  const [openSections, setOpenSections] = useState({
    checkin: true,
    analysis: false,
    recommendations: false
  });

  const toggleSection = (section: 'checkin' | 'analysis' | 'recommendations') => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
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
          
          <p className="text-muted-foreground">Renaissance Periodization intelligent nutrition coaching</p>
        </div>
        
      </div>

      <div className="space-y-4">
        {/* Daily Check-in Section */}
        <Collapsible open={openSections.checkin} onOpenChange={() => toggleSection('checkin')}>
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer collapsible-trigger hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Daily Check-in
                  </CardTitle>
                  <ChevronDown className="h-4 w-4 chevron-rotate text-muted-foreground" data-state={openSections.checkin ? 'open' : 'closed'} />
                </div>
                <CardDescription>
                  Complete your daily wellness assessment for personalized RP coaching
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="collapsible-content data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <CardContent className="pt-0">
                <DailyWellnessCheckin userId={userId} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* RP Analysis Section */}
        <Collapsible open={openSections.analysis} onOpenChange={() => toggleSection('analysis')}>
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer collapsible-trigger hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    RP Analysis
                  </CardTitle>
                  <ChevronDown className="h-4 w-4 chevron-rotate text-muted-foreground" data-state={openSections.analysis ? 'open' : 'closed'} />
                </div>
                <CardDescription>
                  Renaissance Periodization analysis based on your progress data
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="collapsible-content data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <CardContent className="pt-0">
                <RPAnalysis userId={userId} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Recommendations Section */}
        <Collapsible open={openSections.recommendations} onOpenChange={() => toggleSection('recommendations')}>
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer collapsible-trigger hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Recommendations
                  </CardTitle>
                  <ChevronDown className="h-4 w-4 chevron-rotate text-muted-foreground" data-state={openSections.recommendations ? 'open' : 'closed'} />
                </div>
                <CardDescription>
                  AI-powered recommendations for optimizing your training and nutrition
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent className="collapsible-content data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
              <CardContent className="pt-0">
                <RPRecommendations userId={userId} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
}