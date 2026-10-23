import { describe, expect, it, jest } from '@jest/globals';
import {
  dockCoverage,
  dockGeometry,
  nearestDockTab,
  sameDockTarget,
} from '../src/components/navigation/LiquidGlassDock';

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
  StyleSheet: { create: (styles: unknown) => styles },
}));
jest.mock('expo-blur', () => ({}));
jest.mock('react-native-svg', () => ({}));
jest.mock('expo-haptics', () => ({}));
jest.mock('react-native-reanimated', () => ({}));
jest.mock('react-native-safe-area-context', () => ({}));

describe('liquid dock lens geometry', () => {
  it('keeps a spring running across unrelated route renders and fractional layout noise', () => {
    const previous = { center: 175, width: 64, reduced: false };
    expect(sameDockTarget(previous, { center: 175.01, width: 64.01 }, false)).toBe(true);
    expect(sameDockTarget(previous, { center: 245, width: 64 }, false)).toBe(false);
    expect(sameDockTarget(previous, { center: 175, width: 72 }, false)).toBe(false);
    expect(sameDockTarget(previous, previous, true)).toBe(false);
  });
  it('crossfades by lens position without producing NaN before layout', () => {
    expect(dockCoverage(0, 0, 0)).toBe(0);
    expect(dockCoverage(35, 70, 0)).toBe(1);
    expect(dockCoverage(70, 70, 0)).toBeGreaterThan(0);
    expect(dockCoverage(70, 70, 0)).toBeLessThan(1);
    expect(dockCoverage(175, 70, 0)).toBe(0);
  });
  it('keeps the lens inside both rounded ends on narrow and tablet layouts', () => {
    for (const width of [248, 288, 358, 520]) {
      for (let index = 0; index < 5; index++) {
        const lens = dockGeometry(width, 5, index, 44);
        expect(lens.center - lens.width / 2).toBeGreaterThanOrEqual(-16);
        expect(lens.center + lens.width / 2).toBeLessThanOrEqual(width + 16);
        expect(lens.width).toBeLessThanOrEqual(lens.cell * 1.5);
        expect(lens.center).toBe(lens.cell * (index + 0.5));
        expect(dockCoverage(lens.center, lens.cell, index)).toBe(1);
      }
    }
  });
  it('adapts to measured text instead of hardcoding a single capsule width', () => {
    expect(dockGeometry(358, 5, 4, 44).width).toBeGreaterThan(dockGeometry(358, 5, 0, 26).width);
    expect(dockGeometry(358, 5, 2, 500).width).toBeLessThanOrEqual((358 / 5) * 1.5);
  });
  it('snaps to the nearest tab and clamps drags beyond the dock', () => {
    expect(nearestDockTab(-100, 350, 5)).toBe(0);
    expect(nearestDockTab(69, 350, 5)).toBe(0);
    expect(nearestDockTab(71, 350, 5)).toBe(1);
    expect(nearestDockTab(175, 350, 5)).toBe(2);
    expect(nearestDockTab(1000, 350, 5)).toBe(4);
  });
  it('handles a single tab and the pre-layout or empty state', () => {
    expect(dockGeometry(350, 1, 0, 30).center).toBe(175);
    expect(dockGeometry(0, 5, 0, 30)).toEqual({ center: 0, width: 0, cell: 0 });
    expect(nearestDockTab(0, 0, 0)).toBe(0);
  });
});
