# FitAI Training Methods Implementation Guide

## Overview

This document provides a comprehensive guide to the special training methods system in FitAI, including data structures, API routes, component interactions, and implementation patterns. Use this guide when adding, modifying, or deleting training methods.

## Current Training Methods Supported

1. **Myorep Match** (`myorep_match`)
2. **Myorep No Match** (`myorep_no_match`) 
3. **Drop Set** (`drop_set`)
4. **Giant Set** (`giant_set`)
5. **Superset** (`superset`)

## Architecture Overview

### Database Schema (`shared/schema.ts`)

#### Primary Tables

**workoutExercises Table (Lines 272-300)**
```typescript
// Current special training method columns
specialMethod: text("special_method", { 
  enum: ["myorep_match", "myorep_no_match", "drop_set", "superset", "giant_set"] 
}),
specialConfig: jsonb("special_config"), // Method-specific configuration
linkedExercises: integer("linked_exercises").array(), // For supersets/giant sets

// Legacy columns (for database compatibility)
specialTrainingMethod: text("special_training_method"),
specialMethodData: jsonb("special_method_data")
```

#### Configuration Interfaces (Lines 631-688)

```typescript
// Method-specific configuration interfaces
interface MyorepConfig {
  activationSet?: boolean; // Default true
  targetReps?: number; // For match sets (10-20 reps)
  miniSets?: number; // Number of mini sets (1-5)
  restSeconds?: number; // 15-30s for myoreps
  sets?: WorkoutSet[];
}

interface DropSetConfig {
  dropSets: number; // Number of drop sets (2-5)
  weightReductions: number[]; // Percentages [15, 15, 15]
  dropRestSeconds: number; // 5-15s between drops
  sets?: WorkoutSet[];
}

interface GiantSetConfig {
  totalTargetReps?: number; // 30-60 reps
  miniSetReps?: number | string; // 5-15 reps per mini-set
  restSeconds?: number; // 5-15s between mini-sets
  giantRestSeconds?: number;
  miniSets?: WorkoutSet[];
}

interface SupersetConfig {
  pairedExerciseId: number;
  restBetween: number; // 30-60s between exercises
  restAfter: number; // 2-3min after complete superset
}

// General interface for compatibility
interface SpecialConfig {
  // All method fields combined for flexibility
  // See lines 661-688 in shared/schema.ts
}
```

### API Routes & Endpoints

#### Core Training Method Routes

**Workout Session Management**
- `GET /api/training/sessions/:id` - Fetch session with special method data
- `POST /api/training/sessions` - Create session with training methods
- `PUT /api/training/sessions/:id/exercises/:exerciseId` - Update exercise with special methods

**Template Management**
- `GET /api/training/saved-workout-templates` - Fetch templates with training methods
- `POST /api/training/sessions/:sessionId/save-as-template` - Save session as template
- `POST /api/training/sessions/from-template` - Create session from template

**Special Method History**
- `GET /api/training/exercises/:exerciseId/special-history` - Fetch training method history

#### Data Flow in API Routes

**Session Creation (Lines 2044-2058 in server/routes.ts)**
```typescript
// Transform exercises to template format with complete training method data
const exerciseTemplates = sessionExercises.map(exercise => ({
  exerciseId: exercise.exerciseId,
  orderIndex: exercise.orderIndex,
  sets: exercise.sets,
  targetReps: exercise.targetReps,
  restPeriod: exercise.restPeriod || 60,
  notes: exercise.notes || '',
  specialMethod: exercise.specialMethod || null,
  specialMethodData: exercise.specialMethodData || null,
  specialConfig: exercise.specialConfig || null, // Complete configuration
  weight: exercise.weight || null,
  rpe: exercise.rpe || null
}));
```

### Frontend Components

#### Primary Components

**1. WorkoutExecutionV2.tsx** (Primary Execution Component)

**State Management (Lines 134-135)**
```typescript
const [specialMethods, setSpecialMethods] = useState<Record<number, string | null>>({});
const [specialConfigs, setSpecialConfigs] = useState<Record<number, any>>({});
```

**Configuration Handling (Lines 447-452)**
```typescript
const handleSpecialConfigChange = (exerciseId: number, config: any) => {
  setSpecialConfigs(prev => ({
    ...prev,
    [exerciseId]: config
  }));
};
```

**2. Create Mesocycle Page** (Template Selection & Preview)

**Method Display Logic**
```typescript
const formatSpecialMethod = (method: string) => {
  switch (method) {
    case 'myorep_match': return 'Myorep Match';
    case 'myorep_no_match': return 'Myorep No Match';
    case 'drop_set': return 'Drop Set';
    case 'giant_set': return 'Giant Set';
    case 'superset': return 'Superset';
    default: return method;
  }
};
```

#### Component Data Flow

```
Template Selection → Training Day Assignment → Session Creation → Workout Execution
        ↓                      ↓                    ↓                  ↓
specialMethod stored    Method preserved      Method applied     Real-time execution
in template JSON       in day assignments    to session         with configuration
```

### Validation Rules & Parameter Ranges

**From replit.md (Lines 50-54)**

- **Myorep Match**: Target Reps (10-20), Mini Sets (1-5), Rest (15-30s)
- **Myorep No Match**: Mini Sets (1-5), Rest (15-30s)  
- **Drop Set**: Number of drops (2-5), Weight reductions per drop (5-30%), Target reps per drop (5-20), Rest between drops (5-15s)
- **Giant Set**: Total target reps (30-60), Mini set reps (5-15), Rest (5-15s)
- **Superset**: Informational only - paired exercise configured separately

### Data Normalization & Compatibility

#### Method Name Normalization (Lines 191-217 in WorkoutExecutionV2.tsx)

```typescript
// Handle multiple possible database formats
if (normalizedMethod === 'dropset' || normalizedMethod === 'drop_set') {
  specialMethod = 'drop_set';
} else if (normalizedMethod === 'myorepmatch' || normalizedMethod === 'myorep_match') {
  specialMethod = 'myorep_match';
} else if (normalizedMethod === 'giantset' || normalizedMethod === 'giant_set') {
  specialMethod = 'giant_set';
}
```

#### Configuration Transformation (Lines 234-257)

```typescript
// Transform database format to UI format
if (specialMethod === 'drop_set') {
  if (specialConfig.drops !== undefined && specialConfig.weightReduction !== undefined) {
    // Database format: {"drops": 1, "weightReduction": 20}
    // Convert to UI format: {"dropSets": 3, "weightReductions": [15, 15, 15]}
  }
}
```

## Implementation Patterns

### Adding a New Training Method

#### 1. Database Schema Updates

**Update shared/schema.ts:**

```typescript
// Add to enum in workoutExercises table
specialMethod: text("special_method", { 
  enum: ["myorep_match", "myorep_no_match", "drop_set", "superset", "giant_set", "NEW_METHOD"] 
}),

// Create configuration interface
interface NewMethodConfig {
  param1: number;
  param2: string;
  param3?: boolean;
}

// Add to SpecialConfig interface
interface SpecialConfig {
  // ... existing fields
  newMethodParam1?: number;
  newMethodParam2?: string;
  newMethodParam3?: boolean;
}
```

#### 2. Frontend Component Updates

**Update WorkoutExecutionV2.tsx:**

```typescript
// Add normalization logic (Lines ~199-211)
else if (normalizedMethod === 'newmethod' || normalizedMethod === 'new_method') {
  specialMethod = 'new_method';
}

// Add configuration handling (Lines ~234-257)
if (specialMethod === 'new_method') {
  uiConfig.param1 = specialConfig.param1 || defaultValue;
  uiConfig.param2 = specialConfig.param2 || 'default';
}
```

**Update formatSpecialMethod function:**

```typescript
case 'new_method': return 'New Method Display Name';
```

#### 3. Validation & Parameter Ranges

**Update replit.md:**
```markdown
- New Method: Param1 (min-max), Param2 (options), Param3 (true/false)
```

**Add validation logic to components that handle special method configuration**

#### 4. API Route Updates

**Ensure server/routes.ts handles the new method:**
- Session creation endpoints
- Template saving endpoints  
- Exercise update endpoints

#### 5. Template & Display Updates

**Update create-mesocycle.tsx and other display components:**
- Add to formatSpecialMethod function
- Update badge display logic
- Add special method detection logic

### Modifying Existing Training Methods

#### Parameter Changes

1. **Update Configuration Interface** in shared/schema.ts
2. **Update Default Values** in WorkoutExecutionV2.tsx configuration handling
3. **Update Validation Ranges** in replit.md
4. **Update UI Components** that display or edit the parameters
5. **Test Data Migration** for existing sessions with the method

#### Display Changes

1. **Update formatSpecialMethod** function in relevant components
2. **Update Badge Colors/Styles** if needed
3. **Update Template Preview** logic in create-mesocycle.tsx

### Deleting Training Methods

#### Deprecation Process

1. **Mark as deprecated** in database enum (keep for compatibility)
2. **Remove from UI selections** (new sessions cannot use it)
3. **Maintain display logic** for existing sessions
4. **Add migration logic** if needed to convert to alternative method

#### Complete Removal (After Migration)

1. **Remove from database enum**
2. **Remove configuration interface**
3. **Remove from SpecialConfig interface**
4. **Remove display logic**
5. **Remove normalization logic**
6. **Update documentation**

## Component Interaction Map

```
┌─────────────────────────────────────────────────────────────────┐
│                     Training Method Data Flow                    │
└─────────────────────────────────────────────────────────────────┘

Database (shared/schema.ts)
├── workoutExercises.specialMethod (enum)
├── workoutExercises.specialConfig (jsonb)
└── Configuration Interfaces (MyorepConfig, DropSetConfig, etc.)
    │
    ▼
API Routes (server/routes.ts)
├── Session CRUD operations
├── Template management
├── Exercise updates
└── Data transformation & validation
    │
    ▼
Frontend State (WorkoutExecutionV2.tsx)
├── specialMethods: Record<number, string | null>
├── specialConfigs: Record<number, any>
└── Normalization & compatibility logic
    │
    ▼
UI Components
├── EnhancedSetInput (method selection & config)
├── Template Preview (display methods)
├── Mesocycle Builder (method inheritance)
└── Exercise Selection (method configuration)
    │
    ▼
User Experience
├── Method selection during exercise setup
├── Configuration during workout execution
├── Template saving with method preservation
└── Mesocycle creation with method inheritance
```

## Testing Considerations

### When Adding/Modifying Methods

1. **Database Migration Testing**
   - Test with existing sessions that use the method
   - Verify configuration preservation
   - Test template saving/loading

2. **Frontend Compatibility Testing**  
   - Test method normalization
   - Test configuration UI
   - Test execution flow

3. **API Integration Testing**
   - Test session creation with new method
   - Test template operations
   - Test data transformation

4. **Cross-Component Testing**
   - Test template → session → execution flow
   - Test mesocycle → session generation
   - Test special method history retrieval

## Development Best Practices

### Code Organization

1. **Centralized Configuration**: Keep all method configurations in shared/schema.ts
2. **Consistent Naming**: Use underscore format (drop_set) in database, normalize in UI
3. **Backward Compatibility**: Maintain legacy column support during transitions
4. **Type Safety**: Use TypeScript interfaces for all configurations

### Data Integrity

1. **Validation**: Implement both frontend and backend validation
2. **Defaults**: Provide sensible defaults for all method parameters  
3. **Migration**: Plan data migration for schema changes
4. **Consistency**: Ensure method display is consistent across all components

### Performance Considerations

1. **State Management**: Use efficient state updates for special method changes
2. **Data Loading**: Lazy load method configurations when needed
3. **Caching**: Cache method configurations in session state
4. **Optimization**: Minimize re-renders during method configuration changes

## Troubleshooting Common Issues

### Method Not Displaying

1. Check enum definition in workoutExercises table
2. Verify formatSpecialMethod function includes the method
3. Check component state initialization
4. Verify API data transformation

### Configuration Lost

1. Check specialConfig JSONB storage
2. Verify configuration normalization logic
3. Check template saving/loading process
4. Verify session state management

### Method Not Executing

1. Check method detection in execution components
2. Verify configuration validation
3. Check set completion logic
4. Verify special method handling in workout flow

## Future Considerations

### Extensibility

- **Plugin Architecture**: Consider plugin-based method system
- **Custom Methods**: Allow user-defined training methods
- **Method Combinations**: Support combining multiple methods
- **Advanced Analytics**: Track method effectiveness metrics

### Performance Optimizations

- **Lazy Loading**: Load method configurations on demand
- **State Optimization**: Optimize special method state management
- **Caching**: Implement method configuration caching
- **Bundle Splitting**: Split method-specific code for better loading

---

**Last Updated**: August 6, 2025  
**Version**: 1.0  
**Maintainer**: FitAI Development Team

> This document should be updated whenever training methods are added, modified, or removed from the system.