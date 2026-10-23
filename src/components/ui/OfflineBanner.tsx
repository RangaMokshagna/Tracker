/**
 * STRIDE — OfflineBanner Component
 *
 * Detects network connectivity with @react-native-community/netinfo
 * and slides in from top when offline.
 */

import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import NetInfo from "@react-native-community/netinfo";
import { useTheme, spacing, borderRadius } from "../../theme";
import { Text } from "./Text";

// ─── Component ───────────────────────────────────────────────────────────────

export function OfflineBanner(): React.JSX.Element | null {
  const { colors } = useTheme();
  const [isOffline, setIsOffline] = useState(false);
  const slideY = useSharedValue(-80);
  const reduced = useReducedMotion();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !(
        state.isConnected && state.isInternetReachable !== false
      );
      setIsOffline(offline);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    slideY.set(
      reduced
        ? isOffline
          ? 0
          : -80
        : withSpring(isOffline ? 0 : -80, {
            damping: 20,
            stiffness: 150,
            mass: 0.6,
          }),
    );
  }, [isOffline, reduced, slideY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
    opacity: interpolate(slideY.value, [-80, 0], [0, 1], Extrapolation.CLAMP),
  }));

  if (!isOffline) return null;
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
        You&apos;re offline — data will sync when connected
      </Text>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "500",
  },
});
