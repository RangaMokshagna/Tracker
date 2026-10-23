/**
 * STRIDE — GlassCard Component
 *
 * A glassmorphism card with semi-transparent background + border.
 * Supports pressable variant with spring scale animation.
 */

import React from "react";
import { Pressable, View, Platform } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from "react-native-reanimated";
import {
  useTheme,
  borderRadius as radii,
  shadows,
  animations,
} from "../../theme";
import { GlassSheen } from "./LiquidBackdrop";
import { GlassMaterial } from "./GlassSurface";
import * as Haptics from "expo-haptics";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Enable press interaction */
  pressable?: boolean;
  /** Press handler (only when pressable) */
  onPress?: () => void;
  /** Visual variant */
  variant?: "default" | "elevated";
  /** Border radius token key */
  radius?: keyof typeof radii;
  /** Accessibility label */
  accessibilityLabel?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassCard({
  children,
  style,
  pressable = false,
  onPress,
  variant = "default",
  radius = "xxl",
  accessibilityLabel,
}: GlassCardProps): React.JSX.Element {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const reduced = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.set(reduced ? 1 : withSpring(0.96, animations.press));
  };

  const handlePressOut = () => {
    scale.set(reduced ? 1 : withSpring(1, animations.press));
  };

  const cardStyle: ViewStyle = {
    backgroundColor: variant === "elevated" ? colors.glass : colors.glassSubtle,
    borderRadius: radii[radius],
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderTopColor: "rgba(255,255,255,0.7)",
    overflow: "hidden",
    ...(Platform.OS === "android" && variant === "elevated"
      ? shadows.elevated
      : variant === "elevated"
        ? shadows.elevated
        : shadows.card),
  };

  if (pressable) {
    return (
      <AnimatedPressable
        onPress={() => {
          void Haptics.selectionAsync().catch(() => {});
          onPress?.();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[cardStyle, animatedStyle, style]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        <GlassMaterial />
        <GlassSheen />
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View style={[cardStyle, style]} accessibilityLabel={accessibilityLabel}>
      <GlassMaterial />
      <GlassSheen />
      {children}
    </View>
  );
}
