# FitAI - Advanced AI-Powered Fitness Platform

## Overview
FitAI is an enterprise-grade AI-powered fitness platform providing intelligent, adaptive training through comprehensive nutrition and workout management. Based on the Renaissance Periodization (RP) methodology, it combines evidence-based training science with AI recommendations for personalized coaching at scale. The project aims to capture a significant share of the digital fitness market by offering a superior, scientifically-backed alternative, targeting serious fitness enthusiasts and bodybuilders.

## Current Status (2025-08-07)
**System Stability**: ✅ EXCELLENT - All major features operational, authentication system fully restored, zero LSP errors across all components
**Performance Optimization**: ✅ COMPLETE - Memory-optimized search system, error boundaries, and loading state management fully implemented
**User Experience**: ✅ STABLE - iOS-optimized mobile interface, smooth navigation, comprehensive workout execution system
**Data Integrity**: ✅ MAINTAINED - All API endpoints responding correctly, user sessions stable, database operations successful
**Priority B Features**: ✅ COMPLETED - Advanced Training Analytics, AI Exercise Recommendations, and Enhanced Nutrition AI Analysis fully implemented

**Recent Achievements** (Updated 2025-08-07):
- ✅ AI Features Reorganization (2025-08-07) - Moved "Create AI Workout Session" from Progress to Sessions tab for better user workflow
- ✅ AI Exercise Recommendations Renamed (2025-08-07) - Changed to "Create AI Workout Session" and updated all navigation paths
- ✅ Authentication System Fully Restored (2025-08-07) - Fixed bcrypt password verification issue
- ✅ AI Features Navigation Integration (2025-08-07) - All AI features accessible via bottom navigation "+" quick actions
- ✅ Priority B Enhancements - FULLY COMPLETED (2025-08-07)
  - ✅ Advanced Training Analytics - RP volume progression tracking with visual charts and periodization insights
  - ✅ AI-Powered Exercise Recommendations - OpenAI integration for intelligent exercise suggestions based on user goals
  - ✅ Enhanced Nutrition AI Analysis - Comprehensive micronutrient analysis and personalized RDA comparison system
  - ✅ Complete Server-Side AI Integration - All OpenAI processing handled server-side with proper authentication
  - ✅ Analytics API Backend - Complete server implementation with volume progression, fatigue analysis, and RP methodology
  - ✅ Zero Browser Environment Issues - Fixed all client-side OpenAI integration issues by moving to server-side processing
- ✅ Priority A Critical Component Fixes - COMPLETED
- ✅ Exercise Selector Component Fully Refactored - Fixed 89+ LSP/TypeScript errors while preserving all functionality
- ✅ Modal to Standalone Page Conversion - Exercise Selector now uses page navigation for better mobile UX
- ✅ Memory-optimized search with LRU caching implemented 
- ✅ Comprehensive error boundary system with graceful degradation
- ✅ Enhanced loading states with progressive indicators
- ✅ Exercise selection page performance optimized for large datasets
- ✅ Zero LSP errors system-wide - all components in excellent technical condition
- ✅ AI Features Navigation Fixed (2025-08-07) - All AI page return buttons now correctly navigate to parent sections
- ✅ Dashboard Animation Loop Issue Resolved (2025-08-07) - Fixed AnimatedPage component to prevent animation cycling on first load
- ✅ Navigation Label Updated (2025-08-07) - Changed bottom navigation from "Diary" to "Nutrition" for clarity
- ✅ Navigation Icon Updated (2025-08-07) - Changed nutrition icon from BookOpen to Utensils for better visual representation
- ✅ Food Log Icon Updated (2025-08-07) - Changed Food Log icon to BookOpen to represent logging/diary functionality
- ✅ Enhanced Smooth Collapsible Animations (2025-08-08) - Implemented professional collapsible/expandable animations with smooth transitions, enhanced chevron rotations, and consistent visual feedback across all collapsible components system-wide

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

**Critical Routing Rules (Wouter):**
- **ROUTE ORDER MATTERS**: More specific routes must be placed BEFORE more generic routes
- Example: `/edit-template/:id` must come BEFORE `/template/:id` to prevent incorrect matching
- Parameterized routes should be ordered from most specific to least specific
- Always place catch-all routes (`<Route>` without path) at the very end
- **Key Route Paths**: `/create-training-template`, `/create-mesocycle`, `/exercise-selection/:source?` for standalone exercise selection page
- **Scrolling Issues Fix**: Modal dialogs with scrolling problems should be converted to standalone pages per user preference for better mobile UX

## System Architecture

### Frontend Architecture (Mobile-First Design)
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query v5 for server state caching and synchronization, React Context for global state.
- **UI Framework**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with dark/light mode support
- **Forms**: React Hook Form with Zod schema validation
- **Charts**: Recharts for responsive data visualization
- **Error Handling**: Global error boundary system with component-level, page-level, and critical-level error handling. Automatic error reporting and recovery mechanisms.
- **Performance**: Memory-optimized search with intelligent LRU caching, debounced queries, and pagination for large datasets. Virtual scrolling capabilities for enhanced performance.
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

### Key Features & Implementations
- **iOS-style Notification System**: Comprehensive, replacing legacy toast notifications with features like drag-to-dismiss, auto-hide, action buttons, and native animations. Includes slice up/down animations with state-managed animation lifecycle.
- **Enhanced Workout Execution System (2025-08-07)**: Complete Priority 1 optimization featuring enhanced rest timer animations with pulse effects and urgency indicators (RestTimerFAB.tsx), dedicated auto-regulation feedback system with professional RPE selection interface (AutoRegulationFeedback.tsx), progress save indicator with bounce animations and real-time status tracking (ProgressSaveIndicator.tsx), and **automatic set completion saving** to prevent data loss during exercise reordering. Includes comprehensive CSS animation system with set completion celebrations, workout progress pulses, and RPE selection highlights.
- **User-Controlled Settings System (2025-08-07)**: Comprehensive workout settings interface at `/workout-settings` allowing users to control RP auto-regulation feedback and other workout features. Includes integrated feature flag system with real-time toggle capabilities, detailed feature descriptions, and intelligent data flow from in-workout RPE collection to post-workout comprehensive feedback system.
- **System Performance & Stability Optimization (2025-08-07)**: Complete Priority 3 implementation featuring memory-optimized search system with intelligent LRU caching (`useOptimizedSearch.ts`), comprehensive error boundary system (`error-boundary.tsx`) with component/page/critical level handling and automatic error reporting, enhanced loading state management with progressive loading indicators, error fallbacks, and loading overlays. Exercise selection pages now use optimized search with debounced queries, pagination, and cache management for scalable performance with large datasets.
- **Mesocycle Management**: Supports flexible training day allocation (2-7 days/week), multi-select workout template assignment, and template reusability. Includes real-time mesocycle summary and comprehensive template preview. Correctly handles mesocycle volume progression for active and inactive mesocycles.
- **Training Template Auto-Save**: Field-level auto-save for training template creation, including name, difficulty, training days, description, and exercise configurations, with draft restoration and clear options.
- **Search Performance Optimization**: Unified memoized filtering, debounced search, and pagination across all searchable components (Training Dashboard, Exercise Library Selector, Exercise Selection, Workout Session Creator) for scalable handling of exercises.
- **Special Training Method Integration**: Correct application of load adjustments for special training methods during week advancement (MyoRep Match/No Match, Drop Set, Giant Set). Configuration consistency maintained between exercise selection and workout creation.

## Next Priority Recommendations

**PRIORITY A - Feature Enhancements** (Previous Critical Fixes Completed):
1. **Advanced Training Analytics** - Implement comprehensive RP volume progression tracking with visual charts and periodization insights.
2. **AI-Powered Exercise Recommendations** - Integrate OpenAI API for intelligent exercise suggestions based on user goals and training history.
3. **Enhanced Nutrition AI Analysis** - Expand micronutrient analysis and personalized RDA comparison system.

**PRIORITY B - User Experience Polish**:
1. **Progressive Web App Enhancements** - Further optimize PWA capabilities with offline functionality and enhanced caching.
2. **Advanced Animation System** - Implement more sophisticated animations for workout transitions and data visualizations.
3. **Accessibility Improvements** - Add comprehensive screen reader support and keyboard navigation.

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