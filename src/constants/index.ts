/**
 * STRIDE — Application-wide constants.
 */

// ────────────────────────────────────────────────────────────
// GPS & Tracking
// ────────────────────────────────────────────────────────────

/** Interval between GPS location updates in milliseconds. */
export const GPS_UPDATE_INTERVAL_MS = 1_000;

/** Minimum distance (metres) between GPS updates to accept a new point. */
export const GPS_MIN_DISTANCE_M = 3;

/**
 * Maximum acceptable GPS accuracy radius (metres).
 * Points with worse accuracy are discarded.
 */
export const GPS_MIN_ACCURACY_M = 20;

/**
 * Speed threshold below which auto-pause engages (m/s).
 * 0.5 m/s ≈ 1.8 km/h ≈ 1.1 mph.
 */
export const AUTO_PAUSE_SPEED_THRESHOLD_MPS = 0.5;

/**
 * Number of consecutive slow readings before auto-pause triggers.
 * Prevents brief pauses at traffic lights from splitting the run.
 */
export const AUTO_PAUSE_DELAY_READINGS = 3;

/** Countdown seconds before a run begins. */
export const RUN_COUNTDOWN_SECONDS = 3;

// ────────────────────────────────────────────────────────────
// Splits
// ────────────────────────────────────────────────────────────

/** Distance per split in metres (1 km). Mile-based is 1609.344. */
export const SPLIT_DISTANCE_KM_M = 1_000;
export const SPLIT_DISTANCE_MI_M = 1_609.344;

// ────────────────────────────────────────────────────────────
// Calories — MET reference values
// ────────────────────────────────────────────────────────────

/**
 * MET values for running at various paces.
 * Key: approximate pace range label.
 * Value: MET multiplier.
 */
export const CALORIE_MET_VALUES: Readonly<Record<string, number>> = {
  'walking_slow': 2.0,
  'walking_brisk': 3.5,
  'jogging': 6.0,
  'running_10min_km': 8.3,
  'running_8min_km': 9.0,
  'running_7min_km': 9.8,
  'running_6min_km': 10.5,
  'running_5min_km': 11.5,
  'running_4min_km': 12.5,
  'running_3min_km': 14.5,
  'sprinting': 16.0,
} as const;

// ────────────────────────────────────────────────────────────
// Goals & Streaks
// ────────────────────────────────────────────────────────────

/** Default daily distance goal in metres (5 km). */
export const DEFAULT_DAILY_GOAL_M = 5_000;

/** Default weekly distance goal in metres (20 km). */
export const DEFAULT_WEEKLY_GOAL_M = 20_000;

/** Default weekly run count goal. */
export const DEFAULT_WEEKLY_RUN_GOAL = 3;

// ────────────────────────────────────────────────────────────
// AI Coach
// ────────────────────────────────────────────────────────────

/** Maximum messages per hour to the AI coach (rate-limiting). */
export const AI_RATE_LIMIT_PER_HOUR = 30;

/** Maximum chat messages retained in a single conversation context. */
export const MAX_CHAT_HISTORY = 50;

/** Maximum recent runs sent as AI context. */
export const AI_MAX_CONTEXT_RUNS = 10;

// ────────────────────────────────────────────────────────────
// Sync
// ────────────────────────────────────────────────────────────

/** Maximum retry attempts for a failed sync item before it is abandoned. */
export const SYNC_MAX_RETRIES = 5;

/** Interval between sync attempts in milliseconds (30 seconds). */
export const SYNC_INTERVAL_MS = 30_000;

// ────────────────────────────────────────────────────────────
// UI
// ────────────────────────────────────────────────────────────

/** Duration of the haptic feedback on run start/stop (ms). */
export const HAPTIC_DURATION_MS = 100;

/** Map zoom level for the run detail screen. */
export const MAP_DEFAULT_ZOOM = 14;

/** Animation duration for screen transitions (ms). */
export const TRANSITION_DURATION_MS = 300;
