/**
 * STRIDE — Distance calculation utilities.
 *
 * Uses the Haversine formula for great-circle distance between GPS coordinates.
 */

import type { LocationPoint } from '../types/run';
import type { UnitPreference } from '../types/user';

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────

/** Mean radius of the Earth in metres (WGS-84). */
const EARTH_RADIUS_M = 6_371_008.8;

/** Metres in one kilometre. */
const METRES_PER_KM = 1_000;

/** Metres in one mile. */
const METRES_PER_MILE = 1_609.344;

// ────────────────────────────────────────────────────────────
// Haversine
// ────────────────────────────────────────────────────────────

/**
 * Compute the great-circle distance between two coordinates using the
 * Haversine formula.
 *
 * @param lat1 - Latitude of point 1 (degrees).
 * @param lon1 - Longitude of point 1 (degrees).
 * @param lat2 - Latitude of point 2 (degrees).
 * @param lon2 - Longitude of point 2 (degrees).
 * @returns Distance in **metres**.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

// ────────────────────────────────────────────────────────────
// Unit conversions
// ────────────────────────────────────────────────────────────

/**
 * Convert metres to kilometres.
 *
 * @param m - Distance in metres.
 * @returns Distance in kilometres.
 */
export function metersToKm(m: number): number {
  return m / METRES_PER_KM;
}

/**
 * Convert metres to miles.
 *
 * @param m - Distance in metres.
 * @returns Distance in miles.
 */
export function metersToMiles(m: number): number {
  return m / METRES_PER_MILE;
}

/**
 * Convert kilometres to metres.
 *
 * @param km - Distance in kilometres.
 * @returns Distance in metres.
 */
export function kmToMeters(km: number): number {
  return km * METRES_PER_KM;
}

/**
 * Convert miles to metres.
 *
 * @param mi - Distance in miles.
 * @returns Distance in metres.
 */
export function milesToMeters(mi: number): number {
  return mi * METRES_PER_MILE;
}

// ────────────────────────────────────────────────────────────
// Formatting
// ────────────────────────────────────────────────────────────

/**
 * Format a distance for display, respecting the user's unit preference.
 *
 * @param meters - Distance in metres.
 * @param unit   - Preferred display unit.
 * @param decimals - Decimal places (default 2).
 * @returns Formatted string, e.g. `"5.23 km"` or `"3.25 mi"`.
 */
export function formatDistance(
  meters: number,
  unit: UnitPreference = 'km',
  decimals = 2,
): string {
  const value = unit === 'km' ? metersToKm(meters) : metersToMiles(meters);
  return `${value.toFixed(decimals)} ${unit}`;
}

// ────────────────────────────────────────────────────────────
// Aggregate
// ────────────────────────────────────────────────────────────

/**
 * Compute the cumulative distance across an ordered array of GPS points.
 *
 * @param points - Ordered array of `LocationPoint` values.
 * @returns Total distance in **metres**.
 */
export function totalDistance(points: LocationPoint[]): number {
  if (points.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    total += haversineDistance(
      prev.latitude,
      prev.longitude,
      curr.latitude,
      curr.longitude,
    );
  }
  return total;
}
