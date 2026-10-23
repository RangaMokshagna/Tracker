import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { useRunStore } from '../src/store/run';
import { RunStatus } from '../src/types/run';

jest.mock('../src/services/sqlite', () => ({ saveRun: jest.fn() }));
jest.mock('../src/store/auth', () => ({ useAuthStore: { getState: () => ({ profile: { weightKg: 70 }, userId: 'runner' }) } }));

describe('configured run lifecycle', () => {
  beforeEach(() => useRunStore.getState().resetState());
  it('preserves the selected plan through countdown and starts only after three ticks', () => {
    useRunStore.setState({ plannedMode: 'trail', targetValue: 21000, targetTimeMinutes: 120, runType: 'distance' });
    useRunStore.getState().startCountdown();
    expect(useRunStore.getState().status).toBe(RunStatus.Countdown);
    useRunStore.getState().tickCountdown();
    useRunStore.getState().tickCountdown();
    expect(useRunStore.getState().status).toBe(RunStatus.Countdown);
    expect(useRunStore.getState().countdownRemaining).toBe(1);
    useRunStore.getState().tickCountdown();
    expect(useRunStore.getState()).toMatchObject({ status: RunStatus.Active, plannedMode: 'trail', targetValue: 21000, targetTimeMinutes: 120 });
  });
  it('clears the previous run metrics before a configured treadmill run', () => {
    useRunStore.setState({ plannedMode: 'treadmill', targetValue: 3000, targetTimeMinutes: 20 });
    useRunStore.getState().startCountdown();
    expect(useRunStore.getState().stats.distanceMeters).toBe(0);
    expect(useRunStore.getState().stats.durationSeconds).toBe(0);
    expect(useRunStore.getState().plannedMode).toBe('treadmill');
    useRunStore.getState().discardRun();
    expect(useRunStore.getState().status).toBe(RunStatus.Idle);
  });
});
