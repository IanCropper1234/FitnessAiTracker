# MyTrainPro - Advanced AI-Powered Fitness Platform

## Overview
MyTrainPro is an enterprise-grade AI-powered fitness platform that delivers intelligent, adaptive training and comprehensive nutrition/workout management. It utilizes evidence-based periodization and AI recommendations to provide personalized coaching at scale. The platform aims to lead the digital fitness market by offering a scientifically-backed solution for serious fitness enthusiasts and bodybuilders.

## User Preferences
**Communication Language**:
- Agent responses: Traditional Chinese (ZH-TW) for technical explanations and general communication
- Application UI: English (EN-US) for all user interface text, labels, and messages

**Design Preferences:**
- Modern rounded design aesthetic with natural border-radius values
- Standard design system components with appropriate rounded corners
- Animated progress bars should be maintained for visual appeal
- Condensed list view layouts preferred for mobile optimization

**Data Integrity Requirements:**
- All periodization components must use synchronized data sources from weekly goals API
- Adherence percentages, weight changes, and energy levels must match across Training Analysis and Progress Metrics
- Consistent API query parameters required: `/api/weekly-goals?weekStartDate=<specific_week>`
- Goal Standardization: All goal-setting components use only three standardized options: Fat Loss, Muscle Gain, Maintenance
- Single Source of Truth: dietGoals table serves as primary data source with Goal Synchronization Service managing cross-component consistency

**Critical Routing Rules (Wouter):**
- ROUTE ORDER MATTERS: More specific routes must be placed BEFORE more generic routes
- Example: `/edit-template/:id` must come BEFORE `/template/:id` to prevent incorrect matching
- Parameterized routes should be ordered from most specific to least specific
- Always place catch-all routes (`<Route>` without path) at the very end
- Key Route Paths: `/create-training-template`, `/create-mesocycle`, `/exercise-selection/:source?` for standalone exercise selection page
- Scrolling Issues Fix: Modal dialogs with scrolling problems should be converted to standalone pages per user preference for better mobile UX

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query v5 (server state), React Context (global state)
- **UI Framework**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with dark/light mode
- **Forms**: React Hook Form with Zod
- **Charts**: Recharts
- **Error Handling**: Global error boundary system
- **Performance**: Memory-optimized search, debounced queries, pagination
- **UI/UX Decisions**: Mobile-first, iOS-optimized compact layouts, professional black/white/gray theme, 44px minimum touch targets, hardware-accelerated animations, consistent spacing, streamlined interfaces. Standalone pages preferred over modals for complex interactions.
- **PWA Integration**: Implemented PWA install prompt with engagement delay, anti-spam, and platform-specific UI.
- **iOS Specifics**: Capacitor for WebView-based app, addresses safe area padding, native swipe-back gestures, and WKWebView cache clearing.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **API Design**: RESTful API with modular service layer
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom OAuth 2.0 (Google, Apple Sign In) with production-grade security (CSRF, PKCE, rate limiting, account lockout, etc.)
- **Data Processing**: Service layer with `SciAlgorithmCore` for scientific periodization methodology.

### Core Database Schema
28 production tables for user management, nutrition, training, volume management, and analytics.

### API Architecture & Routing Logic
- **Authentication**: `/api/auth/*`
- **Nutrition**: `/api/nutrition/*`, `/api/food/*`
- **Training**: `/api/training/*`
- **Auto-Regulation**: `/api/auto-regulation/*`
- **Analytics**: `/api/analytics/*`
- **Mesocycle Management**: `/api/mesocycles/*`
All core API routes are authenticated.

### Service Layer Architecture
Key services include `NutritionService`, `TrainingService`, `AnalyticsService`, `LoadProgression`, `MesocyclePeriodization`, `TemplateEngine`, `SessionCustomization`, `WorkoutDataProcessor`, `ShoppingListGenerator`, and `SciAlgorithmCore`.

### AI Model Integration
- **Model**: GPT-5-mini
- **Applications**: Exercise recommendations, nutrition analysis, food image recognition, program optimization.
- **Performance**: High success rate, cost-efficient, accurate nutrition analysis with conservative cooking adjustments.

### Key Features
- **Registration**: Multi-step progressive registration, real-time password strength, email verification.
- **Notifications**: iOS-style system with drag-to-dismiss, auto-hide, action buttons.
- **Workout Execution**: Enhanced rest timer, auto-regulation feedback, progress save.
- **Mesocycle Management**: Flexible training day allocation, multi-select template assignment, volume progression.
- **Auto-Save**: Field-level auto-save for training templates.
- **Macro Adjustment**: Server-optimized daily background scheduler for evidence-based macro adjustments.
- **Pagination**: Implemented across various lists for memory optimization.
- **Goal Standardization**: Unified goal management (Fat Loss, Muscle Gain, Maintenance) with a `Goal Synchronization Service`.
- **Unit Standardization**: Database uses metric (kg) with `UnitConverter` utility.
- **Training Dashboard**: Redesigned cards display authentic training data (Total Sessions, Total Volume, Average Session Time).

## External Dependencies

- **Database**: Neon PostgreSQL
- **AI Services**: OpenAI API (GPT-5-mini)
- **UI Components**: Radix UI
- **Charts**: Recharts
- **Validation**: Zod
- **Forms**: React Hook Form
- **Database Management**: Drizzle ORM, Drizzle Kit
- **Build Tools**: ESBuild (server), Vite (client)
- **Type Safety**: TypeScript
- **Food Data**: Open Food Facts API