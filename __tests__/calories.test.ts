import { calculateCalories } from '../src/utils/calories';

describe('Calorie Estimation Utilities', () => {
  it('returns 0 when duration, weight, or distance is 0', () => {
    expect(calculateCalories(70, 0, 1800)).toBe(0);
    expect(calculateCalories(0, 5000, 1800)).toBe(0);
    expect(calculateCalories(70, 5000, 0)).toBe(0);
  });

  it('calculates calories based on MET formula for running', () => {
    // 70kg runner running 5000m in 1800s (30 min) -> speed = 2.78 m/s -> MET ~8.3
    // calories = 8.3 * 70 * 0.5 = 290.5 -> ~291 kcal
    const calories = calculateCalories(70, 5000, 1800);
    expect(calories).toBeGreaterThan(250);
    expect(calories).toBeLessThan(350);
  });

  it('yields higher calories for a heavier runner at the same speed', () => {
    const lighter = calculateCalories(60, 5000, 1800);
    const heavier = calculateCalories(85, 5000, 1800);
    expect(heavier).toBeGreaterThan(lighter);
  });

  it('yields higher calories for faster pace over the same duration', () => {
    const slowRun = calculateCalories(70, 4000, 1800); // 4km in 30min
    const fastRun = calculateCalories(70, 6000, 1800); // 6km in 30min
    expect(fastRun).toBeGreaterThan(slowRun);
  });
});
