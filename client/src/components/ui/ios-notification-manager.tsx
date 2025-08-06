import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { IOSNotificationBar, type IOSNotificationBarProps } from "./ios-notification-bar"
import { cn } from "@/lib/utils"

interface NotificationItem extends Omit<IOSNotificationBarProps, 'onDismiss' | 'isVisible'> {
  id: string
  timestamp: number
  persist?: boolean // If true, won't auto-hide
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

  // Add notification function
  const addNotification = useCallback((notification: Omit<NotificationItem, 'id' | 'timestamp'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNotification: NotificationItem = {
      ...notification,
      id,
      timestamp: Date.now(),
      autoHideDelay: notification.autoHideDelay ?? (notification.persist ? undefined : defaultAutoHideDelay),
    }

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications)
      return updated
    })

    return id
  }, [maxNotifications, defaultAutoHideDelay])

  // Remove notification function
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
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
        {notifications.map((notification, index) => (
          <IOSNotificationBar
            key={notification.id}
            {...notification}
            position={position}
            onDismiss={() => removeNotification(notification.id)}
            isVisible={true}
            className={cn(
              "transform transition-all duration-300 ease-out",
              // Stagger animations
              `delay-[${index * 100}ms]`
            )}
            style={{
              zIndex: notifications.length - index, // Stack notifications properly
            }}
          />
        ))}
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