import {
  haversineDistance,
  metersToKm,
  metersToMiles,
  formatDistance,
  totalDistance,
} from '../src/utils/distance';

describe('Distance Utilities', () => {
  describe('haversineDistance', () => {
    it('returns 0 for the same point', () => {
      const d = haversineDistance(37.7749, -122.4194, 37.7749, -122.4194);
      expect(d).toBeCloseTo(0, 1);
    });

    it('calculates accurate distance between known coordinates (SF to Oakland ~13.5 km)', () => {
      // San Francisco (37.7749, -122.4194) to Oakland (37.8044, -122.2712)
      const d = haversineDistance(37.7749, -122.4194, 37.8044, -122.2712);
      expect(d).toBeGreaterThan(13000);
      expect(d).toBeLessThan(14000);
    });
  });

  describe('conversions', () => {
    it('converts meters to km', () => {
      expect(metersToKm(5000)).toBe(5);
      expect(metersToKm(10250)).toBe(10.25);
    });

    it('converts meters to miles', () => {
      expect(metersToMiles(1609.344)).toBeCloseTo(1.0, 3);
      expect(metersToMiles(5000)).toBeCloseTo(3.1068, 2);
    });

    it('formats distance string according to unit preference', () => {
      expect(formatDistance(5000, 'km')).toBe('5.00 km');
      expect(formatDistance(1609.344, 'mi')).toBe('1.00 mi');
    });
  });

  describe('totalDistance', () => {
    it('sums distance across an array of GPS points', () => {
      const points = [
        { latitude: 37.7749, longitude: -122.4194, altitude: 0, accuracy: 5, speed: 3, heading: 0, timestamp: 1 },
        { latitude: 37.7750, longitude: -122.4194, altitude: 0, accuracy: 5, speed: 3, heading: 0, timestamp: 2 },
        { latitude: 37.7751, longitude: -122.4194, altitude: 0, accuracy: 5, speed: 3, heading: 0, timestamp: 3 },
      ];
      const sum = totalDistance(points);
      expect(sum).toBeGreaterThan(15);
      expect(sum).toBeLessThan(30);
    });
  });
});
