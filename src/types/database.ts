/**
 * STRIDE — Complete Supabase database type definitions.
 * Maps 1:1 with the Postgres schema in supabase/schema.sql.
 */

// ────────────────────────────────────────────────────────────
// Enums
// ────────────────────────────────────────────────────────────

export type RunType = 'free' | 'distance' | 'time' | 'interval' | 'race';
export type RunSource = 'gps' | 'manual' | 'treadmill';
export type GoalPeriod = 'daily' | 'weekly' | 'monthly';
export type GoalMetric = 'distance' | 'duration' | 'runs' | 'calories';
export type BadgeCategory = 'distance' | 'streak' | 'pace' | 'social' | 'special';
export type AiMessageRole = 'user' | 'assistant' | 'system';
export type PlanDifficulty = 'easy' | 'moderate' | 'hard';
export type UnitPreference = 'km' | 'mi';
export type ThemePreference = 'light' | 'dark' | 'system';

// ────────────────────────────────────────────────────────────
// Row types  (what SELECT returns)
// ────────────────────────────────────────────────────────────

/** `public.users` */
export interface UserRow {
  id: string; // uuid, matches auth.users
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  date_of_birth: string | null; // ISO date
  gender: string | null;
  unit_preference: UnitPreference;
  theme_preference: ThemePreference;
  weekly_distance_goal_m: number;
  weekly_run_goal: number;
  notification_enabled: boolean;
  onboarding_completed: boolean;
  timezone: string;
  created_at: string; // ISO timestamp
  updated_at: string;
}

/** `public.runs` */
export interface RunRow {
  id: string; // uuid
  user_id: string;
  started_at: string;
  finished_at: string | null;
  duration_seconds: number;
  distance_meters: number;
  avg_pace_seconds_per_km: number | null;
  best_pace_seconds_per_km: number | null;
  avg_speed_mps: number | null;
  max_speed_mps: number | null;
  calories_burned: number | null;
  elevation_gain_m: number | null;
  elevation_loss_m: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  avg_cadence: number | null;
  route_polyline: string | null; // encoded polyline
  run_type: RunType;
  source: RunSource;
  title: string | null;
  notes: string | null;
  weather_temp_c: number | null;
  weather_condition: string | null;
  weather_humidity: number | null;
  rating: number | null; // 1-5
  perceived_effort: number | null; // 1-10 RPE
  is_race: boolean;
  created_at: string;
  updated_at: string;
}

/** `public.run_splits` */
export interface RunSplitRow {
  id: string;
  run_id: string;
  split_number: number; // 1-indexed
  distance_meters: number; // distance of this split
  duration_seconds: number;
  pace_seconds_per_km: number;
  elevation_change_m: number | null;
  avg_heart_rate: number | null;
  created_at: string;
}

/** `public.route_points` */
export interface RoutePointRow {
  id: string;
  run_id: string;
  sequence: number; // ordering within the run
  latitude: number;
  longitude: number;
  altitude_m: number | null;
  accuracy_m: number | null;
  speed_mps: number | null;
  heading: number | null;
  timestamp: string;
}

/** `public.ai_messages` */
export interface AiMessageRow {
  id: string;
  user_id: string;
  run_id: string | null;
  role: AiMessageRole;
  content: string;
  context_metadata: Record<string, unknown> | null; // JSONB
  created_at: string;
}

/** `public.goals` */
export interface GoalRow {
  id: string;
  user_id: string;
  metric: GoalMetric;
  period: GoalPeriod;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

/** `public.streaks` */
export interface StreakRow {
  id: string;
  user_id: string;
  metric: GoalMetric;
  current_count: number;
  longest_count: number;
  last_activity_date: string; // ISO date
  started_at: string;
  updated_at: string;
}

/** `public.badges` */
export interface BadgeRow {
  id: string;
  user_id: string;
  badge_key: string; // unique badge identifier (e.g. "first_5k")
  category: BadgeCategory;
  earned_at: string;
  run_id: string | null; // the run that triggered this badge
}

/** `public.weekly_plans` */
export interface WeeklyPlanRow {
  id: string;
  user_id: string;
  week_start: string; // ISO date (Monday)
  plan_json: WeeklyPlanPayload; // JSONB
  difficulty: PlanDifficulty;
  total_distance_m: number;
  total_runs: number;
  ai_rationale: string | null;
  accepted: boolean;
  created_at: string;
  updated_at: string;
}

// ────────────────────────────────────────────────────────────
// Insert / Update helpers
// ────────────────────────────────────────────────────────────

/** Fields required to INSERT a user (id comes from auth). */
export type UserInsert = Pick<UserRow, 'id' | 'email'> &
  Partial<Omit<UserRow, 'id' | 'email' | 'created_at' | 'updated_at'>>;

/** Fields allowed when UPDATING a user. */
export type UserUpdate = Partial<
  Omit<UserRow, 'id' | 'email' | 'created_at' | 'updated_at'>
>;

export type RunInsert = Omit<RunRow, 'id' | 'created_at' | 'updated_at'> &
  Partial<Pick<RunRow, 'id'>>;

export type RunUpdate = Partial<
  Omit<RunRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

export type RunSplitInsert = Omit<RunSplitRow, 'id' | 'created_at'>;
export type RoutePointInsert = Omit<RoutePointRow, 'id'>;
export type AiMessageInsert = Omit<AiMessageRow, 'id' | 'created_at'>;
export type GoalInsert = Omit<GoalRow, 'id' | 'created_at' | 'updated_at'>;
export type GoalUpdate = Partial<Omit<GoalRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type StreakInsert = Omit<StreakRow, 'id' | 'updated_at'>;
export type BadgeInsert = Omit<BadgeRow, 'id'>;
export type WeeklyPlanInsert = Omit<WeeklyPlanRow, 'id' | 'created_at' | 'updated_at'>;

// ────────────────────────────────────────────────────────────
// JSON payload shapes (stored inside JSONB columns)
// ────────────────────────────────────────────────────────────

/** Shape of the `plan_json` column in `weekly_plans`. */
export interface WeeklyPlanPayload {
  days: WeeklyPlanDay[];
}

export interface WeeklyPlanDay {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  type: 'rest' | 'easy' | 'tempo' | 'interval' | 'long' | 'recovery';
  distance_m: number;
  duration_minutes: number;
  description: string;
  completed: boolean;
}

// ────────────────────────────────────────────────────────────
// Supabase Database type map (for generic client usage)
// ────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      runs: {
        Row: RunRow;
        Insert: RunInsert;
        Update: RunUpdate;
      };
      run_splits: {
        Row: RunSplitRow;
        Insert: RunSplitInsert;
        Update: Partial<Omit<RunSplitRow, 'id' | 'created_at'>>;
      };
      route_points: {
        Row: RoutePointRow;
        Insert: RoutePointInsert;
        Update: Partial<Omit<RoutePointRow, 'id'>>;
      };
      ai_messages: {
        Row: AiMessageRow;
        Insert: AiMessageInsert;
        Update: Partial<Omit<AiMessageRow, 'id' | 'created_at'>>;
      };
      goals: {
        Row: GoalRow;
        Insert: GoalInsert;
        Update: GoalUpdate;
      };
      streaks: {
        Row: StreakRow;
        Insert: StreakInsert;
        Update: Partial<Omit<StreakRow, 'id' | 'user_id'>>;
      };
      badges: {
        Row: BadgeRow;
        Insert: BadgeInsert;
        Update: never;
      };
      weekly_plans: {
        Row: WeeklyPlanRow;
        Insert: WeeklyPlanInsert;
        Update: Partial<Omit<WeeklyPlanRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
