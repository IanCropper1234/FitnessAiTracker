import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Brain, 
  Target, 
  Zap, 
  TrendingUp, 
  Clock,
  Dumbbell,
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Info,
  Save,
  Calendar,
  Plus
} from "lucide-react";
import { useLocation } from "wouter";
import { AIExerciseRecommendationService } from "@/services/aiExerciseRecommendations";
import { useToast } from "@/hooks/use-toast";

export default function CreateAIWorkoutSession() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Template naming state
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [customTemplateName, setCustomTemplateName] = useState('');
  const [pendingSaveAction, setPendingSaveAction] = useState<(() => Promise<void>) | null>(null);

  // Execute the pending save action
  const executePendingSave = async () => {
    if (pendingSaveAction) {
      await pendingSaveAction();
      setShowNameDialog(false);
      setPendingSaveAction(null);
      setCustomTemplateName('');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            className="mb-4 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
            AI Exercise Recommendations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Get personalized workout recommendations powered by AI
          </p>
        </div>

        {/* Custom Template Name Dialog */}
        <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
          <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900">
            <DialogHeader>
              <DialogTitle className="text-black dark:text-white">Name Your Template</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Enter a custom name for your AI-generated workout template.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="template-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="template-name"
                  value={customTemplateName}
                  onChange={(e) => setCustomTemplateName(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter template name..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNameDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={executePendingSave}
                disabled={!customTemplateName.trim()}
              >
                Save Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}