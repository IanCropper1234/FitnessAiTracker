import * as React from "react"
import { Button } from "@/components/ui/button"
import { useIOSNotifications } from "./ios-notification-manager"
import { Zap, Trophy, AlertTriangle, Info } from "lucide-react"

export const IOSNotificationDemo: React.FC = () => {
  const { showSuccess, showError, showWarning, showInfo, addNotification, clearNotifications } = useIOSNotifications()

  const demoNotifications = [
    {
      title: "Set Completed!",
      description: "Pull-ups: 71.65kg × 8 @ RPE 8",
      action: () => showSuccess("Set Completed!", "Pull-ups: 71.65kg × 8 @ RPE 8")
    },
    {
      title: "Rest Timer",
      description: "90 seconds remaining",
      action: () => addNotification({
        variant: 'info',
        title: "Rest Timer",
        description: "90 seconds remaining",
        icon: <Zap className="h-5 w-5 text-blue-400" />,
        persist: true,
        action: {
          label: "Skip",
          onClick: () => console.log("Rest skipped")
        }
      })
    },
    {
      title: "Workout Complete!",
      description: "Great job! 8 exercises completed in 45 minutes",
      action: () => showSuccess("Workout Complete!", "Great job! 8 exercises completed in 45 minutes", {
        icon: <Trophy className="h-5 w-5 text-emerald-400" />,
        action: {
          label: "View Stats",
          onClick: () => console.log("View workout stats")
        }
      })
    },
    {
      title: "Form Check",
      description: "Consider reducing weight if RPE > 9",
      action: () => showWarning("Form Check", "Consider reducing weight if RPE > 9", {
        action: {
          label: "Adjust",
          onClick: () => console.log("Adjust weight")
        }
      })
    },
    {
      title: "Connection Error",
      description: "Failed to save progress. Check your internet connection.",
      action: () => showError("Connection Error", "Failed to save progress. Check your internet connection.", {
        action: {
          label: "Retry",
          onClick: () => console.log("Retry save")
        }
      })
    },
    {
      title: "Auto-save",
      description: "Template draft saved automatically",
      action: () => showInfo("Auto-save", "Template draft saved automatically")
    }
  ]

  return (
    <div className="space-y-4 p-4 max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-4">iOS Notification Demo</h2>
      
      <div className="grid gap-2">
        {demoNotifications.map((demo, index) => (
          <Button
            key={index}
            variant="outline"
            onClick={demo.action}
            className="justify-start text-left h-auto p-3"
          >
            <div>
              <div className="font-medium text-sm">{demo.title}</div>
              <div className="text-xs text-muted-foreground">{demo.description}</div>
            </div>
          </Button>
        ))}
        
        <Button
          variant="destructive"
          onClick={clearNotifications}
          className="mt-4"
        >
          Clear All Notifications
        </Button>
      </div>
    </div>
  )
}