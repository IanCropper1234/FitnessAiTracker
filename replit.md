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
- **Authentication**: Hybrid authentication system supporting both legacy session-based auth and Replit Auth. All API routes are protected with automatic user ID extraction.
- **Security**: Robust security hardening for sensitive operations with dual auth support, including rate limiting, account lockout, password strength validation, session security, timing attack prevention, enhanced logging, stronger encryption, and strict input validation.
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

### Key Features & Implementations

### **Enhanced Registration System (2025 Enterprise Standards)**
**Complete Authentication Security Overhaul**:
- **Multi-Step Progressive Registration**: Email validation → Password creation → Account review → Verification
- **Real-time Password Strength Validation**: NIST-compliant scoring system (0-100), common password detection, entropy analysis
- **Advanced Security Features**: Account lockout (5 attempts/15min), bcrypt salt rounds 12, IP tracking, User-Agent fingerprinting
- **Rate Limiting Protection**: Email-based (5 attempts) and IP-based (10 attempts) rate limiting per 15-minute window
- **Email Verification System**: Secure token generation, 15-minute expiry, attempt tracking, progressive account activation
- **Enhanced Password Requirements**: 12-128 character length, variety scoring, pattern detection, real-time feedback
- **Registration Analytics**: Comprehensive attempt tracking with success/failure rates and security insights
- **Progressive Account Activation**: Users can access basic features before email verification, encouraging engagement

**Frontend UX Enhancements**:
- **Multi-Step Registration Form**: Clean, guided experience with step indicators and validation feedback
- **Real-time Email Validation**: Instant availability checking and format validation with normalized email handling
- **Interactive Password Strength Indicator**: Visual progress bar, detailed requirements checklist, and helpful suggestions
- **Enhanced Error Handling**: User-friendly messages with specific guidance and retry mechanisms
- **Responsive Design**: Mobile-optimized forms with proper touch targets and smooth transitions

**Backend API Architecture**:
- **Comprehensive Validation Endpoints**: `/api/auth/validate-email`, `/api/auth/validate-password`, `/api/auth/verify-email`
- **Enhanced Security Logging**: Detailed registration attempts, failure reasons, and IP tracking for analytics
- **Secure Token Management**: Cryptographically secure token generation with proper expiry and cleanup
- **Database Schema Extensions**: New tables for email verification tokens and registration attempt tracking

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

### iOS App Development Strategy - Expo Approach
TrainPro implements an **Expo hybrid approach** preserving 100% of existing PWA functionality while adding native iOS capabilities. **Complete Expo configuration exists** in `mobile/` directory with EAS Build setup. Development is on Replit with cloud-based building, **eliminating the need for macOS/Xcode**.

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