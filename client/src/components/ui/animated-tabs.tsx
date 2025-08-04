import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const AnimatedTabs = TabsPrimitive.Root

const AnimatedTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
AnimatedTabsList.displayName = TabsPrimitive.List.displayName

const AnimatedTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
AnimatedTabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const AnimatedTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = React.useState(false);


  React.useEffect(() => {
    // Get the current active tab value from the parent Tabs context
    const tabsElement = containerRef.current?.closest('[role="tablist"]')?.parentElement;
    const activeTabValue = tabsElement?.getAttribute('data-state') || 
                           tabsElement?.querySelector('[data-state="active"]')?.getAttribute('value');
    
    // Only animate when this tab becomes active
    if (activeTabValue === props.value && containerRef.current) {
      setIsAnimating(true);
      
      // Apply the same animation style as page transitions
      const animation = containerRef.current.animate([
        { 
          opacity: 0, 
          transform: 'translateY(30px) scale(0.95) rotateX(8deg)',
          filter: 'blur(3px)'
        },
        { 
          opacity: 0.6, 
          transform: 'translateY(15px) scale(0.975) rotateX(4deg)',
          filter: 'blur(1.5px)'
        },
        { 
          opacity: 1, 
          transform: 'translateY(0) scale(1) rotateX(0deg)',
          filter: 'blur(0px)'
        }
      ], {
        duration: 500, // Slightly faster than page transitions for better UX
        easing: 'cubic-bezier(0.23, 1, 0.32, 1)', // Same easing as page transitions
        fill: 'both'
      });

      animation.addEventListener('finish', () => {
        setIsAnimating(false);
      });

      return () => {
        animation.cancel();
      };
    }
  }, [props.value]);

  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      <div 
        ref={containerRef}
        style={{
          opacity: isAnimating ? 0 : 1,
          transform: isAnimating ? 'translateY(20px) scale(0.98)' : 'translateY(0) scale(1)',
          transition: isAnimating ? 'none' : 'opacity 0.2s ease, transform 0.2s ease'
        }}
      >
        {children}
      </div>
    </TabsPrimitive.Content>
  )
})
AnimatedTabsContent.displayName = TabsPrimitive.Content.displayName

export { AnimatedTabs, AnimatedTabsList, AnimatedTabsTrigger, AnimatedTabsContent }