import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { IOSNotificationBar, type IOSNotificationBarProps } from "./ios-notification-bar"
import { cn } from "@/lib/utils"

interface NotificationItem extends Omit<IOSNotificationBarProps, 'onDismiss' | 'isVisible'> {
  id: string
  timestamp: number
  persist?: boolean // If true, won't auto-hide
  animationState?: 'entering' | 'visible' | 'exiting'
}

interface IOSNotificationManagerProps {
  maxNotifications?: number
  defaultAutoHideDelay?: number
  position?: 'top' | 'bottom'
  className?: string
}

const IOSNotificationManager: React.FC<IOSNotificationManagerProps> = ({
  maxNotifications = 3,
  defaultAutoHideDelay = 5000,
  position = 'top',
  className
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set())

  // Add notification function with animation
  const addNotification = useCallback((notification: Omit<NotificationItem, 'id' | 'timestamp'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNotification: NotificationItem = {
      ...notification,
      id,
      timestamp: Date.now(),
      animationState: 'entering',
      autoHideDelay: notification.autoHideDelay ?? (notification.persist ? undefined : defaultAutoHideDelay),
    }

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications)
      return updated
    })

    // Set to visible after a brief delay to trigger entrance animation
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, animationState: 'visible' } : n)
      )
    }, 50)

    return id
  }, [maxNotifications, defaultAutoHideDelay])

  // Remove notification function with animation
  const removeNotification = useCallback((id: string) => {
    setExitingIds(prev => new Set(prev).add(id))
    
    // Set animation state to exiting
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, animationState: 'exiting' } : n)
    )

    // Remove from DOM after animation completes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
      setExitingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 300) // Match animation duration
  }, [])

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Expose functions through context or global
  React.useEffect(() => {
    // Make functions available globally for easy access
    (window as any).iOSNotifications = {
      add: addNotification,
      remove: removeNotification,
      clear: clearNotifications,
    }

    return () => {
      delete (window as any).iOSNotifications
    }
  }, [addNotification, removeNotification, clearNotifications])

  return (
    <div 
      className={cn(
        "fixed z-[200] left-0 right-0 pointer-events-none",
        position === 'top' ? "top-safe-area-inset-top" : "bottom-safe-area-inset-bottom",
        className
      )}
      style={{
        paddingTop: position === 'top' ? 'env(safe-area-inset-top)' : undefined,
        paddingBottom: position === 'bottom' ? 'env(safe-area-inset-bottom)' : undefined,
      }}
    >
      <div className="max-w-sm mx-auto px-4 space-y-2 pointer-events-auto">
        {notifications.map((notification, index) => {
          const isEntering = notification.animationState === 'entering'
          const isExiting = notification.animationState === 'exiting'
          const isVisible = notification.animationState === 'visible'
          
          return (
            <IOSNotificationBar
              key={notification.id}
              {...notification}
              position={position}
              onDismiss={() => removeNotification(notification.id)}
              isVisible={true}
              className={cn(
                "ios-smooth-transform",
                // Use CSS animation classes from index.css
                position === 'top' ? (
                  isEntering ? "ios-notification-enter-top" :
                  isExiting ? "ios-notification-exit-top" :
                  "transform transition-all duration-300 ease-out"
                ) : (
                  // Bottom animations
                  isEntering ? "ios-notification-enter-bottom" :
                  isExiting ? "ios-notification-exit-bottom" :
                  "transform transition-all duration-300 ease-out"
                ),
                // Stagger animations for multiple notifications
                `delay-[${index * 50}ms]`
              )}
              style={{
                zIndex: notifications.length - index, // Stack notifications properly
                animationDelay: `${index * 50}ms`, // Stagger entrance
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

// Hook for using notifications
export const useIOSNotifications = () => {
  const addNotification = useCallback((notification: Omit<NotificationItem, 'id' | 'timestamp'>) => {
    if ((window as any).iOSNotifications) {
      return (window as any).iOSNotifications.add(notification)
    }
    console.warn('iOS Notifications manager not initialized')
    return null
  }, [])

  const removeNotification = useCallback((id: string) => {
    if ((window as any).iOSNotifications) {
      (window as any).iOSNotifications.remove(id)
    }
  }, [])

  const clearNotifications = useCallback(() => {
    if ((window as any).iOSNotifications) {
      (window as any).iOSNotifications.clear()
    }
  }, [])

  // Convenience methods for common notification types
  const showSuccess = useCallback((title: string, description?: string, options?: Partial<NotificationItem>) => {
    return addNotification({
      variant: 'success',
      title,
      description,
      ...options,
    })
  }, [addNotification])

  const showError = useCallback((title: string, description?: string, options?: Partial<NotificationItem>) => {
    return addNotification({
      variant: 'error',
      title,
      description,
      persist: true, // Errors should persist until manually dismissed
      ...options,
    })
  }, [addNotification])

  const showWarning = useCallback((title: string, description?: string, options?: Partial<NotificationItem>) => {
    return addNotification({
      variant: 'warning',
      title,
      description,
      ...options,
    })
  }, [addNotification])

  const showInfo = useCallback((title: string, description?: string, options?: Partial<NotificationItem>) => {
    return addNotification({
      variant: 'info',
      title,
      description,
      ...options,
    })
  }, [addNotification])

  return {
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}

export { IOSNotificationManager }
export type { NotificationItem, IOSNotificationManagerProps }