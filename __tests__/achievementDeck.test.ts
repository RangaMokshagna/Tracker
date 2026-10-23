import { describe, expect, it } from '@jest/globals';
import { deckDestination, deckSwipeDirection } from '../src/features/profile/deckNavigation';

describe('achievement deck navigation', () => {
  it('restores a card after a short slow drag', () => {
    expect(deckSwipeDirection(60, 0.2)).toBe(0);
    expect(deckSwipeDirection(-75, -0.55)).toBe(0);
    expect(deckSwipeDirection(NaN, 1)).toBe(0);
  });
  it('supports both directions and lets a quick reversal override drag distance', () => {
    expect(deckSwipeDirection(-90, 0)).toBe(1);
    expect(deckSwipeDirection(90, 0)).toBe(-1);
    expect(deckSwipeDirection(-90, 0.8)).toBe(-1);
    expect(deckSwipeDirection(10, -0.8)).toBe(1);
  });
  it('never wraps or dismisses the only card and tolerates an empty filtered collection', () => {
    expect(deckDestination(0, -1, 7)).toBe(0);
    expect(deckDestination(6, 1, 7)).toBe(6);
    expect(deckDestination(0, 1, 1)).toBe(0);
    expect(deckDestination(0, 1, 0)).toBe(0);
    expect(deckDestination(2, -1, 7)).toBe(1);
  });
});
