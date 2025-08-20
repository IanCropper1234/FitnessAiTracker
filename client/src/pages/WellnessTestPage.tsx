import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import WeeklyWellnessCheckin from "@/components/weekly-wellness-checkin";
import { AdvancedMacroManagement } from "@/components/advanced-macro-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, Calendar, Zap } from "lucide-react";

export default function WellnessTestPage() {
  const userId = 1; // Test user ID

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Wellness Integration Test</h1>
          <p className="text-muted-foreground">Test the integration between wellness check-ins and macro adjustments</p>
        </div>
      </div>

      <Tabs defaultValue="checkin" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checkin" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Weekly Check-in
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Macro Management
          </TabsTrigger>
          <TabsTrigger value="integration" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Integration Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin" className="space-y-6">
          <WeeklyWellnessCheckin userId={userId} />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <AdvancedMacroManagement userId={userId} />
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
              <CardDescription>
                Test how wellness check-in data flows into macro adjustment calculations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 ">
                <h3 className="font-semibold text-green-800 mb-2">✅ Integration Complete</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Weekly wellness check-ins save energy, hunger, sleep, stress, and adherence ratings</li>
                  <li>• Macro adjustment calculations now use real wellness data instead of hardcoded values</li>
                  <li>• Evidence-based methodology adjusts calories based on user's weekly wellness feedback</li>
                  <li>• Low energy (≤4) reduces deficit aggressiveness</li>
                  <li>• High hunger (≥8) makes the system more conservative</li>
                  <li>• Poor sleep (≤4) or high stress (≥8) reduces adjustment intensity</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 ">
                <h3 className="font-semibold text-blue-800 mb-2">🔄 How to Test</h3>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Fill out the Weekly Check-in with your wellness ratings</li>
                  <li>2. Go to Macro Management and select the current week</li>
                  <li>3. Click "Apply Weekly Adjustment" to see how your wellness data affects calorie adjustments</li>
                  <li>4. The system will use your actual energy, hunger, and stress ratings instead of defaults</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}