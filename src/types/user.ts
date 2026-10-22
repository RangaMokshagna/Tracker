/**
 * STRIDE — User-related type definitions.
 */

// ────────────────────────────────────────────────────────────
// Preference types
// ────────────────────────────────────────────────────────────

/** Distance unit preference. */
export type UnitPreference = 'km' | 'mi';

/** App theme preference. */
export type ThemePreference = 'light' | 'dark' | 'system';

// ────────────────────────────────────────────────────────────
// User Profile
// ────────────────────────────────────────────────────────────

/** Application-level user profile (hydrated from Supabase `users` row). */
export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  weightKg: number | null;
  heightCm: number | null;
  dateOfBirth: string | null; // ISO date
  gender: string | null;
  unitPreference: UnitPreference;
  themePreference: ThemePreference;
  weeklyDistanceGoalM: number;
  weeklyRunGoal: number;
  notificationEnabled: boolean;
  onboardingCompleted: boolean;
  timezone: string;
}

// ────────────────────────────────────────────────────────────
// Auth State
// ────────────────────────────────────────────────────────────

/** Shape used by the auth Zustand store. */
export interface AuthState {
  /** Supabase user ID (null when signed out). */
  userId: string | null;
  /** Hydrated profile (null until fetched). */
  profile: UserProfile | null;
  /** True while initial session check is in progress. */
  isLoading: boolean;
  /** True if the user has an active session. */
  isAuthenticated: boolean;
}

// ────────────────────────────────────────────────────────────
// Onboarding
// ────────────────────────────────────────────────────────────

/** Data collected during the onboarding flow. */
export interface OnboardingData {
  displayName: string;
  weightKg: number | null;
  heightCm: number | null;
  dateOfBirth: string | null;
  gender: string | null;
  unitPreference: UnitPreference;
  weeklyDistanceGoalM: number;
  weeklyRunGoal: number;
  notificationEnabled: boolean;
}

// ────────────────────────────────────────────────────────────
// Stats / Aggregates
// ────────────────────────────────────────────────────────────

/** Weekly summary stats shown on the dashboard. */
export interface WeeklySummary {
  totalDistanceM: number;
  totalDurationSeconds: number;
  totalRuns: number;
  totalCalories: number;
  avgPaceSecondsPerKm: number | null;
  longestRunM: number;
}

/** All-time personal bests. */
export interface PersonalBests {
  fastestPace1k: number | null; // seconds per km
  fastestPace5k: number | null;
  fastestPace10k: number | null;
  fastestPaceHalfMarathon: number | null;
  fastestPaceMarathon: number | null;
  longestRunM: number | null;
  longestRunDurationS: number | null;
}
