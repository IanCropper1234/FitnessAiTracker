import * as React from "react"
import { useState, useEffect } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, X, AlertTriangle, Info, Zap, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const notificationVariants = cva(
  "relative w-full rounded-lg border transition-all duration-300 touch-manipulation shadow-lg backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "bg-gray-900/95 dark:bg-gray-100/95 border-gray-700 dark:border-gray-300 text-white dark:text-gray-900",
        success: "bg-emerald-600/95 dark:bg-emerald-700/95 border-emerald-500 text-white",
        warning: "bg-amber-600/95 dark:bg-amber-700/95 border-amber-500 text-white", 
        error: "bg-red-600/95 dark:bg-red-700/95 border-red-500 text-white",
        info: "bg-blue-600/95 dark:bg-blue-700/95 border-blue-500 text-white",
      },
      size: {
        compact: "p-3",
        normal: "p-4",
        expanded: "p-5",
      },
      position: {
        top: "top-0",
        bottom: "bottom-0",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "normal",
      position: "top",
    },
  }
)

interface IOSNotificationBarProps extends VariantProps<typeof notificationVariants> {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  onDismiss?: () => void
  autoHideDelay?: number
  isDismissible?: boolean
  isVisible?: boolean
  className?: string
  children?: React.ReactNode
  style?: React.CSSProperties
}

const IOSNotificationBar = React.forwardRef<
  HTMLDivElement,
  IOSNotificationBarProps
>(({ 
  variant, 
  size, 
  position,
  title, 
  description, 
  icon, 
  action, 
  onDismiss, 
  autoHideDelay,
  isDismissible = true,
  isVisible = true,
  className,
  children,
  ...props 
}, ref) => {
  const [isShowing, setIsShowing] = useState(isVisible)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // Auto-hide functionality
  useEffect(() => {
    if (autoHideDelay && autoHideDelay > 0 && isShowing) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, autoHideDelay)
      
      return () => clearTimeout(timer)
    }
  }, [autoHideDelay, isShowing])

  // Update visibility when prop changes
  useEffect(() => {
    setIsShowing(isVisible)
  }, [isVisible])

  const handleDismiss = () => {
    setIsShowing(false)
    setTimeout(() => {
      onDismiss?.()
    }, 300) // Wait for animation to complete
  }

  const getDefaultIcon = () => {
    switch (variant) {
      case 'success':
        return <Check className="h-5 w-5 text-emerald-400" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-400" />
      case 'error':
        return <X className="h-5 w-5 text-red-400" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-400" />
      default:
        return <Zap className="h-5 w-5 text-blue-400" />
    }
  }

  // Touch handlers for swipe-to-dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isDismissible) return
    
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setIsDragging(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !isDismissible) return
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y
    
    // Only allow horizontal swipes
    if (Math.abs(deltaY) > Math.abs(deltaX)) return
    
    // Only allow swipe to right (dismiss)
    if (deltaX > 0) {
      setIsDragging(true)
      setDragOffset(deltaX)
      // Only prevent default if we're actually dragging (not at edge)
      if (touchStart.x > 20) {
        e.preventDefault() // Prevent scrolling
      }
    }
  }

  const handleTouchEnd = () => {
    if (!isDismissible) return
    
    const dismissThreshold = 100 // pixels
    
    if (dragOffset > dismissThreshold) {
      handleDismiss()
    } else {
      // Snap back
      setDragOffset(0)
    }
    
    setTouchStart(null)
    setIsDragging(false)
  }

  return (
    <AnimatePresence mode="wait">
      {isShowing && (
        <motion.div
          ref={ref}
          initial={{ 
            opacity: 0, 
            y: position === "top" ? -60 : 60,
            scale: 0.95 
          }}
          animate={{ 
            opacity: 1, 
            y: 0,
            scale: 1,
            x: dragOffset 
          }}
          exit={{ 
            opacity: 0, 
            y: position === "top" ? -60 : 60,
            scale: 0.95,
            transition: { 
              duration: 0.3, 
              ease: "easeOut" 
            }
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          style={{
            opacity: Math.max(0.3, 1 - dragOffset / 200), // Fade out while dragging
          }}
          className={cn(
            notificationVariants({ variant, size, position }),
            isDragging && "transition-none",
            className
          )}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          {...props}
        >
      {/* Background blur effect */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/5" />
      
      {/* Content */}
      <div className="relative flex items-start gap-3 min-h-[44px]">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {icon || getDefaultIcon()}
        </div>
        
        {/* Text Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-semibold leading-tight mb-1">
              {title}
            </h4>
          )}
          {description && (
            <p className="text-sm opacity-90 leading-relaxed">
              {description}
            </p>
          )}
          {children}
        </div>
        
        {/* Action Button */}
        {action && (
          <button
            onClick={action.onClick}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 transition-colors duration-200 ios-touch-feedback min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {action.label}
          </button>
        )}
        
        {/* Dismiss Button */}
        {isDismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1.5 hover:bg-white/10 transition-colors duration-200 ios-touch-feedback min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4 opacity-70" />
          </button>
        )}
      </div>
      
      {/* Swipe indicator */}
      {isDismissible && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-30">
          <ChevronDown className="h-3 w-3 rotate-90" />
        </div>
      )}
        </motion.div>
      )}
    </AnimatePresence>
  )
})

IOSNotificationBar.displayName = "IOSNotificationBar"

export { IOSNotificationBar, notificationVariants }
export type { IOSNotificationBarProps }