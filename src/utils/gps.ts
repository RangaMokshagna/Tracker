/**
 * STRIDE — GPS smoothing with a 1-D Kalman filter.
 *
 * Raw GPS data from mobile devices is noisy. The Kalman filter produces
 * a smoothed latitude/longitude while adapting to the device's reported
 * accuracy. Also includes helpers for accuracy gating and auto-pause
 * detection.
 */

import type { LocationPoint, SmoothedPoint } from '../types/run';

// ────────────────────────────────────────────────────────────
// Kalman Filter state
// ────────────────────────────────────────────────────────────

/**
 * Internal state for the 1-D Kalman filter (applied independently to
 * latitude and longitude).
 */
interface KalmanState {
  /** Current estimate of the value. */
  estimate: number;
  /** Current error covariance. */
  errorCovariance: number;
}

/** Persistent filter state across calls. */
interface GPSFilterState {
  lat: KalmanState;
  lon: KalmanState;
  alt: number | null;
  timestamp: number;
}

/** Process noise — tunes responsiveness vs smoothness. */
const PROCESS_NOISE = 3;

/**
 * Create a new filter state from an initial GPS reading.
 *
 * @param point - First GPS point of the run.
 * @returns Initialised filter state.
 */
export function createFilterState(point: LocationPoint): GPSFilterState {
  const initialCovariance = point.accuracy ** 2;
  return {
    lat: { estimate: point.latitude, errorCovariance: initialCovariance },
    lon: { estimate: point.longitude, errorCovariance: initialCovariance },
    alt: point.altitude,
    timestamp: point.timestamp,
  };
}

/**
 * Apply a single Kalman-filter step to one dimension.
 *
 * @param state       - Previous Kalman state for this dimension.
 * @param measurement - New measured value (e.g. latitude).
 * @param noise       - Measurement noise (accuracy²).
 * @returns Updated Kalman state.
 */
function kalmanStep(
  state: KalmanState,
  measurement: number,
  noise: number,
): KalmanState {
  // Prediction step (no control input — we assume constant position)
  const predictedEstimate = state.estimate;
  const predictedCovariance = state.errorCovariance + PROCESS_NOISE;

  // Update step
  const kalmanGain = predictedCovariance / (predictedCovariance + noise);
  const newEstimate =
    predictedEstimate + kalmanGain * (measurement - predictedEstimate);
  const newCovariance = (1 - kalmanGain) * predictedCovariance;

  return { estimate: newEstimate, errorCovariance: newCovariance };
}

/**
 * Run a raw GPS point through the Kalman filter.
 *
 * Call this for every new GPS reading. It returns a `SmoothedPoint` with
 * filtered coordinates and the incremental distance from the last point.
 *
 * @param raw             - The incoming raw GPS point.
 * @param previousState   - Filter state from the last call (or from `createFilterState`).
 * @param haversineFn     - Haversine function to compute segment distance.
 * @returns A tuple of `[smoothedPoint, updatedFilterState]`.
 */
export function filterGPSPoint(
  raw: LocationPoint,
  previousState: GPSFilterState,
  haversineFn: (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => number,
): [SmoothedPoint, GPSFilterState] {
  const noise = raw.accuracy ** 2;

  const newLat = kalmanStep(previousState.lat, raw.latitude, noise);
  const newLon = kalmanStep(previousState.lon, raw.longitude, noise);

  const distanceFromPrevious = haversineFn(
    previousState.lat.estimate,
    previousState.lon.estimate,
    newLat.estimate,
    newLon.estimate,
  );

  const smoothed: SmoothedPoint = {
    latitude: newLat.estimate,
    longitude: newLon.estimate,
    altitude: raw.altitude,
    accuracy: raw.accuracy,
    speed: raw.speed,
    heading: raw.heading,
    timestamp: raw.timestamp,
    distanceFromPrevious,
  };

  const updatedState: GPSFilterState = {
    lat: newLat,
    lon: newLon,
    alt: raw.altitude,
    timestamp: raw.timestamp,
  };

  return [smoothed, updatedState];
}

// ────────────────────────────────────────────────────────────
// Accuracy gate
// ────────────────────────────────────────────────────────────

/**
 * Determine whether a GPS reading is accurate enough to be used for
 * distance tracking.
 *
 * @param point        - The GPS point to check.
 * @param minAccuracy  - Maximum acceptable accuracy radius in metres
 *                       (lower = more accurate).  Default 20 m.
 * @returns `true` if the point should be accepted.
 */
export function isPointAccurate(
  point: LocationPoint,
  minAccuracy = 20,
): boolean {
  return point.accuracy <= minAccuracy;
}

// ────────────────────────────────────────────────────────────
// Auto-pause detection
// ────────────────────────────────────────────────────────────

/**
 * Detect whether the runner has stopped (for auto-pause).
 *
 * @param speedMps  - Current speed in m/s (from GPS or smoothed).
 * @param threshold - Speed below which the runner is considered stopped.
 *                    Default 0.5 m/s (~1.8 km/h / ~1.1 mph).
 * @returns `true` if the runner appears to have stopped.
 */
export function detectAutoPause(
  speedMps: number | null,
  threshold = 0.5,
): boolean {
  if (speedMps === null) return false;
  return speedMps < threshold;
}

// ────────────────────────────────────────────────────────────
// Re-export filter state type for external consumers
// ────────────────────────────────────────────────────────────

export type { GPSFilterState };
