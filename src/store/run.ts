/**
 * STRIDE — Active Run Tracking Zustand Store
 */

import { create } from 'zustand';
import { RunStatus, type LocationPoint, type RunStats, type Split } from '../types/run';
import { calculateCalories } from '../utils/calories';
import { haversineDistance } from '../utils/distance';
import { calculatePace } from '../utils/pace';
import { encodePolyline } from '../utils/polyline';
import { saveRun, type InsertRunParams } from '../services/sqlite';
import { useAuthStore } from './auth';

interface RunStore {
  plannedMode: 'outdoor' | 'trail' | 'treadmill';
  targetTimeMinutes: number;
  status: RunStatus;
  countdownRemaining: number;
  runId: string | null;
  startedAt: string | null;
  endedAt: string | null;
  isAutoPaused: boolean;
  pausedDurationSeconds: number;
  runType: 'free' | 'distance' | 'time' | 'interval' | 'race';
  targetValue: number | null;

  stats: RunStats;
  routePoints: LocationPoint[];

  // Actions
  startCountdown: () => void;
  tickCountdown: () => void;
  startRun: () => void;
  pauseRun: () => void;
  resumeRun: () => void;
  setAutoPaused: (paused: boolean) => void;
  tickTimer: () => void;
  addLocationPoint: (point: LocationPoint) => void;
  stopRun: () => Promise<string | null>;
  discardRun: () => void;
  resetState: () => void;
}

const INITIAL_STATS: RunStats = {
  distanceMeters: 0,
  durationSeconds: 0,
  currentPaceSecondsPerKm: 0,
  avgPaceSecondsPerKm: 0,
  bestPaceSecondsPerKm: null,
  currentSpeedMps: 0,
  caloriesBurned: 0,
  elevationGainM: 0,
  elevationLossM: 0,
  heartRate: null,
  cadence: null,
  splits: [],
};

export const useRunStore = create<RunStore>((set, get) => ({
  plannedMode: 'outdoor',
  targetTimeMinutes: 30,
  status: RunStatus.Idle,
  countdownRemaining: 3,
  runId: null,
  startedAt: null,
  endedAt: null,
  isAutoPaused: false,
  pausedDurationSeconds: 0,
  runType: 'free',
  targetValue: null,
  stats: { ...INITIAL_STATS },
  routePoints: [],

  startCountdown: () => {
    set({
      status: RunStatus.Countdown,
      countdownRemaining: 3,
      stats: { ...INITIAL_STATS, splits: [] },
      routePoints: [],
      isAutoPaused: false,
      pausedDurationSeconds: 0,
      runId: 'run_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
    });
  },

  tickCountdown: () => {
    const current = get().countdownRemaining;
    if (current > 1) {
      set({ countdownRemaining: current - 1 });
    } else {
      get().startRun();
    }
  },

  startRun: () => {
    set({
      status: RunStatus.Active,
      startedAt: new Date().toISOString(),
      countdownRemaining: 0,
    });
  },

  pauseRun: () => {
    if (get().status === RunStatus.Active) {
      set({ status: RunStatus.Paused });
    }
  },

  resumeRun: () => {
    if (get().status === RunStatus.Paused) {
      set({ status: RunStatus.Active, isAutoPaused: false });
    }
  },

  setAutoPaused: (paused) => {
    const { status, isAutoPaused } = get();
    if (paused && status === RunStatus.Active && !isAutoPaused) {
      set({ isAutoPaused: true });
    } else if (!paused && isAutoPaused) {
      set({ isAutoPaused: false });
    }
  },

  tickTimer: () => {
    const { status, isAutoPaused, stats, pausedDurationSeconds } = get();
    if (status !== RunStatus.Active) return;

    if (isAutoPaused) {
      set({ pausedDurationSeconds: pausedDurationSeconds + 1 });
      return;
    }

    const newDuration = stats.durationSeconds + 1;
    const avgPace = calculatePace(stats.distanceMeters, newDuration, 'km');

    // Recalculate calories
    const userWeight = useAuthStore.getState().profile.weightKg || 70;
    const calories = calculateCalories(userWeight, stats.distanceMeters, newDuration);

    set({
      stats: {
        ...stats,
        durationSeconds: newDuration,
        avgPaceSecondsPerKm: avgPace,
        caloriesBurned: calories,
      },
    });
  },

  addLocationPoint: (point: LocationPoint) => {
    const { status, isAutoPaused, routePoints, stats } = get();
    if (status !== RunStatus.Active || isAutoPaused) return;

    const lastPoint = routePoints[routePoints.length - 1];
    let addedDistance = 0;
    let addedElevationGain = 0;
    let addedElevationLoss = 0;

    if (lastPoint) {
      addedDistance = haversineDistance(
        lastPoint.latitude,
        lastPoint.longitude,
        point.latitude,
        point.longitude
      );

      // Filter out GPS jump noise (> 100m in 1-2 sec is unrealistic for running)
      if (addedDistance > 80) {
        addedDistance = 0;
      }

      if (point.altitude !== null && lastPoint.altitude !== null) {
        const altDiff = point.altitude - lastPoint.altitude;
        if (altDiff > 0.5 && altDiff < 25) {
          addedElevationGain = altDiff;
        } else if (altDiff < -0.5 && altDiff > -25) {
          addedElevationLoss = Math.abs(altDiff);
        }
      }
    }

    const totalDistance = stats.distanceMeters + addedDistance;
    const speed = point.speed !== null && point.speed > 0 ? point.speed : 0;
    const instantPace = speed > 0.5 ? Math.round(1000 / speed) : 0;

    // Check Splits (every 1000m)
    const unitPreference = useAuthStore.getState().profile.unitPreference || 'km';
    const splitIntervalMeters = unitPreference === 'mi' ? 1609.34 : 1000;
    const currentCompletedSplitsCount = stats.splits.length;
    const expectedSplitsCount = Math.floor(totalDistance / splitIntervalMeters);

    let updatedSplits = [...stats.splits];
    let bestPace = stats.bestPaceSecondsPerKm;

    if (expectedSplitsCount > currentCompletedSplitsCount) {
      const splitNumber = currentCompletedSplitsCount + 1;
      const priorSplitsTime = updatedSplits.reduce((acc, s) => acc + s.durationSeconds, 0);
      const splitDuration = Math.max(1, stats.durationSeconds - priorSplitsTime);
      const splitPace = Math.round((splitDuration / splitIntervalMeters) * 1000);

      const newSplit: Split = {
        number: splitNumber,
        distanceMeters: splitIntervalMeters,
        durationSeconds: splitDuration,
        paceSecondsPerKm: splitPace,
        elevationChangeM: Math.round(addedElevationGain - addedElevationLoss),
        avgHeartRate: point.altitude ? Math.round(point.altitude) : null,
      };

      updatedSplits.push(newSplit);

      if (bestPace === null || splitPace < bestPace) {
        bestPace = splitPace;
      }
    }

    set({
      routePoints: [...routePoints, point],
      stats: {
        ...stats,
        distanceMeters: totalDistance,
        currentSpeedMps: speed,
        currentPaceSecondsPerKm: instantPace,
        bestPaceSecondsPerKm: bestPace,
        elevationGainM: stats.elevationGainM + addedElevationGain,
        elevationLossM: stats.elevationLossM + addedElevationLoss,
        splits: updatedSplits,
      },
    });
  },

  stopRun: async () => {
    const { runId, startedAt, stats, routePoints } = get();
    if (!runId || !startedAt) return null;

    const endedAt = new Date().toISOString();
    const encodedRoute = encodePolyline(routePoints);
    const userId = useAuthStore.getState().userId || 'guest_user_stride';

    // Save to local SQLite database
    try {
      const insertData: InsertRunParams = {
        id: runId,
        user_id: userId,
        started_at: startedAt,
        ended_at: endedAt,
        distance_meters: Math.round(stats.distanceMeters),
        duration_seconds: stats.durationSeconds,
        avg_pace_seconds_per_km: stats.avgPaceSecondsPerKm,
        calories_burned: stats.caloriesBurned,
        elevation_gain_meters: Math.round(stats.elevationGainM),
        route_polyline: encodedRoute,
        weather_summary: 'Clear, 21°C',
        ai_insight: null,
        status: 'completed',
        created_at: endedAt,
      };

      await saveRun(insertData, routePoints, stats.splits);
    } catch (e) {
      console.warn('[STRIDE] Failed saving run to SQLite:', e);
    }

    set({
      status: RunStatus.Completed,
      endedAt,
    });

    return runId;
  },

  discardRun: () => {
    get().resetState();
  },

  resetState: () => {
    set({
      status: RunStatus.Idle,
      countdownRemaining: 3,
      runId: null,
      startedAt: null,
      endedAt: null,
      isAutoPaused: false,
      pausedDurationSeconds: 0,
      stats: { ...INITIAL_STATS, splits: [] },
      routePoints: [],
    });
  },
}));
