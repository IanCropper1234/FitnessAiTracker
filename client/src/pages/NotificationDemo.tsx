import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useIOSNotifications } from "@/components/ui/ios-notification-manager";
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle,
  Clock,
  Zap,
  Shield,
  Code
} from "lucide-react";

export default function NotificationDemo() {
  const { showSuccess, showError, showWarning, showInfo, addNotification } = useIOSNotifications();
  const [notificationCount, setNotificationCount] = useState(0);

  const handleBasicNotifications = () => {
    showSuccess("Success", "This is a success notification");
    setTimeout(() => showError("Error", "This is an error notification"), 500);
    setTimeout(() => showWarning("Warning", "This is a warning notification"), 1000);
    setTimeout(() => showInfo("Info", "This is an info notification"), 1500);
  };

  const handleAdvancedNotification = () => {
    addNotification({
      variant: 'success',
      title: "Rest Timer Complete!",
      description: "2:00 rest period finished. Ready for next set?",
      icon: <Clock className="h-5 w-5 text-emerald-400" />,
      persist: true,
      autoHideDelay: 5000,
      action: {
        label: "Skip Rest",
        onClick: () => {
          showInfo("Skipped", "Rest timer skipped");
        }
      }
    });
  };

  const handleStackedNotifications = () => {
    for (let i = 1; i <= 3; i++) {
      setTimeout(() => {
        setNotificationCount(prev => prev + 1);
        showSuccess("Set Complete", `Set ${i} completed successfully`);
      }, i * 300);
    }
  };

  const handleWorkoutNotifications = () => {
    showInfo("Starting", "Workout session has begun");
    
    setTimeout(() => {
      addNotification({
        variant: 'warning',
        title: "Form Check",
        description: "Remember to maintain proper form throughout",
        icon: <Shield className="h-5 w-5 text-amber-400" />,
        autoHideDelay: 3000
      });
    }, 1000);

    setTimeout(() => {
      addNotification({
        variant: 'success',
        title: "Personal Record!",
        description: "New max weight achieved: 225 lbs",
        icon: <Zap className="h-5 w-5 text-emerald-400" />,
        persist: true,
        action: {
          label: "Save PR",
          onClick: () => showSuccess("Saved", "Personal record saved to profile")
        }
      });
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">iOS Notification System Demo</h1>
        <p className="text-muted-foreground">
          Test the new notification system and see enforcement guidelines
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Basic Notifications
            </CardTitle>
            <CardDescription>
              Test all four notification variants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleBasicNotifications} className="w-full">
              Show All Variants
            </Button>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">showSuccess()</Badge>
                <span className="text-sm">Green theme</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">showError()</Badge>
                <span className="text-sm">Red theme</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">showWarning()</Badge>
                <span className="text-sm">Yellow theme</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>showInfo()</Badge>
                <span className="text-sm">Blue theme</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Advanced Features
            </CardTitle>
            <CardDescription>
              Persistent notifications with actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleAdvancedNotification} className="w-full">
              Rest Timer Complete
            </Button>
            
            <div className="space-y-2 text-sm">
              <div>✅ Custom icons</div>
              <div>✅ Action buttons</div>
              <div>✅ Persistent display</div>
              <div>✅ Auto-hide timing</div>
            </div>
          </CardContent>
        </Card>

        {/* Stacking Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Notification Stacking
            </CardTitle>
            <CardDescription>
              Multiple notifications with smart stacking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleStackedNotifications} className="w-full">
              Complete 3 Sets
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Notifications stack vertically and can be dismissed individually
            </div>
          </CardContent>
        </Card>

        {/* Workout Scenario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Workout Scenario
            </CardTitle>
            <CardDescription>
              Real workout notification sequence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleWorkoutNotifications} className="w-full">
              Start Workout Demo
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Simulates actual workout notifications with varying types and actions
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Implementation Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Implementation Guidelines
          </CardTitle>
          <CardDescription>
            How to ensure new components use iOS notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium text-green-600 dark:text-green-400">✅ Use This</h4>
              <div className="bg-green-50 dark:bg-green-950 p-3 border border-green-200 dark:border-green-800">
                <code className="text-sm">
                  {`import { useIOSNotifications } from "@/components/ui/ios-notification-manager";

const { showSuccess, showError } = useIOSNotifications();

// Show notifications
showSuccess("Success", "Operation completed");
showError("Error", "Something went wrong");`}
                </code>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-red-600 dark:text-red-400">❌ Avoid This</h4>
              <div className="bg-red-50 dark:bg-red-950 p-3 border border-red-200 dark:border-red-800">
                <code className="text-sm">
                  {`import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

// This is deprecated!
toast({
  title: "Success",
  description: "Operation completed",
});`}
                </code>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Enforcement Tools</h4>
            <div className="space-y-1 text-sm">
              <div>📋 <code>docs/NOTIFICATION_STANDARDS.md</code> - Complete migration guide</div>
              <div>🔍 <code>npm run check:notifications</code> - Find deprecated toast usage</div>
              <div>⚠️ <code>npm run lint:notifications</code> - ESLint rules for enforcement</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{notificationCount}</div>
          <p className="text-sm text-muted-foreground">
            Total notifications triggered in this session
          </p>
        </CardContent>
      </Card>
    </div>
  );
}