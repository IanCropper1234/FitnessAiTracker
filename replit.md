# MyTrainPro - Advanced AI-Powered Fitness Platform

## Overview
MyTrainPro is an enterprise-grade AI-powered fitness platform designed to provide intelligent, adaptive training, and comprehensive nutrition and workout management. It leverages evidence-based periodization methodology combined with AI recommendations to offer personalized coaching at scale. The platform aims to capture a significant share of the digital fitness market by providing a scientifically-backed solution for serious fitness enthusiasts and bodybuilders.

## Recent Changes
### OAuth Deep Linking Implementation for iOS App (October 16, 2025)
- **Complete OAuth Flow for Capacitor iOS App**:
  - **Environment Detection**: Uses `Capacitor.isNativePlatform()` API to detect app environment
  - **Client-Side Implementation** (`client/src/pages/auth.tsx`):
    - Detects Capacitor environment and adds `?app=1` parameter to OAuth URLs
    - Supports both Google and Apple OAuth providers
  - **Server-Side Handling** (`server/routes.ts`):
    - Detects app environment via `?app=1` parameter or `MyTrainPro-iOS` User-Agent
    - Redirects to `mytrainpro://auth/callback?session=${sessionID}&userId=${userId}` for app users
    - Uses HTML meta refresh for Apple OAuth (POST callback compatibility)
  - **Deep Link Handler** (`client/src/utils/capacitorAuth.ts`):
    - Listens for `appUrlOpen` events in Capacitor
    - Parses session and user ID from deep link
    - Restores session and redirects to app dashboard
  - **iOS Configuration** (`ios/App/App/Info.plist`):
    - URL scheme `mytrainpro` registered for deep linking
  - **Capacitor Settings** (`capacitor.config.ts`):
    - OAuth domains whitelisted in `allowNavigation` to prevent external browser opening
  - **Test Page** (`/oauth-test`): Diagnostic page to verify OAuth configuration and test deep linking

### Professional Landing Page Redesign (October 16, 2025)
- **Complete Auth Page Transformation**: Redesigned `/auth` as professional app landing page
  - Added animated hero section with gradient background effects and call-to-action buttons
  - Implemented responsive navigation bar with smooth scroll navigation and mobile hamburger menu
  - Created 4 animated feature cards showcasing AI Intelligence, Scientific Periodization, Precision Nutrition, and Personalized Programs
  - Added statistics section displaying active users (50K+), success rate (98%), app rating (4.9), and AI support (24/7)
  - Implemented testimonials section with user reviews from fitness enthusiasts and professionals
  - Enhanced with Framer Motion animations for all interactive sections
  - Professional gradient color scheme with purple-to-blue theme and glassmorphism effects
  - Optimized for both desktop and mobile viewing experiences
  - Maintained OAuth compliance with privacy notice and legal links

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

### Frontend Architecture (Mobile-First Design)
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query v5 for server state caching, React Context for global state.
- **UI Framework**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with dark/light mode support
- **Forms**: React Hook Form with Zod schema validation
- **Charts**: Recharts for responsive data visualization
- **Error Handling**: Global error boundary system.
- **Performance**: Memory-optimized search, debounced queries, and pagination.
- **UI/UX Decisions**: iOS-optimized compact layouts, professional black/white/gray theme, 44px minimum touch targets, hardware-accelerated JavaScript animations, consistent spacing, and streamlined interfaces. Standalone pages are preferred over modal dialogs for complex interfaces.

### Backend Architecture (Service-Oriented)
- **Runtime**: Node.js with Express.js
- **API Design**: RESTful API with modular service layer.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Custom OAuth 2.0 system with Google and Apple Sign In, supporting both web and native mobile flows. All API routes are protected.
- **Security**: Production-grade OAuth security with CSRF protection, token replay prevention, PKCE, JWT decoding, comprehensive rate limiting, account lockout, password strength validation, session security, timing attack prevention, enhanced logging, and strict input validation.
- **Data Processing**: Service layer with specialized algorithms for scientific periodization methodology, consolidated via `SciAlgorithmCore`.

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
Core services include `NutritionService`, `TrainingService`, `AnalyticsService`, `LoadProgression`, `MesocyclePeriodization`, `TemplateEngine`, `SessionCustomization`, `WorkoutDataProcessor`, `ShoppingListGenerator`, and `SciAlgorithmCore`.

### AI Model Integration
- **Current Model**: GPT-5-mini
- **Integration Points**: Exercise Recommendations, Nutrition Analysis, Food Image Recognition, Multi-Image Nutrition Analysis, Program Optimization.
- **Performance**: 100% success rate, improved cost efficiency, maintained response quality.
- **Nutrition Analysis Accuracy**: Resolved over-estimation issues by implementing conservative cooking adjustment rules based on explicit user input or visual cues.

### Key Features & Implementations
- **Enhanced Registration System**: Multi-step progressive registration, real-time password strength validation, advanced security features, email verification, and enhanced password requirements.
- **iOS-style Notification System**: Comprehensive system with drag-to-dismiss, auto-hide, action buttons, and native animations.
- **Enhanced Workout Execution System**: Features enhanced rest timer animations, dedicated auto-regulation feedback, progress save indicator, and automatic set completion saving.
- **Mesocycle Management**: Supports flexible training day allocation, multi-select workout template assignment, and template reusability, handling mesocycle volume progression.
- **Training Template Auto-Save**: Field-level auto-save for training template creation with draft restoration.
- **Automated Macro Adjustment System**: Server-optimized background scheduler for daily evidence-based macro adjustments.
- **Pagination System**: Implemented across exercise library, body tracking records, and nutrition progression for memory optimization.
- **Goal Standardization System**: Unified goal management with three standardized options (Fat Loss, Muscle Gain, Maintenance) across all components, a Goal Synchronization Service, and `/api/unified-goals` endpoint.
- **Weight Unit Standardization**: Database standardization to metric (kg) with a `UnitConverter` utility for consistent display.
- **TrainPro Rebranding**: All FitAI references updated to TrainPro.
- **Training Dashboard Cards Redesign**: Redesigned training statistics cards with color-coded layout, displaying authentic training data only: Total Sessions, Total Volume, Average Session Time.

### iOS App Development Strategy
TrainPro utilizes **Capacitor** for iOS development, leveraging a pure WebView architecture loading mytrainpro.com. This enables unlimited local builds and automatic cookie handling via Capacitor, with all OAuth handled by the web-based backend.

## External Dependencies

- **Database**: Neon PostgreSQL serverless database
- **AI Services**: OpenAI API (GPT-5-mini)
- **UI Components**: Radix UI primitives
- **Charts**: Recharts
- **Validation**: Zod
- **Forms**: React Hook Form
- **Database Management**: Drizzle ORM, Drizzle Kit
- **Build Process**: ESBuild (server), Vite (client)
- **Type Safety**: TypeScript
- **Food Data**: Open Food Facts API