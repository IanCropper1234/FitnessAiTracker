# FitAI - Fitness & Nutrition App

## Overview

FitAI is a comprehensive fitness and nutrition tracking application built with modern web technologies. The app combines evidence-based training and nutrition coaching powered by Renaissance Periodization methodology with AI-driven features. It supports multi-language functionality and provides personalized workout and meal planning based on user goals and auto-regulation feedback.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state, React Context for global state (theme, language)
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **API Pattern**: RESTful API with structured route handlers
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with bcrypt password hashing
- **External APIs**: OpenAI GPT-4o integration for nutrition analysis and training recommendations

### Key Components

#### User Management
- Email and Apple ID authentication support
- User profiles with fitness goals, activity levels, and dietary restrictions
- Multi-language support (English, Spanish, Japanese, Chinese Simplified/Traditional, German)
- Theme switching (light/dark mode)

#### Nutrition Module
- AI-powered food recognition and calorie calculation
- Macro tracking (protein, carbs, fat) with visual charts
- Meal logging with barcode scanning capability
- Goal setting and progress tracking
- Daily nutrition summaries and adherence monitoring

#### Training Module
- Evidence-based workout programming
- Auto-regulation feedback system for training adjustments
- Exercise database with multi-language translations
- Workout session tracking with sets, reps, and weight logging
- Training statistics and progress visualization

#### Internationalization
- i18next for translation management
- Automatic language detection based on browser settings
- Exercise and food name translations stored in database
- AI-generated content localization

## Data Flow

1. **Authentication Flow**: Users register/login → session stored → profile created with defaults
2. **Nutrition Flow**: Food input → AI analysis → macro calculation → database storage → dashboard updates
3. **Training Flow**: Workout planning → session tracking → auto-regulation feedback → AI-driven adjustments
4. **Data Synchronization**: Real-time updates using React Query with automatic cache invalidation

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **AI Services**: OpenAI API for nutrition analysis and training recommendations
- **UI Components**: Radix UI primitives for accessibility
- **Charts**: Recharts for data visualization
- **Validation**: Zod for schema validation
- **Forms**: React Hook Form with Zod resolvers

### Development Tools
- **Database Management**: Drizzle Kit for migrations and schema management
- **Build Process**: ESBuild for server bundling, Vite for client bundling
- **Type Safety**: TypeScript across frontend, backend, and shared schemas

## Deployment Strategy

### Development Environment
- Vite dev server with hot module replacement
- Express server with development middleware
- Automatic database schema pushing via Drizzle
- Replit integration with cartographer for code mapping

### Production Build
- Client: Vite builds optimized React bundle to `dist/public`
- Server: ESBuild bundles Express app to `dist/index.js`
- Static file serving for production assets
- Environment-based configuration for database and API keys

### Database Strategy
- PostgreSQL with connection pooling via Neon serverless
- Schema-first approach with Drizzle ORM
- Automated migrations through `drizzle-kit push`
- Type-safe database operations with full TypeScript integration

### Future Integrations
The codebase is structured to support planned n8n workflow automation for:
- Automated nutrition report generation
- Multi-language content translation pipelines
- Email notifications and user engagement workflows
- Batch processing of AI-generated content

## Key Architectural Decisions

1. **Monorepo Structure**: Single repository with shared TypeScript schemas between client and server
2. **Type Safety**: End-to-end TypeScript with Zod validation for runtime type checking
3. **Component Architecture**: Modular React components with proper separation of concerns
4. **Database Design**: Normalized schema with proper foreign key relationships and indexing
5. **API Design**: RESTful endpoints with consistent error handling and response formats
6. **Internationalization**: Built-in from the start with database-stored translations for dynamic content