/**
 * STRIDE — Haptic Feedback Hook
 *
 * Wraps expo-haptics with convenient named methods.
 * Gracefully no-ops on platforms that don't support haptics.
 */

import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export interface HapticsAPI {
  /** Light tap — selection changes, toggles */
  light: () => void;
  /** Medium tap — button presses */
  medium: () => void;
  /** Heavy tap — destructive actions, long-press */
  heavy: () => void;
  /** Success notification — completed action */
  success: () => void;
  /** Warning notification — caution state */
  warning: () => void;
  /** Error notification — failed action */
  error: () => void;
  /** Raw selection feedback (lightest) */
  selection: () => void;
}

const noop = () => {};

/**
 * Hook that returns memoized haptic feedback functions.
 * Safe to call on Android/web — gracefully degrades.
 */
export function useHaptics(): HapticsAPI {
  const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

  const light = useCallback(() => {
    if (!isSupported) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(noop);
  }, [isSupported]);

  const medium = useCallback(() => {
    if (!isSupported) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(noop);
  }, [isSupported]);

  const heavy = useCallback(() => {
    if (!isSupported) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(noop);
  }, [isSupported]);

  const success = useCallback(() => {
    if (!isSupported) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(noop);
  }, [isSupported]);

  const warning = useCallback(() => {
    if (!isSupported) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(noop);
  }, [isSupported]);

  const error = useCallback(() => {
    if (!isSupported) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(noop);
  }, [isSupported]);

  const selection = useCallback(() => {
    if (!isSupported) return;
    Haptics.selectionAsync().catch(noop);
  }, [isSupported]);

  return { light, medium, heavy, success, warning, error, selection };
}
