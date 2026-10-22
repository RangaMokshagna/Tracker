/**
 * STRIDE — Pace calculation utilities.
 *
 * All pace values are expressed as **seconds per unit** (km or mi).
 * All speed values are **metres per second** (m/s).
 */

import type { UnitPreference } from '../types/user';

/** Metres in one kilometre. */
const METRES_PER_KM = 1_000;
/** Metres in one mile. */
const METRES_PER_MILE = 1_609.344;

// ────────────────────────────────────────────────────────────
// Core conversions
// ────────────────────────────────────────────────────────────

/**
 * Calculate pace in seconds per unit (km or mi).
 *
 * @param distanceMeters  - Total distance in metres.
 * @param durationSeconds - Total elapsed time in seconds.
 * @param unit            - User's preferred unit.
 * @returns Seconds per km or seconds per mile.  Returns `0` if distance is 0.
 */
export function calculatePace(
  distanceMeters: number,
  durationSeconds: number,
  unit: UnitPreference = 'km',
): number {
  if (distanceMeters <= 0) return 0;

  const divisor = unit === 'km' ? METRES_PER_KM : METRES_PER_MILE;
  const units = distanceMeters / divisor;
  return durationSeconds / units;
}

/**
 * Format a pace value (seconds per unit) into a human-readable `"M:SS"` string.
 *
 * @param secondsPerUnit - Pace in seconds per km or mile.
 * @returns Formatted string, e.g. `"5:23"`.
 */
export function formatPace(secondsPerUnit: number, unit?: UnitPreference): string {
  if (secondsPerUnit <= 0 || !Number.isFinite(secondsPerUnit)) return '--:--';

  const minutes = Math.floor(secondsPerUnit / 60);
  const seconds = Math.round(secondsPerUnit % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate speed in metres per second.
 *
 * @param distanceMeters  - Distance in metres.
 * @param durationSeconds - Duration in seconds.
 * @returns Speed in m/s. Returns `0` if duration is 0.
 */
export function calculateSpeed(
  distanceMeters: number,
  durationSeconds: number,
): number {
  if (durationSeconds <= 0) return 0;
  return distanceMeters / durationSeconds;
}

// ────────────────────────────────────────────────────────────
// Pace ↔ Speed
// ────────────────────────────────────────────────────────────

/**
 * Convert pace (seconds per km) to speed (m/s).
 *
 * @param paceSecondsPerKm - Pace in seconds per kilometre.
 * @returns Speed in m/s. Returns `0` for invalid input.
 */
export function paceToSpeed(paceSecondsPerKm: number): number {
  if (paceSecondsPerKm <= 0) return 0;
  return METRES_PER_KM / paceSecondsPerKm;
}

/**
 * Convert speed (m/s) to pace (seconds per km).
 *
 * @param speedMps - Speed in metres per second.
 * @returns Pace in seconds per km. Returns `0` for invalid input.
 */
export function speedToPace(speedMps: number): number {
  if (speedMps <= 0) return 0;
  return METRES_PER_KM / speedMps;
}

/**
 * Convert pace between km and mile units.
 *
 * @param paceSeconds - Pace in seconds per current unit.
 * @param from        - Current unit.
 * @param to          - Target unit.
 * @returns Converted pace in seconds per target unit.
 */
export function convertPaceUnit(
  paceSeconds: number,
  from: UnitPreference,
  to: UnitPreference,
): number {
  if (from === to) return paceSeconds;
  // pace_per_mi = pace_per_km × (mi_in_metres / km_in_metres)
  const ratio = METRES_PER_MILE / METRES_PER_KM;
  return from === 'km' ? paceSeconds * ratio : paceSeconds / ratio;
}
