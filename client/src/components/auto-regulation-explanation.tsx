import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Activity, 
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Info
} from "lucide-react";

export function AutoRegulationExplanation() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Main Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            How Auto-Regulation Works for Upcoming Workouts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="font-medium">
              <strong>Auto-regulation automatically adjusts your future training volume</strong> based on your post-workout feedback using evidence-based scientific methodology. Here's how your feedback impacts upcoming sessions:
            </AlertDescription>
          </Alert>

          {/* Feedback Categories */}
          <div className="grid gap-4">
            <h3 className="font-semibold text-lg">Feedback Categories & Their Impact</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium">Pump Quality (1-10)</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">How well your muscles filled with blood during training</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Score 8-10:</span>
                      <Badge variant="outline" className="text-green-600">Volume can increase</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Score 5-7:</span>
                      <Badge variant="outline" className="text-blue-600">Volume maintained</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Score 1-4:</span>
                      <Badge variant="outline" className="text-red-600">Volume decreased</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    <h4 className="font-medium">Soreness Level (1-10)</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Delayed onset muscle soreness (DOMS) 24-48h after</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Score 1-3:</span>
                      <Badge variant="outline" className="text-green-600">Volume can increase</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Score 4-6:</span>
                      <Badge variant="outline" className="text-blue-600">Volume maintained</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Score 7-10:</span>
                      <Badge variant="outline" className="text-red-600">Volume decreased</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-red-600" />
                    <h4 className="font-medium">Perceived Effort (1-10)</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">How hard the workout felt overall (RPE scale)</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Score 1-6:</span>
                      <Badge variant="outline" className="text-green-600">Volume can increase</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Score 7-8:</span>
                      <Badge variant="outline" className="text-blue-600">Volume maintained</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Score 9-10:</span>
                      <Badge variant="outline" className="text-red-600">Volume decreased</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium">Energy & Sleep Quality (1-10)</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Recovery factors affecting next workout performance</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Score 8-10:</span>
                      <Badge variant="outline" className="text-green-600">Full recovery</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Score 5-7:</span>
                      <Badge variant="outline" className="text-blue-600">Partial recovery</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Score 1-4:</span>
                      <Badge variant="outline" className="text-red-600">Poor recovery</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volume Adjustment Algorithm */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Volume Adjustment Algorithm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-green-200">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium text-green-600">Volume Increase</h4>
                <p className="text-sm text-muted-foreground mt-1">+5-15% more sets</p>
                <div className="mt-2 text-xs">
                  <p>• High pump quality (8+)</p>
                  <p>• Low soreness (1-3)</p>
                  <p>• Good energy/sleep (7+)</p>
                  <p>• Low effort (≤6)</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium text-blue-600">Volume Maintained</h4>
                <p className="text-sm text-muted-foreground mt-1">Same sets as planned</p>
                <div className="mt-2 text-xs">
                  <p>• Moderate pump (5-7)</p>
                  <p>• Normal soreness (4-6)</p>
                  <p>• Average energy (5-7)</p>
                  <p>• Moderate effort (7-8)</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardContent className="p-4 text-center">
                <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <h4 className="font-medium text-red-600">Volume Decrease</h4>
                <p className="text-sm text-muted-foreground mt-1">-10-25% fewer sets</p>
                <div className="mt-2 text-xs">
                  <p>• Poor pump (≤4)</p>
                  <p>• High soreness (7+)</p>
                  <p>• Low energy (≤4)</p>
                  <p>• High effort (9+)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Integration with Other Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Integration with Other App Sections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Auto-regulation can be enhanced by integrating data from other sections of the app:
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Current Integration</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Post-workout feedback collection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Volume Landmarks (MV/MEV/MAV/MRV)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Muscle group-specific adjustments</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Fatigue accumulation tracking</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Future Enhancements</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Sleep tracking from user profile</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Nutrition adherence impact on recovery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Body weight changes and energy balance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Heart rate variability for recovery</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deload Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Deload Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Automatic Deload Triggers:</strong> When fatigue levels consistently exceed thresholds, the system recommends reducing volume by 40-60% for 3-7 days to promote recovery and prevent overtraining.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h5 className="font-medium mb-2">Trigger Conditions</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 3+ consecutive poor pump scores</li>
                <li>• Persistent high soreness (7+)</li>
                <li>• Declining performance metrics</li>
                <li>• Overall fatigue score &gt;7.5</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2">Deload Protocol</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 40-60% volume reduction</li>
                <li>• Same exercises, lighter weights</li>
                <li>• Focus on movement quality</li>
                <li>• 3-7 day duration</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2">Return to Training</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Pump quality returns to 6+</li>
                <li>• Soreness drops below 5</li>
                <li>• Energy levels improve</li>
                <li>• Gradual volume ramp-up</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}