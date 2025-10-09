# TrainPro - Advanced AI-Powered Fitness Platform

## Overview
TrainPro is an enterprise-grade AI-powered fitness platform providing intelligent, adaptive training through comprehensive nutrition and workout management. It is based on evidence-based periodization methodology, combining scientific training principles with AI recommendations for personalized coaching at scale. The project aims to capture a significant share of the digital fitness market by offering a superior, scientifically-backed alternative, targeting serious fitness enthusiasts and bodybuilders.

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
- **Authentication**: Custom OAuth 2.0 system with Google and Apple Sign In support for complete control over user experience. Hybrid implementation supporting both web and native mobile flows. All API routes protected with automatic user ID extraction.
- **OAuth Implementation**: 
  - **Web Flow**: Server-side OAuth with Passport.js strategies
  - **Mobile Flow**: Native OAuth (expo-auth-session, expo-apple-authentication) → Token Exchange → WebView Session Injection
  - **Callback URL Strategy**: Request-based dynamic callback generation using actual request host headers (x-forwarded-host/host), eliminating environment detection issues. Relative callback paths (`/api/auth/[provider]/callback`) auto-adapt to production/dev/local environments without configuration.
  - **Environment Adaptation**: Automatic detection across all deployment scenarios:
    - Production: `https://fitness-ai-tracker-c0109009.replit.app/api/auth/[provider]/callback`
    - Development: `https://workspace-c0109009.replit.app/api/auth/[provider]/callback`
    - Local: `http://localhost:5000/api/auth/[provider]/callback`
  - **Security**: PKCE with SHA-256 (expo-crypto CSPRNG), state/nonce verification, backend token validation, request-derived callback URLs for domain matching
  - **Mobile Architecture**: Authorization Code + PKCE flow, cryptographic nonce verification, secure session injection via SecureStore
- **Security**: Production-grade OAuth security with CSRF protection (state verification), token replay prevention (nonce validation), PKCE entropy strengthening (expo-crypto), JWT decoding with base64 padding fixes, comprehensive rate limiting, account lockout, password strength validation, session security, timing attack prevention, enhanced logging, and strict input validation.
- **Data Processing**: Service layer with specialized algorithms for scientific periodization methodology, including auto-regulation, volume landmarks, mesocycle periodization, and load progression, consolidated via `SciAlgorithmCore`.

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
Core services include `NutritionService`, `TrainingService`, `AnalyticsService`, `LoadProgression`, `MesocyclePeriodization`, `TemplateEngine`, `SessionCustomization`, `WorkoutDataProcessor`, `ShoppingListGenerator`, and `SciAlgorithmCore` (unified scientific algorithm service for fatigue analysis, volume calculations, and auto-regulation logic).

### AI Model Integration
- **Migration Status**: ✅ COMPLETED - Full GPT-5-mini deployment across all AI services
- **Current Model**: GPT-5-mini (successfully migrated from GPT-4o with 100% success rate)
- **Integration Points**: Exercise Recommendations, Nutrition Analysis, Food Image Recognition, Multi-Image Nutrition Analysis, Program Optimization.
- **Performance Results**: 100% success rate, improved cost efficiency, maintained response quality
- **Migration Benefits**: Reduced AI costs, maintained functionality, enhanced performance monitoring
- **Nutrition Analysis Accuracy Fix** (Oct 2025): Resolved over-estimation issues in AI food analysis by implementing conservative cooking adjustment rules:
  - Only add cooking calories when explicitly mentioned by user or visible in images
  - Removed forced cooking oil/fat additions for all prepared foods
  - Updated validation from "calories > raw baseline" to "calories ≈ visible/mentioned components"
  - Text mode: Only calculates ingredients user explicitly mentions (no assumptions)
  - Image mode: Only adds cooking adjustments when visible OR mentioned by user
  - Portion estimation: Text uses user input or medium default, Image auto-calculates from visual analysis

### Key Features & Implementations
- **Enhanced Registration System**: Multi-step progressive registration, real-time password strength validation, advanced security features (account lockout, rate limiting), email verification, and enhanced password requirements.
- **iOS-style Notification System**: Comprehensive system with features like drag-to-dismiss, auto-hide, action buttons, and native animations.
- **Enhanced Workout Execution System**: Features enhanced rest timer animations, dedicated auto-regulation feedback, progress save indicator, and automatic set completion saving.
- **User-Controlled Settings System**: Comprehensive workout settings interface allowing users to control scientific auto-regulation feedback and other workout features.
- **Mesocycle Management**: Supports flexible training day allocation, multi-select workout template assignment, and template reusability, handling mesocycle volume progression.
- **Training Template Auto-Save**: Field-level auto-save for training template creation with draft restoration.
- **Automated Macro Adjustment System**: Server-optimized background scheduler that automatically applies evidence-based macro adjustments daily.
- **Pagination System**: Implemented across exercise library, body tracking records, and nutrition progression for memory optimization.
- **Inline Editing**: Functionality for saved workout template names.
- **UI Simplification**: Meal timing and dietary restrictions sections hidden from user profile page.
- **Training Experience Classification**: AI exercise recommendation system uses research-based experience levels: Beginner, Intermediate, Advanced, Elite.
- **Muscle Group Classification**: Refined muscle group focus options to precise anatomical classifications for improved AI exercise recommendations.
- **Goal Standardization System**: Unified goal management with three standardized options (Fat Loss, Muscle Gain, Maintenance) across all components, Goal Synchronization Service ensuring data consistency, and `/api/unified-goals` endpoint as single source of truth.
- **Weight Unit Standardization**: Database standardization to metric (kg), UnitConverter utility for consistent display preferences, enhanced weight calculations with averaging periods and data validation filtering. Frontend-backend alignment with simplified body tracking unit toggle (kg ↔ lbs conversion).
- **TrainPro Rebranding**: All FitAI references updated to TrainPro across PWA and mobile applications, including icons, manifest files, service worker, and console logging.
- **Unit Conversion Toggle**: Added kg/lbs conversion toggle button to Recent Entries section in nutrition progression component for weight data.
- **Training Dashboard Cards Redesign**: Redesigned training statistics cards with clean color-coded layout, displaying authentic training data only: Total Sessions, Total Volume, Average Session Time.

### iOS App Development Strategy
TrainPro implements an **Expo hybrid approach** preserving 100% of existing PWA functionality while adding native iOS capabilities. Complete Expo configuration exists in `mobile/` directory with EAS Build setup. Development is on Replit with cloud-based building, eliminating the need for macOS/Xcode.

## External Dependencies

- **Database**: Neon PostgreSQL serverless database
- **AI Services**: OpenAI API (Current: GPT-4o, Planned: GPT-5-mini migration)
- **UI Components**: Radix UI primitives
- **Charts**: Recharts
- **Validation**: Zod
- **Forms**: React Hook Form
- **Database Management**: Drizzle ORM, Drizzle Kit
- **Build Process**: ESBuild (server), Vite (client)
- **Type Safety**: TypeScript
- **Food Data**: Open Food Facts API