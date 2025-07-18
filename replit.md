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

#### Nutrition Module (RP Diet Coach Inspired)
**Current Implementation:**
- AI-powered food recognition and calorie calculation
- Macro tracking (protein, carbs, fat) with visual charts
- Meal logging with barcode scanning capability
- Goal setting and progress tracking
- Daily nutrition summaries and adherence monitoring

**Missing RP Diet Coach Features:**
- Personalized meal timing based on training schedule and lifestyle
- Weekly macro adjustments based on progress and metabolism changes
- Meal-by-meal macro breakdown with specific food recommendations
- Automatic shopping list generation from meal plans
- Diet adaptation algorithms that respond to weekly weigh-ins
- Food database categorization (protein sources, carb sources, fat sources)
- Macro flexing between meals for social eating
- Restaurant integration and dining out recommendations
- Sleep/wake schedule integration for meal timing
- Dietary filter support (vegetarian, vegan, paleo, gluten-free, etc.)

#### Training Module (RP Hypertrophy App Inspired)
**Current Implementation:**
- Evidence-based workout programming
- Auto-regulation feedback system for training adjustments
- Exercise database with multi-language translations
- Workout session tracking with sets, reps, and weight logging
- Training statistics and progress visualization

**Missing RP Training Coach Features:**
- Volume landmarks methodology (MV, MEV, MAV, MRV) implementation
- Mesocycle periodization with accumulation and deload phases
- 45+ pre-built training templates with body part specialization
- Automated progressive overload calculations
- Pump and soreness feedback integration for volume adjustments
- 250+ exercise technique videos
- Secondary progression options (weight vs. reps focus)
- Volume progression algorithms based on individual recovery
- Training template customization with exercise swapping
- RPE (Rate of Perceived Exertion) and RIR (Reps in Reserve) tracking
- Systemic fatigue monitoring and deload recommendations

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

### Required Database Schema Enhancements for RP Methodology

**Nutrition Module Enhancements:**
- `meal_plans` table: structured meal planning with timing
- `food_categories` table: protein/carb/fat source classification
- `weekly_nutrition_goals` table: adaptive macro adjustments
- `diet_phases` table: cutting/bulking/maintenance phases
- `meal_timing_preferences` table: training/sleep schedule integration

**Training Module Enhancements:**
- `volume_landmarks` table: MV/MEV/MAV/MRV per muscle group per user
- `mesocycles` table: training block management
- `training_templates` table: pre-built program library
- `workout_feedback` table: pump/soreness/RPE tracking
- `deload_phases` table: automated recovery periods
- `muscle_groups` table: comprehensive anatomy mapping
- `exercise_progressions` table: load/volume advancement tracking

### Future Integrations
The codebase is structured to support planned n8n workflow automation for:
- Automated nutrition report generation
- Multi-language content translation pipelines
- Email notifications and user engagement workflows
- Batch processing of AI-generated content

### iOS Deployment Strategy (Decision Pending)
**Current Compatibility Status**: ✅ Fully Compatible with iOS
- React + TypeScript web app works perfectly on iOS Safari
- PWA capabilities allow "installation" on iOS devices
- Responsive design with touch-optimized UI components
- Apple ID authentication already integrated
- All current features functional on iOS devices

**iOS Deployment Options Evaluated**:
1. **Progressive Web App (PWA)** - Recommended first approach
   - Deploy current web app to Replit Deployments
   - Users add to home screen via Safari
   - 90% native app experience with zero additional development
   - Maintains current development speed and feature set

2. **Native iOS App** - Future enhancement option
   - Wrap web app with Capacitor or Cordova
   - Deploy to App Store with minimal code changes
   - Access to additional native iOS features

3. **React Native** - Complete rebuild (not recommended)
   - Would require rebuilding entire frontend
   - Not cost-effective given current advanced web implementation

**Decision Point**: Choose iOS deployment strategy after completing core RP methodology implementation (Phase 2-3 of MVP Development Plan)

## MVP Development Plan (Enhanced RP Methodology)

### Phase 1: Core Foundation (✅ Completed)
- ✅ Authentication system with session management
- ✅ Multi-language support (6 languages)
- ✅ PostgreSQL database with Drizzle ORM
- ✅ Basic nutrition logging with AI analysis
- ✅ Responsive UI with dark/light themes

### Phase 2: Enhanced Nutrition Module (✅ 75% Complete)
**Goal**: Implement RP Diet Coach methodology for sophisticated nutrition coaching

**Completed Features:**
1. **Meal Timing & Scheduling** ✅
   - Training schedule integration for pre/post workout nutrition ✅
   - Sleep/wake schedule based meal timing ✅
   - Personalized meal frequency (3-6 meals/day) ✅
   - RP nutrient timing principles visualization ✅
   - Smart macro distribution across scheduled meals ✅

2. **Food Database Enhancement with RP Categorization** ✅
   - AI-powered food categorization (protein/carb/fat/mixed sources) ✅
   - Renaissance Periodization methodology integration ✅
   - Meal suitability analysis (pre-workout, post-workout, regular, snack) ✅
   - Enhanced Open Food Facts API with smart categorization ✅
   - Food filtering by macro category and meal timing ✅
   - Visual RP categorization badges in food search results ✅
   - Real-time food recommendations based on meal timing ✅

3. **Advanced Macro Management** ✅
   - Weekly macro adjustments based on progress tracking and RP methodology ✅
   - Adherence percentage calculation and energy/hunger level monitoring ✅
   - Automated calorie adjustments for cutting/bulking phases ✅
   - Renaissance Periodization-based adjustment algorithms ✅
   - Weekly nutrition goals tracking with detailed metrics ✅
   - Advanced macro management interface with progress analysis ✅

**Pending Features (Advanced RP Diet Coach):**
4. **Advanced Meal Distribution & Flexing**
   - Meal-by-meal macro breakdown with intelligent distribution algorithms
   - Macro flexing between meals for social eating scenarios
   - Dynamic meal adjustments and real-time rebalancing

5. **Automated Diet Phase Management**
   - Phase transition algorithms (cutting/bulking/maintenance)
   - Metabolic adaptation detection and diet break recommendations
   - Reverse dieting protocols with gradual calorie increases

6. **Enhanced Shopping & Meal Planning**
   - Automatic shopping list generation from meal plans
   - Restaurant integration and dining out recommendations
   - Advanced food database categorization improvements

7. **Social & Lifestyle Features**
   - Macro banking system for flexible daily allocation
   - Social eating calculator for restaurant meal planning
   - Travel mode with simplified tracking options

### Phase 3: RP Training Module Implementation (🔄 In Progress)
**Goal**: Build comprehensive hypertrophy training system using RP methodology

**Step 1: Basic Training Framework (✅ Completed)**
1. **Exercise Database & Muscle Group Mapping** ✅
   - Comprehensive exercise library with muscle group targeting ✅
   - Movement pattern categorization (compound, isolation, etc.) ✅
   - Equipment requirements and substitutions ✅
   - Enhanced search functionality across all exercise attributes ✅
   - Exercise selection system with "Add to Workout" functionality ✅

2. **Basic Workout Session Tracking** ✅
   - Sets, reps, weight, and RPE logging ✅
   - Rest period timing and recommendations ✅
   - Session completion tracking ✅
   - Workout session creation from selected exercises ✅
   - Real-time workout execution with progress tracking ✅
   - Complete end-to-end workout flow from exercise selection to completion ✅

**Step 2: Volume Landmarks System**
3. **Volume Landmark Framework**
   - MV (Maintenance Volume) calculations per muscle group
   - MEV (Minimum Effective Volume) starting points
   - MAV (Maximum Adaptive Volume) progression zones
   - MRV (Maximum Recoverable Volume) limits

**Step 3: Auto-Regulation System**
4. **Feedback Integration**
   - Pump quality feedback (1-10 scale)
   - Soreness tracking (DOMS monitoring)
   - RPE/RIR integration for load progression
   - Systemic fatigue indicators

**Step 4: Periodization & Templates**
5. **Mesocycle Periodization**
   - 3-12 week accumulation phases
   - Automated deload week programming
   - Volume progression algorithms
   - Fatigue accumulation monitoring

6. **Training Templates**
   - 20+ pre-built mesocycle templates
   - Body part specialization programs
   - Training frequency options (3-6x/week per muscle)
   - Exercise substitution system

### Phase 4: Advanced Features
1. **AI-Powered Coaching**
   - Personalized program modifications
   - Progress prediction algorithms
   - Plateau detection and solutions

2. **Analytics & Reporting**
   - Training volume analytics
   - Nutrition adherence reports
   - Progress photography integration
   - Performance trend analysis

## Recent Changes

### January 18, 2025 (Latest)
- ✅ **COMPLETED STEP 1**: Basic Training Framework with full workout session functionality
- ✅ Enhanced Exercise Library with comprehensive search across names, muscle groups, equipment, and movement patterns
- ✅ Implemented "Add to Workout" functionality with visual selection feedback and management
- ✅ Created WorkoutSessionCreator component for converting selected exercises into structured workout sessions
- ✅ Built WorkoutExecution component with real-time set tracking, RPE logging, and rest timer functionality
- ✅ Added complete database storage support for workout sessions and workout exercises
- ✅ Integrated workout session management in Training Dashboard with start/continue/complete workflow
- ✅ Implemented end-to-end workout flow: Exercise Selection → Session Creation → Workout Execution → Completion
- ✅ Added training statistics integration and session history tracking
- ✅ **Ready for Step 2**: Volume Landmarks System can now be implemented with solid foundation

### January 18, 2025 (Earlier)
- ✅ Enhanced Meal Schedule tab with comprehensive RP Diet Coach methodology
- ✅ Added Pre/Post/Regular workout meal timing principles visualization
- ✅ Integrated smart macro distribution across scheduled meals with RP optimization
- ✅ Added comprehensive nutrient timing guidance (pre-workout: higher carbs, post-workout: high protein)
- ✅ Seamlessly integrated without affecting existing Diet Builder functionality
- ✅ Fixed type conversion errors for database decimal values in meal distribution display
- ✅ Enhanced meal timing configuration summary with workout schedule integration
- ✅ **MAJOR**: Implemented Food Database Enhancement with RP categorization system
- ✅ Enhanced OpenAI analysis to include food categorization and meal suitability
- ✅ Added smart food filtering by macro category (protein/carb/fat/mixed) and meal timing
- ✅ Enhanced food search results with RP categorization badges and meal timing indicators
- ✅ Preserved existing API + AI architecture while adding sophisticated RP methodology
- ✅ Added food recommendations API endpoint with personalized RP-based suggestions
- ✅ Updated database schema to store food categorization data without breaking changes
- ✅ **MAJOR**: Implemented Advanced Macro Management system with RP methodology
- ✅ Created weekly macro adjustment algorithms based on adherence and progress metrics
- ✅ Added comprehensive progress tracking with energy/hunger levels and weight change analysis
- ✅ Built RP Coach tab in nutrition interface with sophisticated weekly adjustment recommendations
- ✅ Enhanced database schema with macro distribution and flexibility rule tables
- ✅ Integrated real-time progress analysis with automated calorie adjustment suggestions

### January 17, 2025 (Earlier)
- ✅ Enhanced macro adjustment system with 1% precision increments (changed from 5%)
- ✅ Enabled macro adjustments for both auto-regulation ON and OFF modes
- ✅ Implemented dynamic calorie adjustment system - target calories update based on macro distribution
- ✅ Added real-time database synchronization between Diet Builder and Dashboard components
- ✅ Fixed data sync issues with cache invalidation for nutrition-related queries
- ✅ Added debounced database saves (500ms) to prevent excessive API requests
- ✅ Enhanced macro adjustment UI with individual calorie breakdown per macro
- ✅ Evaluated iOS compatibility - confirmed full compatibility with PWA deployment option
- ✅ Updated project documentation with iOS deployment strategy for future decision

### January 17, 2025 (Earlier)
- ✅ Created dedicated Profile page accessible from bottom navigation
- ✅ Moved Profile functionality from Nutrition tab to standalone page
- ✅ Added comprehensive user profile management with BMI calculation
- ✅ Implemented bidirectional weight synchronization between Profile and Body Tracking
- ✅ Fixed profile validation errors for proper data type handling
- ✅ Added user info card with sign-out functionality
- ✅ Restructured nutrition module with comprehensive 5-tab layout:
  - Macro Overview: Daily macro tracking with charts and progress bars
  - Daily Food Log: Real-time meal logging with Open Food Facts integration
  - Diet Builder: Meal planning with unified food database search
  - Body Tracking: Weight, body measurements, and body fat percentage tracking
  - Nutrition Progression: Charts and trends with adjustable time ranges
- ✅ Integrated Open Food Facts API for real food database (no API key required)
- ✅ Added body metrics tracking with weight (kg/lbs) and body measurements (cm/inches)
- ✅ Created nutrition progression analytics with weight, body fat, and macro trends
- ✅ Updated database schema with bodyMetrics table and progression tracking
- ✅ Fixed tab layout overlap issues and removed duplicate macro overview sections
- ✅ Enhanced responsive design for mobile and desktop viewing
- ✅ Implemented unified food search across all nutrition components
- ✅ Added smart Quick Add functionality with pattern recognition for frequently logged foods
- ✅ Implemented Copy Meals feature with selective meal type copying from previous dates
- ✅ Created intelligent food logging suggestions based on 30-day eating patterns
- ✅ Enhanced Daily Food Log with batch operations and user convenience features
- ✅ Integrated Diet Builder goals with Macro Overview and Daily Food Log
- ✅ Added real-time remaining calories and macros display across nutrition tabs
- ✅ Synchronized diet targets between Diet Builder and food tracking components
- ✅ Color-coded remaining macro indicators for better user guidance

### January 16, 2025
- ✅ Rebuilt complete authentication system with proper error handling
- ✅ Fixed API request method signature issues for POST/PUT operations
- ✅ Implemented clean black & white design with dark mode as default
- ✅ Added responsive dashboard with macro tracking charts and progress bars
- ✅ Integrated multilingual support for 6 languages without flag emojis
- ✅ Connected OpenAI API for smart nutrition analysis capabilities
- ✅ Established RP-inspired training foundation with auto-regulation system
- ✅ Built comprehensive component architecture with theme and language providers
- ✅ Verified authentication flow working end-to-end
- ✅ Integrated PostgreSQL database with Drizzle ORM
- ✅ Migrated from in-memory storage to persistent database storage
- ✅ Pushed complete database schema with all tables and relationships
- ✅ Built complete AI-powered nutrition logging system
- ✅ Integrated OpenAI for smart food recognition and macro analysis
- ✅ Created comprehensive nutrition tracking interface with charts
- ✅ Added meal categorization and food log management
- ✅ Fixed React export errors and resolved build issues
- ✅ Analyzed RP Training Coach and RP Diet Coach methodology
- ✅ Updated project plan with comprehensive RP feature requirements

## Key Architectural Decisions

1. **Monorepo Structure**: Single repository with shared TypeScript schemas between client and server
2. **Type Safety**: End-to-end TypeScript with Zod validation for runtime type checking
3. **Component Architecture**: Modular React components with proper separation of concerns
4. **Database Design**: Normalized schema with proper foreign key relationships and indexing
5. **API Design**: RESTful endpoints with consistent error handling and response formats
6. **Internationalization**: Built-in from the start with database-stored translations for dynamic content
7. **Authentication Flow**: Session-based auth with bcrypt hashing and proper error handling