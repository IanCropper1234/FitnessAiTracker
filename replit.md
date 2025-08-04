# FitAI - Advanced AI-Powered Fitness Platform

## Overview
FitAI is an enterprise-grade AI-powered fitness platform providing intelligent, adaptive training through comprehensive nutrition and workout management. Based on the Renaissance Periodization (RP) methodology, it combines evidence-based training science with AI recommendations for personalized coaching at scale. The project aims to capture a significant share of the digital fitness market by offering a superior, scientifically-backed alternative, targeting serious fitness enthusiasts and bodybuilders.

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