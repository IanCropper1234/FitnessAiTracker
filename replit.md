# FitAI - Advanced AI-Powered Fitness Platform

## Overview

FitAI is a production-ready, enterprise-grade fitness platform that delivers intelligent, adaptive training through comprehensive nutrition and workout management. Built using Renaissance Periodization (RP) methodology, the platform combines evidence-based training science with AI-powered recommendations to provide personalized coaching at scale.

FitAI's vision is to provide intelligent, adaptive training through comprehensive nutrition and workout management, making personalized, evidence-based fitness coaching accessible at scale. The project aims to capture a significant share of the digital fitness market by offering a superior, scientifically-backed alternative to generic fitness applications, catering to serious fitness enthusiasts and bodybuilders.

## Recent Changes (August 2025)

**CRITICAL ROUTING FIX: Standalone Page 404 Issue Resolution (Aug 4, 2025):**
- ✅ **ROOT CAUSE IDENTIFIED**: Wouter router matches routes in order - catch-all `<Route>` (NotFound) was being matched before specific `/template/:id` route
- ✅ **SOLUTION**: Moved specific parametrized routes BEFORE the catch-all NotFound route in App.tsx
- ✅ **PREVENTION RULE**: Always place specific routes with parameters BEFORE generic catch-all routes in Wouter routing
- ✅ **USER PREFERENCE CONFIRMED**: User strongly prefers standalone pages over modal dialogs for complex interfaces
- 🔥 **CRITICAL NOTE**: When creating new standalone pages, ALWAYS place route definitions before the catch-all `<Route>` component to prevent 404 errors

**Enhanced Training Template Creation with Auto-Scroll UX (Aug 4, 2025):**
- ✅ Implemented automatic scrolling to Exercise Configuration section when training methods are selected
- ✅ Added smooth scroll behavior when new exercises are added from exercise library
- ✅ Enhanced mobile layout optimization with compact sections and smaller input controls
- ✅ Reduced button sizes, text labels, and spacing for mobile device compatibility
- ✅ Fixed overflow issues with proper max-height constraints and responsive design
- ✅ Applied abbreviated labels for special training methods (Myorep+, Drop Set Config, etc.)
- ✅ Optimized touch targets and interaction elements for iOS devices

**Training Template Creation Interface English Conversion & TypeScript Fixes (Aug 4, 2025):**
- ✅ Completed full interface conversion from Chinese to English (EN-US)
- ✅ Fixed all TypeScript compilation errors in training template creation system
- ✅ Resolved type compatibility issues between TemplateExercise and SelectedExercise interfaces
- ✅ Updated all form labels, placeholders, and button text to English
- ✅ Translated special training method configurations (Drop Set, Myorep Match/No Match, Giant Set, Superset)
- ✅ Maintained consistent English terminology throughout template creation workflow
- ✅ Fixed type mapping between ExerciseSelector component and template data structure
- ✅ Ensured proper exerciseId field assignment for TemplateExercise compatibility
- ✅ Enhanced code maintainability with explicit TypeScript typing

**Template Creation Interface iOS Optimization (Aug 3, 2025):**
- ✅ Fixed iOS device layout issues in mesocycle template creation dialog
- ✅ Enhanced ExerciseSelector component with responsive design for mobile devices
- ✅ Optimized dialog sizing: max-w-[95vw] and max-h-[95vh] for iOS compatibility
- ✅ Improved muscle group selection interface with grid layout for better touch interaction
- ✅ Added ScrollArea wrapper to exercise configuration sections for better overflow handling
- ✅ Enhanced special training method visibility in template creation workflow
- ✅ Responsive layout improvements: single column on mobile, dual column on larger screens
- ✅ Fixed checkbox and form element sizing for optimal touch targets on iOS devices

**Special Training Method Data Storage & Display Enhancement (Aug 3, 2025):**
- ✅ Fixed Drop Set details display issues using correct dropSetWeights and dropSetReps arrays
- ✅ Enhanced backend storage logic for all special training methods (Drop Set, Myorep Match/No Match, Giant Set, Superset)
- ✅ Updated WorkoutExecutionV2 to show comprehensive configuration details during training execution
- ✅ Enhanced workout-details.tsx to display complete special method configurations in exercise breakdown
- ✅ Added Superset configuration options with paired exercise selection and rest period settings
- ✅ Implemented color-coded visual themes for different special training methods
- ✅ Added backward compatibility for legacy weightReductions data structure
- ✅ Unified special method configuration storage with proper data transformation in server routes

**Rest Timer UI Enhancement (Aug 2, 2025):**
- ✅ Converted REST Timer FAB to perfect circle design with rounded-full styling
- ✅ Enhanced draggable functionality with smooth circular animations
- ✅ Applied consistent circular shape to all timer states (active, inactive, hover)
- ✅ Improved visual consistency with iOS-style floating action button design
- ✅ Fixed global CSS override issue by creating .timer-fab-circle exception class
- ✅ Ensured circular design works despite global border-radius: 0 !important rule

**Workout Session Creator Architecture Change (Aug 2, 2025):**
- ✅ Converted workout session creator from modal dialog to standalone page `/create-workout-session`
- ✅ Added full-screen exercise library experience with search and filtering
- ✅ Implemented navigation routing with back button to training dashboard
- ✅ Removed all dialog-related code and state management from training dashboard
- ✅ Fixed JavaScript runtime error: "selectedExercises is not defined"
- ✅ Updated all "New Workout" buttons to navigate to standalone page
- ✅ Cleaned up unused functions and imports for better code maintainability

**iOS PWA Loading Bug Resolution (Aug 2, 2025):**
- ✅ Fixed critical iOS PWA reload infinite loading issue
- ✅ Implemented 3-second loading timeout failsafe mechanism
- ✅ Disabled aggressive cache clearing that caused reload problems
- ✅ Optimized React Query cache strategy (10min staleTime, 30min gcTime)
- ✅ Enhanced loading logic to prevent PWA-specific state issues
- ✅ Added comprehensive debugging and error handling for PWA lifecycle

**Dialog & Selector Fixes (Aug 2, 2025):**
- ✅ Fixed critical dialog overlay z-index issues preventing selector interaction
- ✅ Removed problematic backdrop-filter that blocked touch events
- ✅ Adjusted z-index hierarchy: DialogOverlay (z-50), DialogContent (z-60), SelectContent (z-100/200)
- ✅ Enhanced dialog overlay transparency from 50% to 80% for better visual contrast
- ✅ Updated exercise library Card styling with extended width (ml-[-15px] mr-[-15px])
- ✅ Ensured filter dropdown menu functionality within dialog modals

**Smart UI & UX Improvements (Aug 2, 2025):**
- ✅ Fixed bulk edit button text logic: "Edit" → "Done" when activated
- ✅ Corrected 'Log Food' quick action redirect from `/nutrition` to `/add-food`
- ✅ Implemented smart meal type detection based on current time
- ✅ Fixed mesocycle status display to only show active mesocycles
- ✅ Applied consistent button styling with brand colors
- ✅ Enhanced user experience with intelligent defaults for food logging
- ✅ Added meal type selectors to Recent Foods and Saved Meals tabs
- ✅ Added "Today" quick navigation button to iOS date picker interface
- ✅ Replaced square border loading animation with modern pulsing dot animation
- ✅ Optimized "Today" button positioning to right edge for better visual balance
- ✅ Fixed dashboard loading state logic to prevent indefinite loading after user authentication
- ✅ Added consistent loading animations to training section matching nutrition section style

**Mesocycle Display Logic Enhancement (Aug 1, 2025):**
- ✅ Added mesocycle name labels to workout session titles for improved organization
- ✅ Modified WorkoutSessionCard interface to include `mesocycleName` parameter
- ✅ Implemented mesocycle lookup map for efficient name resolution
- ✅ Blue mesocycle badges display only for sessions linked to mesocycles
- ✅ Fixed runtime error with `currentMesocycle` reference after query structure changes

**Auto-Regulation System Fixes (Aug 1, 2025):**
- ✅ Fixed volume calculation algorithms to use `setsData` JSON for accurate set counting
- ✅ Corrected database schema property references (`mav`/`mev` vs `mavSets`/`mevSets`)
- ✅ Enhanced algorithm to work without recent feedback data
- ✅ Added comprehensive logging for volume calculations per muscle group

**Load Progression System Restoration (Aug 1, 2025):**
- ✅ Fixed TypeScript compilation errors in load progression recording
- ✅ Corrected database insertion format (array vs single object)
- ✅ Fixed decimal field data type conversions (string format required)
- ✅ Added 8 load progression records for actual workout data
- ✅ Verified API endpoints `/api/training/load-progression` and `/api/training/performance-analysis`
- ✅ **RESOLVED**: Load progression data authentication issue - system now properly displays user-isolated data

## User Preferences

Preferred communication style: Traditional Chinese (ZH-TW) for all technical explanations and general communication.

**Design Preferences:**
- Sharp corner design aesthetic (border-radius: 0) - completely implemented across entire UI system
- No rounded elements anywhere in the interface - user strongly prefers square corners
- Animated progress bars should be maintained for visual appeal
- Condensed list view layouts preferred for mobile optimization

**Data Integrity Requirements:**
- All RP components must use synchronized data sources from weekly goals API
- Adherence percentages, weight changes, and energy levels must match across RP Analysis and Progress Metrics
- Consistent API query parameters required: `/api/weekly-goals?weekStartDate=<specific_week>`

## System Architecture

### Frontend Architecture (Mobile-First Design)
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query v5 for server state caching and synchronization
- **Global State**: React Context for theme and language management
- **UI Framework**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with dark/light mode support
- **Build Tool**: Vite
- **Forms**: React Hook Form with Zod schema validation
- **Charts**: Recharts for responsive data visualization
- **UI/UX Decisions**: iOS-optimized compact layouts, professional black/white/gray theme, 44px minimum touch targets, hardware-accelerated JavaScript animations, consistent spacing, and streamlined interfaces.

### Backend Architecture (Service-Oriented)
- **Runtime**: Node.js with Express.js
- **API Design**: RESTful API with modular service layer architecture
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Complete session-based authentication with bcrypt, Express session, and automatic user ID extraction. All 80+ API routes are protected.
- **Security**: Robust security hardening with all sensitive operations requiring valid session authentication.
- **Data Processing**: Service layer with specialized algorithms for RP methodology, including auto-regulation, volume landmarks, mesocycle periodization, and load progression.

### Core Database Schema (28 Production Tables)
- **User Management**: `users`, `user_profiles`
- **Nutrition System**: `nutrition_goals`, `nutrition_logs`, `weekly_nutrition_goals`, `diet_goals`, `diet_phases`, `food_categories`, `food_items`, `meal_plans`, `meal_timing_preferences`, `macro_flexibility_rules`, `saved_meal_plans`, `meal_macro_distribution`
- **Training System**: `exercises`, `training_programs`, `training_templates`, `workout_sessions`, `workout_exercises`, `mesocycles`, `muscle_groups`, `exercise_muscle_mapping`, `auto_regulation_feedback`, `load_progression_tracking`
- **Volume Management & Analytics**: `volume_landmarks`, `weekly_volume_tracking`, `body_metrics`, `weight_logs`

### API Architecture & Routing Logic
- **Authentication Routes**: `/api/auth/*` for signup, signin, signout, user info.
- **Nutrition Routes**: `/api/nutrition/*` for summaries, logs, goals, recommendations, progression, all protected.
- **Enhanced Food Database Routes**: `/api/food/*` for search, barcode, recommendations.
- **Training Routes**: `/api/training/*` for stats, sessions, exercises, all protected.
- **Auto-Regulation Routes**: `/api/auto-regulation/*` for feedback, volume recommendations, fatigue analysis, all protected.
- **Analytics Routes**: `/api/analytics/*` for comprehensive, nutrition, training, body progress, feedback, all protected.
- **Mesocycle Management Routes**: `/api/mesocycles/*` for management, templates, advance week, all protected.

### Service Layer Architecture
- **Core Business Logic Services**: `NutritionService`, `TrainingService`, `AnalyticsService`, `LoadProgression`, `MesocyclePeriodization`, `TemplateEngine`, `SessionCustomization`, `WorkoutDataProcessor`, `ShoppingListGenerator`.
- **Key Algorithm Implementations**: RP-based auto-regulation, volume landmark calculations (MV, MEV, MAV, MRV), progressive overload, phase transition logic (accumulation/intensification/deload), and systemic fatigue monitoring.

## External Dependencies

- **Database**: Neon PostgreSQL serverless database
- **AI Services**: OpenAI API for nutrition analysis and training recommendations
- **UI Components**: Radix UI primitives
- **Charts**: Recharts
- **Validation**: Zod
- **Forms**: React Hook Form with Zod resolvers
- **Database Management**: Drizzle Kit
- **Build Process**: ESBuild (server), Vite (client)
- **Type Safety**: TypeScript
- **Food Data**: Open Food Facts API (integrated for comprehensive food database coverage)