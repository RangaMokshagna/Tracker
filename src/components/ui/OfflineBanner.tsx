/**
 * STRIDE — OfflineBanner Component
 *
 * Detects network connectivity with @react-native-community/netinfo
 * and slides in from top when offline.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import NetInfo from '@react-native-community/netinfo';
import { useTheme, spacing, borderRadius, animations } from '../../theme';
import { Text } from './Text';

// ─── Component ───────────────────────────────────────────────────────────────

export function OfflineBanner(): React.JSX.Element | null {
  const { colors } = useTheme();
  const [isOffline, setIsOffline] = useState(false);
  const slideY = useSharedValue(-80);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !(state.isConnected && state.isInternetReachable !== false);
      setIsOffline(offline);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    slideY.value = withSpring(isOffline ? 0 : -80, {
      damping: 20,
      stiffness: 150,
      mass: 0.6,
    });
  }, [isOffline]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
    opacity: interpolate(
      slideY.value,
      [-80, 0],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.warningMuted,
          borderColor: colors.warning,
        },
        animatedStyle,
      ]}
      accessibilityLabel="You are offline. Data will sync when connected."
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Text variant="caption" color="warning" style={styles.icon}>
        ⚡
      </Text>
      <Text variant="bodySmall" color="warning" style={styles.text}>
        You're offline — data will sync when connected
      </Text>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    zIndex: 999,
    marginTop: spacing.xxs,
  },
  icon: {
    marginRight: spacing.xs,
  },
  text: {
    flex: 1,
    fontWeight: '500',
  },
});
