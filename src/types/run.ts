/**
 * STRIDE — Run-related type definitions used throughout the app.
 */

// ────────────────────────────────────────────────────────────
// Enums
// ────────────────────────────────────────────────────────────

/** Lifecycle states of a tracked run. */
export enum RunStatus {
  /** App is idle — no run in progress. */
  Idle = 'idle',
  /** 3-2-1 countdown before GPS tracking begins. */
  Countdown = 'countdown',
  /** Actively tracking distance / pace / time. */
  Active = 'active',
  /** User paused the run (or auto-pause triggered). */
  Paused = 'paused',
  /** Run finished and saved. */
  Completed = 'completed',
  /** Run discarded by the user (not saved). */
  Discarded = 'discarded',
}

// ────────────────────────────────────────────────────────────
// Location
// ────────────────────────────────────────────────────────────

/** A single GPS point captured during a run. */
export interface LocationPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number; // meters
  speed: number | null; // m/s
  heading: number | null; // degrees
  timestamp: number; // Unix ms
}

/** A GPS point after Kalman-filter smoothing. */
export interface SmoothedPoint extends LocationPoint {
  /** Distance (meters) from the previous smoothed point. */
  distanceFromPrevious: number;
}

// ────────────────────────────────────────────────────────────
// Splits
// ────────────────────────────────────────────────────────────

/** A single km/mi split recorded during a run. */
export interface Split {
  /** 1-indexed split number. */
  number: number;
  /** Distance of this split in meters (usually ~1000 or ~1609). */
  distanceMeters: number;
  /** Duration of this split in seconds. */
  durationSeconds: number;
  /** Pace in seconds per km. */
  paceSecondsPerKm: number;
  /** Elevation change during this split in meters. */
  elevationChangeM: number | null;
  /** Average heart rate during this split. */
  avgHeartRate: number | null;
}

// ────────────────────────────────────────────────────────────
// Live Run Stats
// ────────────────────────────────────────────────────────────

/** Real-time statistics displayed on the run screen. */
export interface RunStats {
  /** Total distance covered so far in meters. */
  distanceMeters: number;
  /** Elapsed active time in seconds (excludes paused time). */
  durationSeconds: number;
  /** Current pace in seconds per km. */
  currentPaceSecondsPerKm: number;
  /** Average pace across the entire run in seconds per km. */
  avgPaceSecondsPerKm: number;
  /** Best (fastest) split pace in seconds per km. */
  bestPaceSecondsPerKm: number | null;
  /** Current speed in m/s. */
  currentSpeedMps: number;
  /** Estimated calories burned. */
  caloriesBurned: number;
  /** Total elevation gain in meters. */
  elevationGainM: number;
  /** Total elevation loss in meters. */
  elevationLossM: number;
  /** Current heart rate from wearable, if available. */
  heartRate: number | null;
  /** Cadence (steps per minute) from wearable, if available. */
  cadence: number | null;
  /** Completed splits so far. */
  splits: Split[];
}

// ────────────────────────────────────────────────────────────
// Active Run State  (Zustand store shape)
// ────────────────────────────────────────────────────────────

/** Full state of an in-progress run, managed by the run Zustand store. */
export interface ActiveRunState {
  /** Current lifecycle status. */
  status: RunStatus;
  /** Countdown remaining (seconds). Only relevant when status === Countdown. */
  countdownRemaining: number;
  /** ISO timestamp of when the run started. */
  startedAt: string | null;
  /** Live computed stats. */
  stats: RunStats;
  /** Raw GPS points collected during the run. */
  routePoints: LocationPoint[];
  /** Whether auto-pause is currently engaged. */
  isAutoPaused: boolean;
  /** Total time spent in pause (seconds). */
  pausedDurationSeconds: number;
  /** UUID for the run (generated at start). */
  runId: string | null;
  /** Run type chosen by the user. */
  runType: 'free' | 'distance' | 'time' | 'interval' | 'race';
  /** Target value for distance/time goals (meters or seconds). */
  targetValue: number | null;
}

// ────────────────────────────────────────────────────────────
// Run Summary  (post-completion)
// ────────────────────────────────────────────────────────────

/** Summary shown on the post-run screen before saving. */
export interface RunSummary {
  runId: string;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  distanceMeters: number;
  avgPaceSecondsPerKm: number;
  bestPaceSecondsPerKm: number | null;
  avgSpeedMps: number;
  maxSpeedMps: number;
  caloriesBurned: number;
  elevationGainM: number;
  elevationLossM: number;
  splits: Split[];
  routePolyline: string; // encoded polyline
  rating: number | null;
  perceivedEffort: number | null;
  title: string | null;
  notes: string | null;
}
