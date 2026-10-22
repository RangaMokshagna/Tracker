/**
 * STRIDE — IconButton Component
 *
 * Circular icon button with glass background, haptic feedback, and 44pt minimum touch.
 */

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme, borderRadius, animations } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';

// ─── Types ───────────────────────────────────────────────────────────────────

export type IconButtonSize = 'sm' | 'md' | 'lg';
export type IconButtonVariant = 'glass' | 'transparent' | 'primary';

export interface IconButtonProps {
  /** Icon element to render */
  icon: React.ReactNode;
  /** Press handler */
  onPress?: () => void;
  /** Size variant */
  size?: IconButtonSize;
  /** Visual variant */
  variant?: IconButtonVariant;
  /** Disable button */
  disabled?: boolean;
  /** Accessibility label (required for icon-only buttons) */
  accessibilityLabel: string;
  /** Additional container style */
  style?: StyleProp<ViewStyle>;
}

// ─── Size Config ─────────────────────────────────────────────────────────────

const SIZE_MAP: Record<IconButtonSize, number> = {
  sm: 36,
  md: 44,
  lg: 52,
};

// ─── Component ───────────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function IconButton({
  icon,
  onPress,
  size = 'md',
  variant = 'glass',
  disabled = false,
  accessibilityLabel,
  style,
}: IconButtonProps): React.JSX.Element {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const scale = useSharedValue(1);

  const dimension = Math.max(SIZE_MAP[size], 44); // 44pt minimum touch target

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, animations.press);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, animations.press);
  };

  const handlePress = () => {
    if (disabled) return;
    haptics.light();
    onPress?.();
  };

  const getBackgroundColor = (): string => {
    if (disabled) return colors.glassSubtle;
    switch (variant) {
      case 'glass':
        return colors.glass;
      case 'transparent':
        return 'transparent';
      case 'primary':
        return colors.primary;
    }
  };

  const getBorderColor = (): string => {
    switch (variant) {
      case 'glass':
        return colors.glassBorder;
      case 'transparent':
        return 'transparent';
      case 'primary':
        return colors.primary;
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        {
          width: dimension,
          height: dimension,
          borderRadius: borderRadius.full,
          backgroundColor: getBackgroundColor(),
          borderWidth: variant === 'glass' ? 1 : 0,
          borderColor: getBorderColor(),
          opacity: disabled ? 0.5 : 1,
        },
        animatedStyle,
        style,
      ]}
    >
      {icon}
    </AnimatedPressable>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
