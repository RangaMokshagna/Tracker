/**
 * STRIDE — GlassCard Component
 *
 * A glassmorphism card with semi-transparent background + border.
 * Supports pressable variant with spring scale animation.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme, borderRadius as radii, shadows, animations } from '../../theme';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Enable press interaction */
  pressable?: boolean;
  /** Press handler (only when pressable) */
  onPress?: () => void;
  /** Visual variant */
  variant?: 'default' | 'elevated';
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
  variant = 'default',
  radius = 'xxl',
  accessibilityLabel,
}: GlassCardProps): React.JSX.Element {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, animations.press);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, animations.press);
  };

  const cardStyle: ViewStyle = {
    backgroundColor: variant === 'elevated' ? colors.glass : colors.glassSubtle,
    borderRadius: radii[radius],
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    ...(Platform.OS === 'android' && variant === 'elevated'
      ? shadows.elevated
      : variant === 'elevated'
        ? shadows.elevated
        : shadows.card),
  };

  if (pressable) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[cardStyle, animatedStyle, style]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View
      style={[cardStyle, style]}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({});
