/**
 * STRIDE — Google Polyline encoding / decoding.
 *
 * Implements the Google Encoded Polyline Algorithm Format for compact
 * storage of GPS routes.
 *
 * @see https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

/** A simple latitude/longitude pair. */
export interface LatLng {
  latitude: number;
  longitude: number;
}

// ────────────────────────────────────────────────────────────
// Encoding
// ────────────────────────────────────────────────────────────

/**
 * Encode a single coordinate value (lat or lng) into a polyline chunk.
 *
 * @param value - The coordinate value (e.g. -179.98321).
 * @returns Encoded ASCII string chunk.
 */
function encodeValue(value: number): string {
  // Round to 5 decimal places and convert to integer
  let intValue = Math.round(value * 1e5);

  // Two's complement for negatives
  if (intValue < 0) {
    intValue = ~intValue + 1;
    intValue = (intValue << 1) - 1;
  } else {
    intValue = intValue << 1;
  }

  let encoded = '';
  while (intValue >= 0x20) {
    encoded += String.fromCharCode(((intValue & 0x1f) | 0x20) + 63);
    intValue >>= 5;
  }
  encoded += String.fromCharCode(intValue + 63);

  return encoded;
}

/**
 * Encode an array of coordinates into a Google Polyline string.
 *
 * @param points - Ordered array of `{ latitude, longitude }`.
 * @returns Encoded polyline string.
 *
 * @example
 * ```ts
 * const encoded = encodePolyline([
 *   { latitude: 38.5, longitude: -120.2 },
 *   { latitude: 40.7, longitude: -120.95 },
 * ]);
 * ```
 */
export function encodePolyline(points: LatLng[]): string {
  if (points.length === 0) return '';

  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const point of points) {
    encoded += encodeValue(point.latitude - prevLat);
    encoded += encodeValue(point.longitude - prevLng);
    prevLat = point.latitude;
    prevLng = point.longitude;
  }

  return encoded;
}

// ────────────────────────────────────────────────────────────
// Decoding
// ────────────────────────────────────────────────────────────

/**
 * Decode a Google Polyline string into an array of coordinates.
 *
 * @param encoded - The polyline-encoded string.
 * @returns Array of `{ latitude, longitude }` objects.
 *
 * @example
 * ```ts
 * const points = decodePolyline('_p~iF~ps|U_ulLnnqC');
 * // → [{ latitude: 38.5, longitude: -120.2 }, ...]
 * ```
 */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    // Decode latitude delta
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dLat;

    // Decode longitude delta
    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dLng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
}

/**
 * Compute the approximate length (in characters) of an encoded polyline
 * for a given number of points. Useful for estimating storage.
 *
 * @param pointCount - Number of GPS points.
 * @returns Estimated character count (rough upper bound).
 */
export function estimateEncodedSize(pointCount: number): number {
  // Each point encodes 2 values; each value is ~5-7 chars on average.
  return pointCount * 12;
}
