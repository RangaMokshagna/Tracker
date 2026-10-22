# STRIDE ⚡ — Daily Running Tracker & AI Coach

<div align="center">
  <h3>Apple-Level Design • Google-Level Architecture • Nike Run Club-Level Product Thinking</h3>
  <p>A production-ready, cross-platform mobile running tracker with built-in AI coaching, offline-first SQLite synchronization, and high-frequency GPS smoothing.</p>
</div>

---

## 📱 Visual Design System: Dark Glassmorphism + Neon Lime (#BFFF00)
- **Signature Style:** Deep black/charcoal backgrounds (`#0A0A0A`, `#141414`), glass-morphism cards with 12% white opacity and soft borders, illuminated with vibrant Neon Lime accents (`#BFFF00`).
- **Hero Element:** 60fps animated Apple Watch-inspired progress ring showing daily distance completion.
- **Typography & HIG:** Large titles, Dynamic Type, SF-style weights, swipe-back transitions, and 44pt minimum touch targets.
- **Tactile Micro-Interactions:** Haptic feedback on countdown, start, pause, resume, finish, and goal completion.

---

## 🏗️ Architecture & Tech Stack

```
                   ┌──────────────────────────────────────┐
                   │           STRIDE Mobile App          │
                   │   React Native (Expo SDK 58) + TS   │
                   └──────────────────┬───────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            ▼                         ▼                         ▼
   ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
   │  Zustand Stores │       │  Local SQLite   │       │ TanStack Query  │
   │  - Auth/Profile │       │  (Offline-First │       │  (Remote Server │
   │  - Live Active  │       │   Cache & Sync  │       │      State)     │
   │  - Goals/Streak │       │     Queue)      │       └────────┬────────┘
   └─────────────────┘       └────────┬────────┘                │
                                      │                         │
                                      ▼                         ▼
                             ┌──────────────────────────────────────┐
                             │       Supabase Backend Cloud         │
                             │  Postgres with Row-Level Security    │
                             └──────────────────┬───────────────────┘
                                                │
                                                ▼
                             ┌──────────────────────────────────────┐
                             │   Supabase Edge Functions (Deno)     │
                             │  Secure Claude 3.5 Sonnet Integration│
                             │  (API keys never exposed to client)  │
                             └──────────────────────────────────────┘
```

- **Framework:** React Native + Expo SDK 58 + TypeScript (Strict Mode)
- **Navigation:** Expo Router (File-based tabs + stack modals)
- **State Management:** Zustand (Auth, Active GPS run, Goals & Badges, Theme)
- **Server Cache:** TanStack Query v5
- **Sensors & Hardware:**
  - `expo-location` + `expo-task-manager` (Foreground + Background GPS tracking)
  - `expo-haptics` (Tactile button springs & celebration impulses)
  - `expo-notifications` (Daily motivation scheduling & milestone triggers)
- **Maps & Graphics:**
  - `react-native-maps` (Interactive dark route maps with live Polyline)
  - `react-native-svg` + `react-native-reanimated` (60fps hero progress ring & micro-interactions)
- **Storage & Offline:**
  - `expo-sqlite` (Local database for offline-first run logging)
  - Supabase Postgres (Cloud backup with Row-Level Security)
  - NetInfo background sync queue
- **AI Engine:**
  - Claude 3.5 Sonnet called securely via backend edge functions with strict safety disclaimers, rate limiting, and prompt-injection defense

---

## 🏃 Core Feature Set

1. **Live GPS Run Tracker (`/run`)**
   - 3-2-1 pre-run countdown with tactile haptics
   - Giant real-time pace display (`5'23" /km`), duration, distance, calories, elevation gain
   - Live route map with auto-centering and runner dot
   - One-thumb controls (Start, Pause, Resume, Finish)
   - Intelligent auto-pause when runner stops at traffic lights
   - 1-D Kalman filter for smooth, noise-free GPS polyline tracking
2. **Daily Dashboard (`/`)**
   - Hero animated goal ring showing today's distance progress
   - Consecutive running streak counter with fire status
   - Interactive 7-day weekly distance bar chart
   - Recent runs carousel with route details
   - Daily AI coach insight card
3. **Run History & Analytics (`/history` and `/run/[id]`)**
   - Period selector: Week, Month, All Time
   - Aggregate volume, avg pace, and calorie statistics
   - Detailed session view with full polyline map, kilometer split breakdown table, and AI post-run analysis
4. **AI Coach (`/coach`)**
   - Context-aware chat with access to runner's real metrics, streak, and volume
   - Instant prompt pills: *"Analyze my week"*, *"Build next week's plan"*, *"Am I at risk of injury?"*
   - Smart 7-day training schedule generator
   - Injury-risk nudge (warns when mileage spikes > 10% over 4-week baseline)
   - Persistent medical disclaimer
5. **Runner Profile & Settings (`/profile`)**
   - Instant Km vs Miles unit preference toggle
   - Biometrics calibration (Weight, Height)
   - Trophy shelf: Personal Records (Fastest 1k, 5k, 10k, Longest Run)
   - Badges earned grid
   - Data Export: Export all runs to JSON format
   - GDPR Data Deletion: Complete local and cloud data wipe

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo Go on iOS / Android or iOS Simulator / Android Emulator

### 2. Installation
```bash
git clone https://github.com/RangaMokshagna/Tracker.git
cd Tracker/stride # or root if placed at repository root
npm install --legacy-peer-deps
```

### 3. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate your Supabase URL and Anon Key:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 4. Running Locally
```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator / device
npm run android

# Run unit tests
npm test
```

---

## 🛡️ Database & Supabase Edge Functions Setup

### 1. Database Schema
Execute the SQL script located at `supabase/schema.sql` in your Supabase SQL Editor:
- Creates `users`, `runs`, `run_splits`, `route_points`, `ai_messages`, `goals`, `streaks`, `badges`, and `weekly_plans`
- Enables Row Level Security (RLS) policies so runners only access their own data
- Sets up automated updated_at triggers and streak tracking

### 2. Deploying AI Edge Functions
Install Supabase CLI and deploy the Claude API proxy edge functions:
```bash
supabase login
supabase link --project-ref your-project-id

# Set your Anthropic API Key securely on the backend (NEVER in the mobile app)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Deploy the edge functions
supabase functions deploy coach-chat
supabase functions deploy post-run-insight
supabase functions deploy weekly-plan
```

---

## 🧪 Unit Tests

Comprehensive unit tests cover mathematical accuracy for pace, distance, and calorie logic:
```bash
npx jest
```
- `__tests__/pace.test.ts`: Conversions between seconds per km/mi, speed m/s, format strings
- `__tests__/distance.test.ts`: Haversine formula, GPS segment aggregation, unit conversion
- `__tests__/calories.test.ts`: MET metabolic equivalent formulas scaled by runner weight & speed

---

## 📦 Production EAS Build (App Store & Google Play)

### 1. Install EAS CLI & Log In
```bash
npm install -g eas-cli
eas login
```

### 2. Configure Project
```bash
eas build:configure
```

### 3. Build for iOS (App Store / TestFlight)
```bash
# Builds an .ipa archive submitted to TestFlight
eas build --platform ios --profile production
```

### 4. Build for Android (Google Play Store .aab)
```bash
# Builds an Android App Bundle (.aab) ready for Google Play Console
eas build --platform android --profile production
```

### 5. Automated Store Submission
```bash
# Submit to App Store Connect
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

---

## ⚖️ Safety & Medical Disclaimer
STRIDE AI is designed strictly for sports fitness motivation and training progression. It does not provide medical advice, diagnosis, or clinical injury treatment. Runners should always consult a licensed medical professional before beginning or intensifying any cardiovascular training program.
