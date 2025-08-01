import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyWellnessCheckin from "@/components/daily-wellness-checkin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, Calendar, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { RPAnalysis } from "@/components/rp-analysis";
import { RPRecommendations } from "@/components/rp-recommendations";

interface RPCoachPageProps {
  userId: number;
}

export default function RPCoachPage({ userId }: RPCoachPageProps) {
  const [, setLocation] = useLocation();

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

      <Tabs defaultValue="checkin" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checkin" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Daily Check-in
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            RP Analysis
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin" className="space-y-6">
          <DailyWellnessCheckin userId={userId} />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <RPAnalysis userId={userId} />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <RPRecommendations userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}