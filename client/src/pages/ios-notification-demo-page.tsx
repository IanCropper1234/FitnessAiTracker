import React from "react"
import { Link } from "wouter"
import { ChevronLeft } from "lucide-react"
import { IOSNotificationDemo } from "@/components/ui/ios-notification-demo"
import { Button } from "@/components/ui/button"

export const IOSNotificationDemoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center h-16 px-4">
          <Link href="/profile">
            <Button variant="ghost" size="sm" className="mr-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">iOS Notifications Demo</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">iOS Notification System</h2>
            <p className="text-muted-foreground">
              Experience the new iOS-optimized notification bar with native-like animations and interactions.
            </p>
          </div>

          <div className="bg-card border p-4 space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Features</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                Swipe-to-dismiss gestures
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                iOS-native animations
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Auto-hide with custom delays
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                Multiple notification types
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Action buttons and callbacks
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                Safe area support for iOS
              </li>
            </ul>
          </div>

          <IOSNotificationDemo />
          
          <div className="text-center text-xs text-muted-foreground">
            Navigate to <code>/demo/notifications</code> to access this demo
          </div>
        </div>
      </div>
    </div>
  )
}