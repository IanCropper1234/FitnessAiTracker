# TrainPro - Advanced AI-Powered Fitness Platform

## Overview
TrainPro is an enterprise-grade AI-powered fitness platform providing intelligent, adaptive training through comprehensive nutrition and workout management. It is based on the Renaissance Periodization (RP) methodology, combining evidence-based training science with AI recommendations for personalized coaching at scale. The project aims to capture a significant share of the digital fitness market by offering a superior, scientifically-backed alternative, targeting serious fitness enthusiasts and bodybuilders.

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
- **Goal Standardization (Aug 2025)**: All goal-setting components use only three standardized options: Fat Loss, Muscle Gain, Maintenance
- **Single Source of Truth**: dietGoals table serves as primary data source with Goal Synchronization Service managing cross-component consistency

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
- **Error Handling**: Global error boundary system with component-level, page-level, and critical-level error handling.
- **Performance**: Memory-optimized search with intelligent LRU caching, debounced queries, and pagination for large datasets.
- **UI/UX Decisions**: iOS-optimized compact layouts, professional black/white/gray theme, 44px minimum touch targets, hardware-accelerated JavaScript animations, consistent spacing, and streamlined interfaces. User strongly prefers standalone pages over modal dialogs for complex interfaces.

### Backend Architecture (Service-Oriented)
- **Runtime**: Node.js with Express.js
- **API Design**: RESTful API with modular service layer architecture
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Hybrid authentication system supporting both legacy session-based auth and Replit Auth. All API routes are protected with automatic user ID extraction.
- **Security**: Robust security hardening for sensitive operations with dual auth support.
- **Data Processing**: Service layer with specialized algorithms for RP methodology, including auto-regulation, volume landmarks, mesocycle periodization, and load progression.

### Core Database Schema
The system utilizes 28 production tables covering user management, nutrition, training, volume management, and analytics.

### API Architecture & Routing Logic
- **Authentication Routes**: `/api/auth/*`
- **Nutrition Routes**: `/api/nutrition/*`, `/api/food/*`
- **Training Routes**: `/api/training/*`
- **Auto-Regulation Routes**: `/api/auto-regulation/*`
- **Analytics Routes**: `/api/analytics/*`
- **Mesocycle Management Routes**: `/api/mesocycles/*`
All core API routes are protected by authentication.

### Service Layer Architecture
Core services include `NutritionService`, `TrainingService`, `AnalyticsService`, `LoadProgression`, `MesocyclePeriodization`, `TemplateEngine`, `SessionCustomization`, `WorkoutDataProcessor`, `ShoppingListGenerator`, and **`RPAlgorithmCore` (Aug 2025)** - unified RP algorithm service providing centralized fatigue analysis, volume calculations, and auto-regulation logic. Key algorithm implementations include RP-based auto-regulation, volume landmark calculations (MV, MEV, MAV, MRV), progressive overload, phase transition logic, and systemic fatigue monitoring - all now consolidated through the unified core service.

### Key Features & Implementations
- **iOS-style Notification System**: Comprehensive system with features like drag-to-dismiss, auto-hide, action buttons, and native animations.
- **Enhanced Workout Execution System**: Features enhanced rest timer animations, dedicated auto-regulation feedback, progress save indicator, and automatic set completion saving. Includes comprehensive CSS animation system.
- **User-Controlled Settings System**: Comprehensive workout settings interface allowing users to control RP auto-regulation feedback and other workout features.
- **Mesocycle Management**: Supports flexible training day allocation, multi-select workout template assignment, and template reusability, handling mesocycle volume progression.
- **Training Template Auto-Save**: Field-level auto-save for training template creation with draft restoration.
- **Automated Macro Adjustment System**: Server-optimized background scheduler that automatically applies RP-based macro adjustments daily.
- **Hybrid Authentication Integration**: Supports both Replit Auth and existing session authentication.
- **Pagination System**: Implemented across exercise library, body tracking records, and nutrition progression for memory optimization.
- **Inline Editing**: Functionality for saved workout template names.
- **UI Simplification**: Meal timing and dietary restrictions sections hidden from user profile page.
- **Training Experience Classification**: AI exercise recommendation system uses research-based experience levels: Beginner, Intermediate, Advanced, Elite.
- **Muscle Group Classification**: Refined muscle group focus options to precise anatomical classifications for improved AI exercise recommendations.
- **Goal Standardization System (Aug 2025)**: Unified goal management with three standardized options (Fat Loss, Muscle Gain, Maintenance) across all components, Goal Synchronization Service ensuring data consistency, and `/api/unified-goals` endpoint as single source of truth.
- **Weight Unit Standardization (Aug 2025)**: Database standardization to metric (kg), UnitConverter utility for consistent display preferences, enhanced weight calculations with 10-14 day averaging periods and data validation filtering. Frontend-backend alignment with simplified body tracking unit toggle (kg ↔ lbs conversion). **Step 6 Complete**: All 71+ LSP errors in server/routes.ts resolved with proper userId type conversions and API data structure validation. **Critical Fix**: Save workout session as template functionality restored (403 error resolved).
- **RP Algorithm Core Unification (Aug 2025)**: **Steps 7-8 Complete** - Created centralized `RPAlgorithmCore` service consolidating duplicate fatigue analysis and volume calculation logic across multiple services. Eliminated code duplication between auto-regulation-algorithms.ts and mesocycle-periodization.ts. Unified feedback scoring algorithms using consistent RP methodology. Fixed all LSP errors in mesocycle-periodization.ts including Map iteration and type conversion issues. All RP calculations now use single source of truth while maintaining backward compatibility. **Final validation confirms successful algorithm integration with zero compilation errors and unified RP methodology implementation.**
- **Systematic LSP Error Resolution (Aug 2025)**: **Steps 9-10 Complete** - Resolved all 49 TypeScript LSP errors in server/routes.ts through systematic userId type conversions (string → number), database query syntax corrections (eq() comparisons), and SQL template literal fixes. **Critical SQL Fix**: Corrected `INTERVAL ${days} DAY` syntax error in RPAlgorithmCore.analyzeFatigue method to `INTERVAL '${days} days'` format. All API routes now properly handle authentication and database operations with zero compilation errors.
- **Calorie Discrepancy Resolution & Message Standardization (Aug 2025)**: **Steps 11-12 Complete** - Fixed calorie inconsistency between Dashboard (2773) and IntegratedNutritionOverview (2840) by correcting API endpoint usage and MacroChart calculation logic. Dashboard now uses API's totalCalories instead of calculating from macros. **Message Standardization**: Verified all toast notifications, error messages, and user-facing text are in English (EN-US) as per project requirements. Translation files preserved for future multi-language support.

### iOS App Development Strategy - Expo Approach
TrainPro implements an **Expo hybrid approach** preserving 100% of existing PWA functionality while adding native iOS capabilities. **Complete Expo configuration exists** in `mobile/` directory with EAS Build setup. Development is on Replit with cloud-based building, **eliminating the need for macOS/Xcode**. Two deployment options available:
- **Expo (Recommended)**: WebView wrapper with EAS Build - 1.5-2 hours, no macOS needed
- **Capacitor (Alternative)**: Native integration - 4-6 hours, requires macOS/Xcode

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