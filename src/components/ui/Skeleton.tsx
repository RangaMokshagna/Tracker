/**
 * STRIDE — Skeleton Loading Component
 *
 * Animated shimmer effect using reanimated.
 * Provides Skeleton.Text, Skeleton.Circle, Skeleton.Card compound components.
 */

import React, { useEffect, useId, useState } from "react";
import { View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
  useReducedMotion,
  cancelAnimation,
} from "react-native-reanimated";
import { useTheme, borderRadius as radii, spacing } from "../../theme";

// ─── Base Skeleton ───────────────────────────────────────────────────────────

export interface SkeletonBaseProps {
  /** Width of the skeleton (number or string like '100%') */
  width?: number | string;
  /** Height of the skeleton */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Additional style */
  style?: StyleProp<ViewStyle>;
}

function SkeletonBase({
  width = "100%",
  height = 16,
  borderRadius = radii.sm,
  style,
}: SkeletonBaseProps): React.JSX.Element {
  const { colors } = useTheme();
  const shimmer = useSharedValue(0);
  const reduced = useReducedMotion();
  const [measuredWidth, setMeasuredWidth] = useState(200);
  const id = `loading-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    if (reduced) {
      shimmer.set(0.5);
      return;
    }
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
    return () => cancelAnimation(shimmer);
  }, [reduced, shimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmer.value, [0, 1], [0.4, 0.8]);
    return { opacity };
  });
  const sweep = useAnimatedStyle(() => ({
    transform: [{ translateX: -80 + shimmer.value * (measuredWidth + 160) }],
    opacity: reduced ? 0 : 0.5,
  }));

  return (
    <Animated.View
      onLayout={(event) => setMeasuredWidth(event.nativeEvent.layout.width)}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.skeletonBase,
          overflow: "hidden",
        },
        animatedStyle,
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[{ position: "absolute", top: 0, bottom: 0, width: 80 }, sweep]}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id={id}>
              <Stop stopColor={colors.skeletonHighlight} stopOpacity="0" />
              <Stop offset="0.5" stopColor={colors.skeletonHighlight} />
              <Stop
                offset="1"
                stopColor={colors.skeletonHighlight}
                stopOpacity="0"
              />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${id})`} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Skeleton.Text ───────────────────────────────────────────────────────────

export interface SkeletonTextProps {
  /** Number of text lines */
  lines?: number;
  /** Line height */
  lineHeight?: number;
  /** Gap between lines */
  gap?: number;
  /** Width of the last line (to look more natural) */
  lastLineWidth?: number | string;
  /** Additional style */
  style?: StyleProp<ViewStyle>;
}

function SkeletonText({
  lines = 3,
  lineHeight = 14,
  gap = spacing.xs,
  lastLineWidth = "60%",
  style,
}: SkeletonTextProps): React.JSX.Element {
  return (
    <View
      style={[{ gap }, style]}
      accessibilityLabel={`Loading ${lines} lines of text`}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBase
          key={i}
          height={lineHeight}
          width={i === lines - 1 && lines > 1 ? lastLineWidth : "100%"}
          borderRadius={radii.sm}
        />
      ))}
    </View>
  );
}

// ─── Skeleton.Circle ─────────────────────────────────────────────────────────

export interface SkeletonCircleProps {
  /** Diameter */
  size?: number;
  /** Additional style */
  style?: StyleProp<ViewStyle>;
}

function SkeletonCircle({
  size = 48,
  style,
}: SkeletonCircleProps): React.JSX.Element {
  return (
    <SkeletonBase
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
}

// ─── Skeleton.Card ───────────────────────────────────────────────────────────

export interface SkeletonCardProps {
  /** Card height */
  height?: number;
  /** Additional style */
  style?: StyleProp<ViewStyle>;
}

function SkeletonCard({
  height = 120,
  style,
}: SkeletonCardProps): React.JSX.Element {
  return (
    <SkeletonBase
      width="100%"
      height={height}
      borderRadius={radii.xl}
      style={style}
    />
  );
}

// ─── Compound Export ─────────────────────────────────────────────────────────

export const Skeleton = Object.assign(SkeletonBase, {
  Text: SkeletonText,
  Circle: SkeletonCircle,
  Card: SkeletonCard,
});
