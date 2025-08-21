import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, Info, Target, TrendingUp } from "lucide-react";

interface ConversionResult {
  convertedRIR?: number;
  convertedRPE?: number;
  trainingRecommendations?: {
    rir: number;
    trainingZone: string;
    recommendations: string[];
    volumeGuidance: string;
  };
  accuracy?: {
    confidenceLevel: number;
    accuracyNotes: string[];
    isReliable: boolean;
  };
}

export function RPERIRConverter() {
  const [rpe, setRpe] = useState<string>("");
  const [rir, setRir] = useState<string>("");
  const [reps, setReps] = useState<string>("");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConvert = async () => {
    if (!rpe && !rir) {
      alert("請輸入 RPE 或 RIR 值");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/training/rpe-rir-conversion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rpe: rpe ? parseFloat(rpe) : undefined,
          rir: rir ? parseFloat(rir) : undefined,
          reps: reps ? parseInt(reps) : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        throw new Error("轉換失敗");
      }
    } catch (error) {
      console.error("RPE/RIR conversion error:", error);
      alert("轉換失敗，請檢查輸入值");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setRpe("");
    setRir("");
    setReps("");
    setResult(null);
  };

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case "Strength/Peaking":
        return "bg-red-100 text-red-800 border-red-200";
      case "Hypertrophy/Strength":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Technique/Recovery":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            RPE / RIR 科學轉換器
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            基於 Renaissance Periodization 方法學的精確轉換
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rpe">RPE (5-10)</Label>
              <Input
                id="rpe"
                type="number"
                min="5"
                max="10"
                step="0.5"
                placeholder="例如: 8"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">感知努力程度</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rir">RIR (0-5)</Label>
              <Input
                id="rir"
                type="number"
                min="0"
                max="5"
                step="0.5"
                placeholder="例如: 2"
                value={rir}
                onChange={(e) => setRir(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">剩餘次數</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reps">實際次數 (選填)</Label>
              <Input
                id="reps"
                type="number"
                min="1"
                max="50"
                placeholder="例如: 12"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">用於準確度驗證</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={handleConvert} 
              disabled={isLoading || (!rpe && !rir)}
              className="flex-1"
            >
              {isLoading ? "轉換中..." : "開始轉換"}
            </Button>
            <Button variant="outline" onClick={handleClear}>
              清除
            </Button>
          </div>

          {/* Results Section */}
          {result && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                轉換結果
              </h3>

              {/* Basic Conversion */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.convertedRIR !== undefined && (
                  <Card className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {result.convertedRIR}
                      </p>
                      <p className="text-sm text-muted-foreground">RIR (剩餘次數)</p>
                    </div>
                  </Card>
                )}
                
                {result.convertedRPE !== undefined && (
                  <Card className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {result.convertedRPE}
                      </p>
                      <p className="text-sm text-muted-foreground">RPE (感知努力)</p>
                    </div>
                  </Card>
                )}
              </div>

              {/* Training Recommendations */}
              {result.trainingRecommendations && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      訓練建議
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className={getZoneColor(result.trainingRecommendations.trainingZone)}>
                        {result.trainingRecommendations.trainingZone}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {result.trainingRecommendations.volumeGuidance}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="font-medium text-sm">訓練應用：</p>
                      <ul className="space-y-1">
                        {result.trainingRecommendations.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Accuracy Assessment */}
              {result.accuracy && (
                <Alert className={result.accuracy.isReliable ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">
                        準確度評估: {(result.accuracy.confidenceLevel * 100).toFixed(0)}%
                        {result.accuracy.isReliable ? " (可靠)" : " (需注意)"}
                      </p>
                      <ul className="space-y-1 text-sm">
                        {result.accuracy.accuracyNotes.map((note, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Reference Table */}
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">科學轉換對照表</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="font-medium">RPE</div>
                <div className="font-medium">RIR</div>
                <div className="font-medium">訓練應用</div>
                
                <div>10</div><div>0</div><div>最大努力 / 測試</div>
                <div>9</div><div>1</div><div>重量訓練</div>
                <div>8</div><div>2</div><div>力量 / 肥大</div>
                <div>7</div><div>3</div><div>肥大訓練</div>
                <div>6</div><div>4</div><div>輕量日</div>
                <div>5</div><div>5</div><div>減量週</div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}