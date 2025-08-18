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
Core services include `NutritionService`, `TrainingService`, `AnalyticsService`, `LoadProgression`, `MesocyclePeriodization`, `TemplateEngine`, `SessionCustomization`, `WorkoutDataProcessor`, and `ShoppingListGenerator`. Key algorithm implementations include RP-based auto-regulation, volume landmark calculations (MV, MEV, MAV, MRV), progressive overload, phase transition logic, and systemic fatigue monitoring.

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

### iOS App Development Strategy - Capacitor.js Approach
TrainPro implements a **Capacitor.js hybrid approach** preserving 100% of existing PWA functionality while adding native iOS capabilities. Development is primarily on Replit, with iOS building and testing on external macOS with Xcode.

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

## Recent Changes
- **Auto-Adjustment Activation Date Tracking Fix (August 18, 2025)**: Fixed issue where system wasn't properly using the activation date for calculating next adjustment dates. System now correctly uses the `updatedAt` timestamp from auto-adjustment settings (when user enabled the feature) as the base date for calculations. This ensures accurate countdown from actual activation date rather than generic future dates.
- **Micronutrient Portion Scaling Fix (August 18, 2025)**: Fixed critical issue where micronutrients weren't scaling proportionally when users adjusted portion sizes. Previously, when portion changed from 100g to 20g, calories adjusted correctly but micronutrients remained at per-100g values. Implemented proper nested object scaling for micronutrient categories (Fat-Soluble Vitamins, Water-Soluble Vitamins, Major Minerals, Trace Minerals) to ensure all nutrients scale proportionally with portion adjustments.
- **AI Nutrition Analysis Accuracy Enhancement (August 18, 2025)**: Resolved critical nutrition label reading errors where AI was reporting incorrect scaled values (535 calories instead of 107). Implemented comprehensive validation system with automatic scaling error detection and correction. Enhanced AI prompts with explicit instructions to read nutrition labels exactly as shown without multiplication or scaling. Added post-processing validation to catch and correct common scaling errors. System now provides accurate nutrition data matching actual label values.
- **Rest Timer FAB Display Fix (August 18, 2025)**: Successfully resolved issue where floating rest timer disappeared from WorkoutExecutionV2 live workout sessions. Removed restrictive conditional rendering that hid the timer when inactive and no time remaining. Timer now always displays during workout execution with both active countdown state and inactive manual-start state. Maintains all functionality including automatic timer start after set completion, manual custom timer setting, drag-and-drop positioning, and perfect circular design with glassmorphism effects.
- **Complete Brand Rebrand to TrainPro (August 14, 2025)**: Successfully rebranded entire application from "FitAI" to "TrainPro" across all platforms and languages. Updated mobile app configuration, web manifest, multi-language support (EN/ES/JA/ZH-CN/DE/ZH-TW), documentation, and Expo deployment settings. Created comprehensive brand guidelines and new visual assets with "FS" logo design. Bundle ID updated to com.flexsync.app for App Store submission.
- **iOS App Store Deployment Preparation - Expo Integration (August 14, 2025)**: Successfully transitioned from Capacitor.js to Expo for simplified iOS App Store deployment. Implemented Expo WebView hybrid approach preserving 100% PWA functionality while enabling native iOS packaging. Key implementations include complete Expo project structure, EAS Build configuration, automated build scripts, and comprehensive deployment documentation. Solution provides 2-hour deployment timeline vs previous complex Xcode configuration requirements.
- **Dark Mode Chart Visibility Fix (August 14, 2025)**: Resolved issue where chart axis text was invisible in dark mode by implementing CSS variables for dynamic color support. Updated all nutrition progression charts to use `var(--gray-600)` instead of fixed gray colors, ensuring proper visibility across light and dark themes.
- **UI Simplification Extension - Dietary Restrictions Section (August 14, 2025)**: Further simplified user profile interface by hiding the dietary restrictions and preferences section per user request. Removed the entire dietary restrictions card component and cleaned up related imports and functions. Focus now entirely on essential profile data (age, height, weight, body fat percentage) for core fitness tracking functionality.
- **Nutrition Progress Chart Enhancement - Average Value Reference Lines (August 14, 2025)**: Enhanced nutrition progression charts by adding horizontal reference lines displaying average values for all chart types. Features include weight chart with average weight (unit-converted), body fat chart with average percentage, calories chart with average daily intake, and macro chart with individual protein/carbs/fat averages. Reference lines use orange dashed styling with positioned labels for clear visual reference against actual data points.
- **Body Tracking Time Format Update (August 14, 2025)**: Updated time display format in body tracking from 'x ago' to 'xd ago' for cleaner, more concise presentation.
- **AI Food Analysis Enhancement (August 18, 2025)**: Completely overhauled AI food analysis system to address accuracy and functionality gaps. Key improvements include: (1) Enhanced ingredient decomposition - AI now breaks down complex foods/dishes into individual components for accurate nutrition calculation, (2) Intelligent unit selection system - AI chooses optimal units based on food type (ml for liquids, g for solids, cups for volume foods, pieces for countable items), (3) Comprehensive micronutrient extraction from all identified food components, (4) Enhanced validation system with reasonableness checks for nutritional values, (5) Support for nutrition label analysis with complete ingredient breakdown, and (6) Improved portion size estimation with context-appropriate units.
- **Nutrition AI Data Quality Calculation Fix (August 18, 2025)**: Fixed incorrect data quality calculation that was showing artificially low completeness scores despite comprehensive micronutrient data. Updated algorithm to properly count meaningful non-null micronutrient values instead of requiring specific hardcoded nutrient names. Maintains threshold of 5 meaningful micronutrients per record for accurate assessment. System now accurately reflects actual data completeness for better AI analysis confidence.
- **Micronutrient Data Logging Verification (August 14, 2025)**: Confirmed AI nutrition analysis correctly detects and logs vitamins and minerals to food entries. System properly saves comprehensive micronutrient data including fat-soluble vitamins, water-soluble vitamins, major minerals, trace minerals, and supplement compounds to database as JSON. Frontend displays "Nutrients" badge for entries with micronutrient data.