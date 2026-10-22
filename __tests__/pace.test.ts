import { calculatePace, formatPace, calculateSpeed, paceToSpeed, speedToPace } from '../src/utils/pace';

describe('Pace Utilities', () => {
  describe('calculatePace', () => {
    it('returns 0 when distance is 0', () => {
      expect(calculatePace(0, 1000, 'km')).toBe(0);
      expect(calculatePace(-50, 100, 'km')).toBe(0);
    });

    it('calculates pace correctly in km (5000m in 1500s = 300s/km = 5:00/km)', () => {
      const pace = calculatePace(5000, 1500, 'km');
      expect(pace).toBe(300);
    });

    it('calculates pace correctly in miles (1609.344m in 480s = 480s/mi = 8:00/mi)', () => {
      const pace = calculatePace(1609.344, 480, 'mi');
      expect(Math.round(pace)).toBe(480);
    });
  });

  describe('formatPace', () => {
    it('formats seconds into M:SS correctly', () => {
      expect(formatPace(300)).toBe('5:00');
      expect(formatPace(323)).toBe('5:23');
      expect(formatPace(275)).toBe('4:35');
    });

    it('handles 0 or invalid inputs with fallback --:--', () => {
      expect(formatPace(0)).toBe('--:--');
      expect(formatPace(-10)).toBe('--:--');
      expect(formatPace(Infinity)).toBe('--:--');
    });
  });

  describe('speed / pace conversions', () => {
    it('calculates speed from distance and duration', () => {
      expect(calculateSpeed(1000, 200)).toBe(5); // 5 m/s
      expect(calculateSpeed(0, 100)).toBe(0);
    });

    it('converts pace to speed and speed to pace', () => {
      // 300s/km = 1000m / 300s = 3.33 m/s
      const speed = paceToSpeed(300, 'km');
      expect(speed).toBeCloseTo(3.333, 2);

      const pace = speedToPace(speed, 'km');
      expect(Math.round(pace)).toBe(300);
    });
  });
});
