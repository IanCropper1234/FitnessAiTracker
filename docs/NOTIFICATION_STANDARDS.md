# Notification Standards Guide

## Overview
This project uses a unified iOS-style notification system instead of traditional toast notifications for better user experience and consistency across the application.

## Required Usage

### ✅ Use iOS Notifications (Preferred)
```typescript
import { useIOSNotifications } from "@/components/ui/ios-notification-manager";

function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo, addNotification } = useIOSNotifications();

  // Success notifications
  showSuccess("Success", "Operation completed successfully");

  // Error notifications  
  showError("Error", "Something went wrong");

  // Warning notifications
  showWarning("Warning", "Please check your input");

  // Info notifications
  showInfo("Info", "Additional information");

  // Advanced notifications with actions
  addNotification({
    variant: 'success',
    title: "Action Complete",
    description: "Your changes have been saved",
    icon: <CheckCircle className="h-5 w-5 text-emerald-400" />,
    persist: true,
    autoHideDelay: 5000,
    action: {
      label: "Undo",
      onClick: () => handleUndo()
    }
  });
}
```

### ❌ Avoid Toast Notifications (Deprecated)
```typescript
// DON'T USE - This is deprecated
import { useToast } from "@/hooks/use-toast";

function MyComponent() {
  const { toast } = useToast();
  
  toast({
    title: "Success",
    description: "Operation completed",
    variant: "success"
  });
}
```

## Migration Guidelines

### 1. Import Changes
Replace:
```typescript
import { useToast } from "@/hooks/use-toast";
```

With:
```typescript
import { useIOSNotifications } from "@/components/ui/ios-notification-manager";
```

### 2. Hook Usage Changes
Replace:
```typescript
const { toast } = useToast();
```

With:
```typescript
const { showSuccess, showError, showWarning, showInfo, addNotification } = useIOSNotifications();
```

### 3. Notification Calls
Replace:
```typescript
// Old toast syntax
toast({
  title: "Success",
  description: "Message here",
  variant: "success"
});

toast({
  title: "Error", 
  description: "Error message",
  variant: "destructive"
});
```

With:
```typescript
// New iOS notification syntax
showSuccess("Success", "Message here");
showError("Error", "Error message");
showWarning("Warning", "Warning message");
showInfo("Info", "Info message");
```

## Advanced Features

### Persistent Notifications with Actions
```typescript
addNotification({
  variant: 'success',
  title: "Set Complete!",
  description: `Rest 2:00 before next set`,
  icon: <CheckCircle className="h-5 w-5 text-emerald-400" />,
  persist: true,
  autoHideDelay: 3000,
  action: {
    label: "Skip Rest",
    onClick: () => {
      setIsRestTimerActive(false);
      setRestTimeRemaining(0);
    }
  }
});
```

### Notification Variants
- `success` - Green themed for successful operations
- `error` - Red themed for errors and failures  
- `warning` - Yellow themed for warnings and cautions
- `info` - Blue themed for informational messages

## Component Integration Checklist

When creating new components that need notifications:

- [ ] Import `useIOSNotifications` instead of `useToast`
- [ ] Use appropriate notification variant (`showSuccess`, `showError`, etc.)
- [ ] Consider if notification needs action buttons
- [ ] Test notification behavior on mobile devices
- [ ] Ensure notifications don't interfere with other UI elements
- [ ] Use descriptive titles and messages

## Code Review Standards

### Required Checks
1. No new imports of `useToast` hook
2. All user feedback uses iOS notification system
3. Proper notification variant selection
4. Clear and actionable notification messages
5. Appropriate auto-hide timing

### Common Patterns
```typescript
// Mutation success/error handling
const mutation = useMutation({
  mutationFn: async (data) => {
    return await apiRequest('POST', '/api/endpoint', data);
  },
  onSuccess: () => {
    showSuccess("Saved", "Changes saved successfully");
    queryClient.invalidateQueries({ queryKey: ['/api/data'] });
  },
  onError: (error: any) => {
    showError("Error", error.message || "Failed to save changes");
  }
});

// Form validation feedback
const handleSubmit = (data) => {
  if (!data.required_field) {
    showWarning("Incomplete", "Please fill in all required fields");
    return;
  }
  
  // Process form...
  showSuccess("Success", "Form submitted successfully");
};

// Long-running operations
const handleLongOperation = async () => {
  showInfo("Processing", "This may take a few moments...");
  
  try {
    await longRunningTask();
    showSuccess("Complete", "Operation finished successfully");
  } catch (error) {
    showError("Failed", "Operation could not be completed");
  }
};
```

## Implementation Status

### ✅ Migrated Components
- `WorkoutExecutionV2` - All workout feedback notifications
- `TrainingDashboard` - Session management notifications  
- `IntegratedNutritionOverview` - Food logging notifications

### 🔄 Pending Migration
- `daily-wellness-checkin.tsx` - Wellness checkin feedback
- `exercise-management.tsx` - Exercise CRUD operations
- `user-profile.tsx` - Profile update notifications

### 🚫 Components to Avoid Toast
Any new component that provides user feedback should use iOS notifications from the start.

## Developer Resources

- **Demo Page**: `/demo/notifications` - Test all notification variants
- **iOS Notification Manager**: `client/src/components/ui/ios-notification-manager.tsx`
- **Component Documentation**: See component file headers for usage examples

## Enforcement

### Pre-commit Hooks (Future Enhancement)
Consider adding linting rules to prevent new toast usage:
```typescript
// eslint-disable-next-line no-restricted-imports
import { useToast } from "@/hooks/use-toast"; // This should be flagged
```

### Code Review Template
```markdown
## Notification Review Checklist
- [ ] Uses `useIOSNotifications` instead of `useToast`
- [ ] Appropriate notification variant selected
- [ ] Clear, actionable messages
- [ ] Proper error handling with notifications
- [ ] No conflicts with existing notifications
```