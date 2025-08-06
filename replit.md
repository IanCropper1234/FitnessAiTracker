# FitAI - Advanced AI-Powered Fitness Platform

## Overview
FitAI is an enterprise-grade AI-powered fitness platform providing intelligent, adaptive training through comprehensive nutrition and workout management. Based on the Renaissance Periodization (RP) methodology, it combines evidence-based training science with AI recommendations for personalized coaching at scale. The project aims to capture a significant share of the digital fitness market by offering a superior, scientifically-backed alternative, targeting serious fitness enthusiasts and bodybuilders.

## User Preferences
**Communication Language**: 
- Agent responses: Traditional Chinese (ZH-TW) for technical explanations and general communication
- Application UI: English (EN-US) for all user interface text, labels, and messages

**Design Preferences:**
- Sharp corner design aesthetic (border-radius: 0) - completely implemented across entire UI system
- No rounded elements anywhere in the interface - user strongly prefers square corners
- Animated progress bars should be maintained for visual appeal
- Condensed list view layouts preferred for mobile optimization

**Data Integrity Requirements:**
- All RP components must use synchronized data sources from weekly goals API
- Adherence percentages, weight changes, and energy levels must match across RP Analysis and Progress Metrics
- Consistent API query parameters required: `/api/weekly-goals?weekStartDate=<specific_week>`

**iOS Notification System Implementation (2025-08-06):**
- Implemented comprehensive iOS-style notification system replacing legacy toast notifications
- Migrated critical components: WorkoutExecutionV2, TrainingDashboard, and IntegratedNutritionOverview
- iOS notifications feature drag-to-dismiss, auto-hide timers, action buttons, and native animations
- Established enforcement mechanisms: docs/NOTIFICATION_STANDARDS.md, .eslintrc-notifications.json, scripts/check-notifications.js
- Created notification demo page at /demo/notifications for testing and development reference
- Automated detection script identifies 312 remaining toast usages across 42 files for future migration
- Development standards prevent new toast usage and enforce iOS notification consistency

**Mesocycle Data Synchronization Fix (2025-08-06):**
- Fixed critical data synchronization issue where mesocycle volume progression displayed historical data when no active mesocycle exists
- Backend API now correctly returns empty volume data array when no active mesocycle is present
- Frontend properly displays empty state with appropriate messaging when no active mesocycle exists
- Eliminated misleading historical data display and ensured data integrity across mesocycle dashboard
- Added collapsible Mesocycle History section with count badge for better mobile UX and space management
- Improved user guidance with clear messaging to create new mesocycles when none are active

**Enhanced Auto-Save Implementation (2025-08-05):**
- Training template creation now includes comprehensive field-level auto-save functionality
- Local storage automatically saves template name, difficulty, training days, description, and all exercise configurations with 300ms debounce
- Draft restoration occurs on page load with enhanced user notification for templates with exercises
- Clear Draft button allows manual clearing of saved data
- Auto-saved drafts are automatically cleared upon successful template creation
- Field-level auto-save triggers on onChange and onBlur events for all input fields
- Exercise configurations (sets, reps, rest periods, training methods, notes) are automatically saved
- Workout day names and all special training method configurations are preserved
- Prevents data loss during complex exercise configuration and enhances user experience with immediate feedback

**Advanced Mesocycle Builder with Multi-Template Support (2025-08-06):**
- Mesocycle creation system now supports flexible training day allocation (2-7 days per week)
- Multi-select workout template assignment allowing different templates for each training day
- Template reusability feature - same workout session template can be used across multiple training days
- Enhanced template library with special training methods visibility and usage indicators
- Real-time mesocycle summary showing weekly schedule and total session calculations
- Comprehensive template preview including exercise names, sets×reps, special methods, and difficulty ratings
- Complete special training methods display integration across all template interfaces

**Special Training Method Load Adjustment Fix (2025-08-06):**
- Fixed critical issue where special training method load adjustments were not applied during week advancement
- Corrected logic to adjust `targetReps` within `specialConfig` JSON instead of main exercise `target_reps` field
- Implemented proper progression for all special training methods: MyoRep Match (+1 special target reps), MyoRep No Match (+1 mini sets), Drop Set (+1 target reps per drop), Giant Set (+5 total target reps)
- Week advancement now correctly applies progressive special training method adjustments during session generation
- Enhanced documentation with validation testing and troubleshooting guides for future development

**Advance Week Function Database Validation (2025-08-06):**
- Comprehensive field reference validation in mesocycle-periodization.ts to prevent SQL errors
- Fixed all incorrect special training method field references (specialTrainingMethod → specialMethod)
- Corrected configuration field usage (specialMethodConfig → specialConfig)
- Implemented proper week filtering using session name patterns instead of non-existent week column
- Added null-safe handling for special training configurations with appropriate defaults
- Created complete validation documentation (ADVANCE_WEEK_VALIDATION_REPORT.md) for future development
- Ensured full compatibility with current database schema while maintaining legacy field support

**Training Methods Documentation System (2025-08-06):**
- Created comprehensive training methods implementation guide (`docs/TRAINING_METHODS_GUIDE.md`)
- Complete documentation of data structures, API routes, and component interactions
- Detailed instructions for adding, modifying, or deleting training methods
- Component interaction maps and troubleshooting guides for future development
- Covers all current special training methods: Myorep Match/No Match, Drop Set, Giant Set, Superset

**Legacy Training Templates Removal (2025-08-06):**
- Removed obsolete Training Templates tab from main navigation menu since mesocycle building now uses saved workout session templates
- Eliminated TrainingTemplates component import and AnimatedTabsContent value="templates" 
- Updated FloatingTrainingMenu to remove templates navigation option
- Note: Saved workout session templates remain accessible within Sessions tab via Templates filter for individual session management

**Critical Routing Rules (Wouter):**
- **ROUTE ORDER MATTERS**: More specific routes must be placed BEFORE more generic routes
- Example: `/edit-template/:id` must come BEFORE `/template/:id` to prevent incorrect matching
- Parameterized routes should be ordered from most specific to least specific
- Always place catch-all routes (`<Route>` without path) at the very end
- **Key Route Paths**: `/create-training-template` (not `/training/create-template`), `/create-mesocycle` (not `/training/create-mesocycle`), `/exercise-selection/:source?` for standalone exercise selection page
- **Scrolling Issues Fix**: Modal dialogs with scrolling problems should be converted to standalone pages per user preference for better mobile UX
- **Exercise Selection Navigation Fixed (2025-08-05)**: Resolved complex routing issue where exercise selection page would return to wrong path. Root cause was Wouter router stripping query parameters from location. Solution involved:
  - Using `window.location.search` instead of parsing from Wouter location
  - Fixed sessionStorage data handling and URL encoding/decoding
  - Added function updater support in exercise change callbacks
  - Implemented automatic step progression based on exercise state
  - Added comprehensive debugging and state management improvements

**Special Training Configuration Consistency:**
- Special training details configuration in exercise selection must exactly match the settings from create new workout session configuration
- Template creation page shows special training method configurations as VIEW-ONLY for consistency - detailed editing only available in exercise selection page
- Myorep Match: Target Reps (10-20), Mini Sets (1-5), Rest (15-30s)
- Myorep No Match: Mini Sets (1-5), Rest (15-30s)  
- Drop Set: Number of drops (2-5), Weight reductions per drop (5-30%), Target reps per drop (5-20), Rest between drops (5-15s)
- Giant Set: Total target reps (30-60), Mini set reps (5-15), Rest (5-15s)
- Superset: Informational only - paired exercise configured separately

## System Architecture

### Frontend Architecture (Mobile-First Design)
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query v5 for server state caching and synchronization, React Context for global state.
- **UI Framework**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with dark/light mode support
- **Forms**: React Hook Form with Zod schema validation
- **Charts**: Recharts for responsive data visualization
- **UI/UX Decisions**: iOS-optimized compact layouts, professional black/white/gray theme, 44px minimum touch targets, hardware-accelerated JavaScript animations, consistent spacing, and streamlined interfaces. User strongly prefers standalone pages over modal dialogs for complex interfaces.

### Backend Architecture (Service-Oriented)
- **Runtime**: Node.js with Express.js
- **API Design**: RESTful API with modular service layer architecture
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Complete session-based authentication with bcrypt, Express session, and automatic user ID extraction. All API routes are protected.
- **Security**: Robust security hardening for sensitive operations.
- **Data Processing**: Service layer with specialized algorithms for RP methodology, including auto-regulation, volume landmarks, mesocycle periodization, and load progression.

### Core Database Schema
The system utilizes 28 production tables covering:
- **User Management**: `users`, `user_profiles`
- **Nutrition System**: `nutrition_goals`, `nutrition_logs`, `weekly_nutrition_goals`, `diet_goals`, `diet_phases`, `food_categories`, `food_items`, `meal_plans`, `meal_timing_preferences`, `macro_flexibility_rules`, `saved_meal_plans`, `meal_macro_distribution`
- **Training System**: `exercises`, `training_programs`, `training_templates`, `workout_sessions`, `workout_exercises`, `mesocycles`, `muscle_groups`, `exercise_muscle_mapping`, `auto_regulation_feedback`, `load_progression_tracking`
- **Volume Management & Analytics**: `volume_landmarks`, `weekly_volume_tracking`, `body_metrics`, `weight_logs`

### API Architecture & Routing Logic
- **Authentication Routes**: `/api/auth/*`
- **Nutrition Routes**: `/api/nutrition/*`, `/api/food/*`
- **Training Routes**: `/api/training/*`
- **Auto-Regulation Routes**: `/api/auto-regulation/*`
- **Analytics Routes**: `/api/analytics/*`
- **Mesocycle Management Routes**: `/api/mesocycles/*`
All core API routes are protected by authentication.

### Service Layer Architecture
Core services include `NutritionService`, `TrainingService`, `AnalyticsService`, `LoadProgression`, `MesocyclePeriodization`, `TemplateEngine`, `SessionCustomization`, `WorkoutDataProcessor`, and `ShoppingListGenerator`. Key algorithm implementations include RP-based auto-regulation, volume landmark calculations (MV, MEV, MAV, MRV), progressive overload, phase transition logic, and systemic fatigue monitoring.

## External Dependencies

- **Database**: Neon PostgreSQL serverless database
- **AI Services**: OpenAI API for nutrition analysis and training recommendations
- **UI Components**: Radix UI primitives
- **Charts**: Recharts
- **Validation**: Zod
- **Forms**: React Hook Form
- **Database Management**: Drizzle ORM, Drizzle Kit
- **Build Process**: ESBuild (server), Vite (client)
- **Type Safety**: TypeScript
- **Food Data**: Open Food Facts API