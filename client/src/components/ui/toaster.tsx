import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

// Enhanced Toast with swipe-to-dismiss functionality
function SwipeableToast({ id, title, description, action, onDismiss, ...props }: any) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setIsDragging(false)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y
    
    // Only allow horizontal swipes
    if (Math.abs(deltaY) > Math.abs(deltaX)) return
    
    // Only allow swipe to right (dismiss)
    if (deltaX > 0) {
      setIsDragging(true)
      setDragOffset(deltaX)
      e.preventDefault() // Prevent scrolling
    }
  }

  const handleTouchEnd = () => {
    const dismissThreshold = 100 // pixels
    
    if (dragOffset > dismissThreshold) {
      onDismiss()
    } else {
      // Snap back
      setDragOffset(0)
    }
    
    setTouchStart(null)
    setIsDragging(false)
  }

  return (
    <Toast 
      key={id} 
      {...props}
      className="ios-touch-feedback transition-transform duration-200 ease-out"
      style={{
        transform: `translateX(${dragOffset}px)`,
        opacity: Math.max(0.3, 1 - (dragOffset / 200)),
        touchAction: 'pan-x',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="grid gap-1 flex-1 min-w-0 pr-2">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && (
          <ToastDescription>{description}</ToastDescription>
        )}
      </div>
      {action}
      <ToastClose />
    </Toast>
  )
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider swipeDirection="right" swipeThreshold={50}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <SwipeableToast
            key={id}
            id={id}
            title={title}
            description={description}
            action={action}
            onDismiss={() => dismiss(id)}
            {...props}
          />
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
