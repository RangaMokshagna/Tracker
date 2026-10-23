/** A quick flick wins over travel distance; slow drags need deliberate movement. */
export function deckSwipeDirection(delta: number, velocity: number): -1 | 0 | 1 {
  if (!Number.isFinite(delta) || !Number.isFinite(velocity)) return 0;
  if (Math.abs(delta) <= 75 && Math.abs(velocity) <= 0.55) return 0;
  return (Math.abs(velocity) > 0.55 ? velocity : delta) < 0 ? 1 : -1;
}

export function deckDestination(index: number, direction: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(count - 1, index + direction));
}
