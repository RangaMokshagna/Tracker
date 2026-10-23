/**
 * STRIDE — Button Component
 *
 * Full-featured button with variants, sizes, loading, haptics, and spring animation.
 */

import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from "react-native-reanimated";
import { useTheme, spacing, borderRadius, animations } from "../../theme";
import { useHaptics } from "../../hooks/useHaptics";
import { Text } from "./Text";
import { GlassSheen } from "./LiquidBackdrop";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  /** Button label */
  title?: string;
  /** Alias for title */
  label?: string;
  /** Press handler */
  onPress?: () => void;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size */
  size?: ButtonSize;
  /** Show loading spinner */
  loading?: boolean;
  /** Disable button */
  disabled?: boolean;
  /** Icon element rendered to the left of title */
  iconLeft?: React.ReactNode;
  /** Alias for iconLeft */
  icon?: React.ReactNode;
  /** Icon element rendered to the right of title */
  iconRight?: React.ReactNode;
  /** Additional container style */
  style?: StyleProp<ViewStyle>;
  /** Accessibility label override */
  accessibilityLabel?: string;
}

// ─── Size Maps ───────────────────────────────────────────────────────────────

const SIZE_CONFIG: Record<
  ButtonSize,
  {
    height: number;
    paddingHorizontal: number;
    fontSize: number;
    iconGap: number;
  }
> = {
  sm: {
    height: 36,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    iconGap: spacing.xxs,
  },
  md: {
    height: 48,
    paddingHorizontal: spacing.xl,
    fontSize: 16,
    iconGap: spacing.xs,
  },
  lg: {
    height: 56,
    paddingHorizontal: spacing["2xl"],
    fontSize: 18,
    iconGap: spacing.sm,
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  iconLeft,
  icon,
  iconRight,
  style,
  accessibilityLabel,
}: ButtonProps): React.JSX.Element {
  const buttonTitle = title ?? label ?? "";
  const buttonIconLeft = iconLeft ?? icon;
  const { colors } = useTheme();
  const haptics = useHaptics();
  const scale = useSharedValue(1);
  const reduced = useReducedMotion();

  const sizeConfig = SIZE_CONFIG[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.set(reduced ? 1 : withSpring(0.96, animations.press));
  };

  const handlePressOut = () => {
    scale.set(reduced ? 1 : withSpring(1, animations.press));
  };

  const handlePress = () => {
    if (loading || disabled) return;
    haptics.light();
    onPress?.();
  };

  // ── Variant styles ──

  const getVariantStyles = (): {
    container: ViewStyle;
    textColor: string;
    spinnerColor: string;
  } => {
    const isDisabled = disabled || loading;

    switch (variant) {
      case "primary":
        return {
          container: {
            backgroundColor: isDisabled ? colors.primaryMuted : colors.primary,
          },
          textColor: isDisabled ? colors.textTertiary : colors.textOnPrimary,
          spinnerColor: colors.textOnPrimary,
        };
      case "secondary":
        return {
          container: {
            backgroundColor: colors.glass,
            borderWidth: 1,
            borderColor: isDisabled ? colors.border : colors.primaryBorder,
          },
          textColor: isDisabled ? colors.textTertiary : colors.primary,
          spinnerColor: colors.primary,
        };
      case "ghost":
        return {
          container: {
            backgroundColor: "transparent",
          },
          textColor: isDisabled ? colors.textTertiary : colors.primary,
          spinnerColor: colors.primary,
        };
      case "danger":
        return {
          container: {
            backgroundColor: isDisabled ? colors.errorMuted : colors.error,
          },
          textColor: isDisabled ? colors.textTertiary : "#FFFFFF",
          spinnerColor: "#FFFFFF",
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel ?? buttonTitle}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[
        styles.base,
        {
          height: Math.max(sizeConfig.height, 44), // 44pt minimum touch target
          paddingHorizontal: sizeConfig.paddingHorizontal,
          borderRadius: borderRadius.full,
          overflow: "hidden",
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.4)",
        },
        variantStyles.container,
        animatedStyle,
        style,
      ]}
    >
      <GlassSheen />
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.spinnerColor} />
      ) : (
        <View style={styles.content}>
          {buttonIconLeft && (
            <View style={{ marginRight: sizeConfig.iconGap }}>
              {buttonIconLeft}
            </View>
          )}
          <Text
            variant={size === "sm" ? "label" : "body"}
            color={variantStyles.textColor as any}
            style={{
              fontWeight: "600",
              fontSize: sizeConfig.fontSize,
            }}
          >
            {buttonTitle}
          </Text>
          {iconRight && (
            <View style={{ marginLeft: sizeConfig.iconGap }}>{iconRight}</View>
          )}
        </View>
      )}
    </AnimatedPressable>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
