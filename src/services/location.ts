/**
 * STRIDE — High-accuracy GPS & Background Location Service
 *
 * Combines expo-location with expo-task-manager for continuous background tracking,
 * Kalman filter GPS smoothing, and intelligent auto-pause detection.
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import {
  AUTO_PAUSE_SPEED_THRESHOLD_MPS,
  GPS_MIN_ACCURACY_M,
  GPS_UPDATE_INTERVAL_MS,
} from '../constants';
import { useRunStore } from '../store/run';
import type { LocationPoint } from '../types/run';
import { createFilterState, filterGPSPoint, type GPSFilterState } from '../utils/gps';
import { haversineDistance } from '../utils/distance';

export const LOCATION_TASK_NAME = 'STRIDE_BACKGROUND_LOCATION_TASK';

let foregroundSubscription: Location.LocationSubscription | null = null;
let filterState: GPSFilterState | null = null;
let autoPauseCounter = 0;

// Register background task handler
if (!TaskManager.isTaskDefined(LOCATION_TASK_NAME)) {
  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.warn('[STRIDE] Background location error:', error);
      return;
    }
    if (data) {
      const { locations } = data as { locations: Location.LocationObject[] };
      if (locations && locations.length > 0) {
        for (const loc of locations) {
          processRawLocation(loc);
        }
      }
    }
  });
}

function processRawLocation(loc: Location.LocationObject) {
  // Accuracy check
  if (loc.coords.accuracy && loc.coords.accuracy > GPS_MIN_ACCURACY_M) {
    return;
  }

  const rawPoint: LocationPoint = {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    altitude: loc.coords.altitude,
    accuracy: loc.coords.accuracy ?? 10,
    speed: loc.coords.speed !== null && loc.coords.speed > 0 ? loc.coords.speed : 0,
    heading: loc.coords.heading,
    timestamp: loc.timestamp,
  };

  let latitude = rawPoint.latitude;
  let longitude = rawPoint.longitude;

  if (!filterState) {
    filterState = createFilterState(rawPoint);
  } else {
    const [smoothed, nextState] = filterGPSPoint(rawPoint, filterState, haversineDistance);
    filterState = nextState;
    latitude = smoothed.latitude;
    longitude = smoothed.longitude;
  }

  const speed = rawPoint.speed ?? 0;

  // Auto-pause detection: if speed is below threshold for 4 consecutive ticks
  if (speed < AUTO_PAUSE_SPEED_THRESHOLD_MPS) {
    autoPauseCounter += 1;
    if (autoPauseCounter >= 4) {
      useRunStore.getState().setAutoPaused(true);
    }
  } else {
    autoPauseCounter = 0;
    useRunStore.getState().setAutoPaused(false);
  }

  const point: LocationPoint = {
    latitude,
    longitude,
    altitude: rawPoint.altitude,
    accuracy: rawPoint.accuracy,
    speed,
    heading: rawPoint.heading,
    timestamp: rawPoint.timestamp,
  };

  useRunStore.getState().addLocationPoint(point);
}

/**
 * Request both Foreground and Background Location permissions.
 */
export async function requestLocationPermissions(): Promise<{
  foreground: boolean;
  background: boolean;
}> {
  try {
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      return { foreground: false, background: false };
    }

    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    return {
      foreground: true,
      background: bgStatus === 'granted',
    };
  } catch (err) {
    console.warn('[STRIDE] Permission request error:', err);
    return { foreground: false, background: false };
  }
}

/**
 * Start active location tracking with foreground + background task.
 */
export async function startLocationTracking(): Promise<boolean> {
  try {
    autoPauseCounter = 0;
    filterState = null;

    const { foreground } = await requestLocationPermissions();
    if (!foreground) return false;

    // Start background tracking if available
    const hasStartedBg = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false);
    if (!hasStartedBg) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: GPS_UPDATE_INTERVAL_MS,
        distanceInterval: 3, // meters
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'STRIDE Active Run',
          notificationBody: 'Tracking your live route, pace and distance.',
          notificationColor: '#BFFF00',
        },
      }).catch((e) => console.log('[STRIDE] Bg location start note:', e));
    }

    // Start high-frequency foreground watch
    if (foregroundSubscription) {
      foregroundSubscription.remove();
    }

    foregroundSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 2,
      },
      (loc) => {
        processRawLocation(loc);
      }
    );

    return true;
  } catch (err) {
    console.error('[STRIDE] startLocationTracking failed:', err);
    return false;
  }
}

/**
 * Stop active location tracking and clear background tasks.
 */
export async function stopLocationTracking(): Promise<void> {
  if (foregroundSubscription) {
    foregroundSubscription.remove();
    foregroundSubscription = null;
  }

  const hasStartedBg = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false);
  if (hasStartedBg) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => {});
  }
}
