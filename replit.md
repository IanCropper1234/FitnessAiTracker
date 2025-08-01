# FitAI - Advanced AI-Powered Fitness Platform

## Overview

FitAI is a production-ready, enterprise-grade fitness platform that delivers intelligent, adaptive training through comprehensive nutrition and workout management. Built using Renaissance Periodization (RP) methodology, the platform combines evidence-based training science with AI-powered recommendations to provide personalized coaching at scale.

FitAI's vision is to provide intelligent, adaptive training through comprehensive nutrition and workout management, making personalized, evidence-based fitness coaching accessible at scale. The project aims to capture a significant share of the digital fitness market by offering a superior, scientifically-backed alternative to generic fitness applications, catering to serious fitness enthusiasts and bodybuilders.

## User Preferences

Preferred communication style: Simple, everyday language.

**Design Preferences:**
- Sharp corner design aesthetic (border-radius: 0) - completely implemented across entire UI system
- No rounded elements anywhere in the interface - user strongly prefers square corners
- Animated progress bars should be maintained for visual appeal
- Condensed list view layouts preferred for mobile optimization

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