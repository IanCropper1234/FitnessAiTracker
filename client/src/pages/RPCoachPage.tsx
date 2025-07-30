import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyWellnessCheckin from "@/components/daily-wellness-checkin";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Calendar } from "lucide-react";

interface RPCoachPageProps {
  userId: number;
}

export default function RPCoachPage({ userId }: RPCoachPageProps) {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">RP Diet Coach</h1>
          <p className="text-muted-foreground">Renaissance Periodization intelligent nutrition coaching</p>
        </div>
        <Badge variant="default" className="ml-auto">
          AI-Powered
        </Badge>
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
          <Card>
            <CardHeader>
              <CardTitle>RP Analysis Dashboard</CardTitle>
              <CardDescription>
                Your nutrition performance analyzed using Renaissance Periodization methodology
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                RP Analysis coming soon - will integrate with your weekly wellness data
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>
                Personalized nutrition adjustments based on your wellness check-ins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                AI Recommendations coming soon - will use your energy, hunger, and adherence data
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}