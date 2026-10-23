/**
 * STRIDE — Custom Text Component
 *
 * Typography component with variant, color, and theme support.
 */

import React from "react";
import { Text as RNText, StyleSheet } from "react-native";
import type { TextProps as RNTextProps, TextStyle } from "react-native";
import { useTheme, typography, palette } from "../../theme";
import type { TypographyKey, ThemeColors } from "../../theme";
import { natural } from "../../theme/natural";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TextColorKey = keyof Pick<
  ThemeColors,
  | "text"
  | "textSecondary"
  | "textTertiary"
  | "textOnPrimary"
  | "primary"
  | "error"
  | "warning"
  | "success"
  | "info"
>;

export interface TextProps extends RNTextProps {
  /** Typography variant */
  variant?: TypographyKey;
  /** Color token key — or a raw color string */
  color?: TextColorKey | (string & {});
  /** Center text */
  center?: boolean;
  /** Enable adjustsFontSizeToFit for dynamic sizing */
  adjustsFontSizeToFit?: boolean;
  children: React.ReactNode;
}

// ─── Color token keys set ────────────────────────────────────────────────────

const COLOR_KEYS = new Set<string>([
  "text",
  "textSecondary",
  "textTertiary",
  "textOnPrimary",
  "primary",
  "error",
  "warning",
  "success",
  "info",
]);

// ─── Component ───────────────────────────────────────────────────────────────

export function Text({
  variant = "body",
  color,
  center = false,
  adjustsFontSizeToFit = false,
  style,
  children,
  ...rest
}: TextProps): React.JSX.Element {
  const { colors } = useTheme();

  const legacyColor =
    color === "white" || color === "pearl"
      ? "text"
      : color === "dark300" || color === "dark400" || color === "mist"
        ? "textSecondary"
        : color === "lime"
          ? "primary"
          : color;
  const resolvedColor = legacyColor
    ? COLOR_KEYS.has(legacyColor)
      ? colors[legacyColor as TextColorKey]
      : legacyColor in palette
        ? palette[legacyColor as keyof typeof palette]
        : legacyColor
    : colors.text;

  const typo = typography[variant];
  const flat = StyleSheet.flatten(style);
  const weight = Number(flat?.fontWeight || typo.fontWeight || 400);

  const textStyle: TextStyle = {
    fontFamily:
      variant === "display" || variant === "h1"
        ? natural.font.display
        : weight >= 600
          ? natural.font.semibold
          : weight >= 500
            ? natural.font.medium
            : natural.font.ui,
    fontSize: typo.fontSize,
    fontWeight: typo.fontWeight,
    lineHeight: typo.lineHeight,
    letterSpacing: typo.letterSpacing,
    color: resolvedColor,
    ...(center && { textAlign: "center" as const }),
  };

  return (
    <RNText
      style={[textStyle, style]}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      accessibilityRole="text"
      {...rest}
    >
      {children}
    </RNText>
  );
}
