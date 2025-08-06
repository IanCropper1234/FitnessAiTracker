# Development Workflow Guide

## New Component Development

When creating new components that require user feedback notifications:

### 1. Pre-Development Check
```bash
# Check current notification compliance
node scripts/check-notifications.js

# Run notification-specific linting
npm run lint:notifications
```

### 2. Component Setup
Always use the iOS notification system for new components:

```typescript
import { useIOSNotifications } from "@/components/ui/ios-notification-manager";

function NewComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useIOSNotifications();
  
  // Use notifications for user feedback
  const handleAction = async () => {
    try {
      await someAsyncAction();
      showSuccess("Success", "Action completed successfully");
    } catch (error) {
      showError("Error", error.message || "Action failed");
    }
  };
}
```

### 3. Pre-Commit Verification
Before committing new code:

```bash
# Verify no new toast usage introduced
node scripts/check-notifications.js

# Check TypeScript compilation
npm run check

# Test functionality in demo environment
# Visit: /demo/notifications
```

## Migration Workflow

For migrating existing components from toast to iOS notifications:

### 1. Identify Components
```bash
# Find components using deprecated toast
node scripts/check-notifications.js
```

### 2. Migration Steps
Follow the patterns established in these migrated components:
- `client/src/components/enhanced/WorkoutExecutionV2.tsx`
- `client/src/components/training-dashboard.tsx`
- `client/src/components/integrated-nutrition-overview.tsx`

### 3. Testing Migration
- Test all notification scenarios
- Verify proper error handling
- Check notification stacking behavior
- Test on mobile devices (PWA)

## Code Review Checklist

### For Reviewers
- [ ] No new `useToast` imports
- [ ] All user feedback uses iOS notifications
- [ ] Appropriate notification variants used
- [ ] Clear, actionable notification messages
- [ ] Error handling includes proper notifications
- [ ] No conflicts with existing notification system

### For Authors
- [ ] Followed notification standards guide
- [ ] Tested notification behavior
- [ ] Verified mobile compatibility
- [ ] Updated documentation if needed
- [ ] Ran notification compliance checks

## Continuous Integration

### Automated Checks (Future)
Consider implementing these CI checks:
1. Run `scripts/check-notifications.js` in CI pipeline
2. Fail builds that introduce new toast usage
3. Generate notification compliance reports
4. Automated notification system testing

### Manual Verification
Until automated CI is implemented:
1. Run notification checks before merging
2. Test notification behavior on mobile
3. Verify no regression in existing notifications

## Development Standards

### Notification Message Guidelines
- **Title**: Short, clear action description
- **Description**: Specific, actionable information
- **Variant**: Choose appropriate type (success/error/warning/info)
- **Timing**: Consider auto-hide vs persistent needs

### Example Patterns
```typescript
// ✅ Good: Clear and specific
showSuccess("Exercise Added", "Bench Press added to workout");
showError("Save Failed", "Check your internet connection and try again");

// ❌ Avoid: Vague or technical
showSuccess("Success", "Operation completed");
showError("Error", "500 Internal Server Error");
```

### Action Button Usage
Use action buttons for:
- Undo operations
- Skip timers/delays  
- Navigate to related content
- Retry failed operations

```typescript
addNotification({
  variant: 'success',
  title: "Set Complete",
  description: "Rest 2:00 before next set",
  persist: true,
  action: {
    label: "Skip Rest",
    onClick: () => handleSkipRest()
  }
});
```

## Resource Links

- **Standards Guide**: `docs/NOTIFICATION_STANDARDS.md`
- **Demo Page**: `/demo/notifications`
- **Check Script**: `scripts/check-notifications.js`
- **Lint Config**: `.eslintrc-notifications.json`
- **Migration Examples**: See migrated components listed above