# FitAI - Advanced AI-Powered Fitness Platform

## Overview
FitAI is an enterprise-grade AI-powered fitness platform that provides intelligent, adaptive training through comprehensive nutrition and workout management. It is based on the Renaissance Periodization (RP) methodology, combining evidence-based training science with AI recommendations for personalized coaching at scale. The project aims to capture a significant share of the digital fitness market by offering a superior, scientifically-backed alternative, targeting serious fitness enthusiasts and bodybuilders.

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
- **Authentication**: Hybrid authentication system supporting both legacy session-based auth (for existing users) and Replit Auth (for new users). All API routes are protected with automatic user ID extraction for both integer and string ID formats.
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
- **System Performance & Stability Optimization**: Memory-optimized search system with LRU caching, comprehensive error boundary system, and enhanced loading state management.
- **Mesocycle Management**: Supports flexible training day allocation, multi-select workout template assignment, and template reusability. Handles mesocycle volume progression.
- **Training Template Auto-Save**: Field-level auto-save for training template creation with draft restoration.
- **Search Performance Optimization**: Unified memoized filtering, debounced search, and pagination across all searchable components.
- **Special Training Method Integration**: Correct application of load adjustments for special training methods during week advancement (MyoRep Match/No Match, Drop Set, Giant Set).
- **Automated Macro Adjustment System**: Server-optimized background scheduler that automatically applies RP-based macro adjustments daily at 6 AM, reducing manual intervention while maintaining low server impact through efficient scheduling and limited user processing.
- **Hybrid Authentication Integration**: Successfully implemented Replit Auth alongside existing session authentication, preserving all 11 existing users' data while enabling seamless login for new users. Migration completed August 12, 2025 with zero data loss. System fully operational with both authentication methods working correctly.
- **Critical System Restoration (August 12, 2025)**: Successfully resolved major runtime errors including password hash corruption, database schema mismatches, and data retrieval function failures. Fixed getUserId middleware, corrected array handling in activities endpoint, and restored full application functionality with 100% data integrity preservation.
- **Session Management Enhancement (August 12, 2025)**: Fixed session disconnection issues by unifying authentication system to use PostgreSQL-based session storage instead of memory store, preventing session loss on server restarts. Added rolling session extension and PWA-compatible cookie settings for improved user experience.
- **Training Experience Classification Refinement (August 13, 2025)**: Updated AI exercise recommendation system to use research-based experience levels: Beginner (0-6 months), Intermediate (6 months-3 years), Advanced (3-5 years), Elite (5+ years). Enhanced AI prompts with detailed guidelines for each experience level to improve recommendation accuracy and exercise selection appropriateness.

### iOS App Development Strategy - Capacitor.js Approach
FitAI implements a **Capacitor.js hybrid approach** preserving 100% of existing PWA functionality while adding native iOS capabilities. Development is primarily on Replit, with iOS building and testing on external macOS with Xcode.

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