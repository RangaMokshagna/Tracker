/**
 * STRIDE — Calorie estimation utilities.
 *
 * Uses MET (Metabolic Equivalent of Task) values for running at various
 * paces, scaled by body weight and duration. Values sourced from the
 * 2011 Compendium of Physical Activities.
 */

// ────────────────────────────────────────────────────────────
// MET lookup
// ────────────────────────────────────────────────────────────

/**
 * MET values keyed by approximate speed range (m/s).
 * Each entry: [minSpeedMps, maxSpeedMps, MET].
 */
const MET_TABLE: readonly [number, number, number][] = [
  [0.0, 1.8, 2.0], // walking slowly
  [1.8, 2.2, 3.5], // brisk walking
  [2.2, 2.7, 6.0], // jogging
  [2.7, 3.2, 8.3], // running ~10:00/km
  [3.2, 3.6, 9.0], // running ~8:30/km
  [3.6, 4.0, 9.8], // running ~7:30/km
  [4.0, 4.5, 10.5], // running ~6:30/km
  [4.5, 5.0, 11.5], // running ~5:30/km
  [5.0, 5.5, 12.5], // running ~4:45/km
  [5.5, 6.5, 14.5], // running ~4:00/km
  [6.5, Infinity, 16.0], // sprinting
] as const;

/**
 * Look up the MET value for a given speed.
 *
 * @param speedMps - Running speed in metres per second.
 * @returns The corresponding MET value.
 */
function metForSpeed(speedMps: number): number {
  for (const [min, max, met] of MET_TABLE) {
    if (speedMps >= min && speedMps < max) return met;
  }
  // Fallback (should not happen with the Infinity upper bound)
  return 8.3;
}

// ────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────

/**
 * Estimate calories burned during a run.
 *
 * Formula:
 *   `calories = MET × weightKg × durationHours`
 *
 * The MET value is chosen based on the runner's average speed, so faster
 * paces yield higher calorie estimates.
 *
 * @param weightKg       - Runner's body weight in kg.
 * @param distanceMeters - Total distance covered in metres.
 * @param durationSeconds - Total active time in seconds.
 * @returns Estimated kilocalories burned (rounded to nearest integer).
 */
export function calculateCalories(
  weightKg: number,
  distanceMeters: number,
  durationSeconds: number,
): number {
  if (weightKg <= 0 || distanceMeters <= 0 || durationSeconds <= 0) return 0;

  const speedMps = distanceMeters / durationSeconds;
  const met = metForSpeed(speedMps);
  const durationHours = durationSeconds / 3_600;

  // Standard MET calorie formula
  return Math.round(met * weightKg * durationHours);
}

/**
 * Estimate calories per kilometre for a given weight and pace.
 *
 * Useful for projecting calories during a live run.
 *
 * @param weightKg          - Runner's body weight in kg.
 * @param paceSecondsPerKm  - Current pace in seconds per km.
 * @returns Estimated kcal per kilometre.
 */
export function caloriesPerKm(
  weightKg: number,
  paceSecondsPerKm: number,
): number {
  if (weightKg <= 0 || paceSecondsPerKm <= 0) return 0;

  const speedMps = 1_000 / paceSecondsPerKm;
  const met = metForSpeed(speedMps);
  const durationHours = paceSecondsPerKm / 3_600;

  return Math.round(met * weightKg * durationHours);
}
