/**
 * STRIDE Design System — Design Tokens
 *
 * Natural Glass: mist, ink, forest sage, sky and sand.
 * All spacing, color, typography, animation, and shadow tokens.
 */

import { useThemeStore } from "../store/theme";
import type { TextStyle } from "react-native";

// ─── Color Palettes ──────────────────────────────────────────────────────────

export const palette = {
  // Sea glass (legacy lime keys retained for component compatibility)
  ink: "#272620",
  secondary: "#6D6D69",
  tertiary: "#B0B1B0",
  sage: "#5E8F62",
  sand: "#F4C880",
  sky: "#2B6C90",
  lime: "#5E8F62",
  limeDark: "#4C7A51",
  limeLight: "#DCE8DC",
  limeMuted: "rgba(94,143,98,0.12)",
  limeBorder: "rgba(94,143,98,0.25)",

  // Neutrals
  black: "#000000",
  white: "#FFFFFF",
  trueWhite: "#FFFFFF",

  // Dark palette
  dark900: "#1E1D1A",
  dark800: "#292823",
  dark700: "#35342F",
  dark600: "#53534C",
  dark500: "#6D6D69",
  dark400: "#6D6D69",
  dark300: "#6D6D69",

  // Light palette
  light100: "#FFFFFF",
  light200: "#E9EEF0",
  light300: "#DFE6EA",
  light400: "#D4DEE3",
  light500: "#C0C0C0",
  light600: "#A8B8BF",

  // Semantic
  errorRed: "#AE403A",
  errorRedMuted: "rgba(255, 77, 77, 0.15)",
  warningAmber: "#8A5F20",
  warningAmberMuted: "rgba(255, 184, 0, 0.15)",
  successGreen: "#5E8F62",
  successGreenMuted: "rgba(0, 230, 118, 0.15)",
  infoBlue: "#2B6C90",
  infoBlueMuted: "rgba(64, 169, 255, 0.15)",

  // Glass
  glassWhite12: "rgba(255, 255, 255, 0.12)",
  glassWhite8: "rgba(255, 255, 255, 0.08)",
  glassWhite5: "rgba(255, 255, 255, 0.05)",
  glassBorder: "rgba(255, 255, 255, 0.10)",
  glassBlack12: "rgba(0, 0, 0, 0.12)",
  glassBlack8: "rgba(0, 0, 0, 0.08)",
  glassBlackBorder: "rgba(0, 0, 0, 0.10)",

  // Backdrop
  backdropDark: "rgba(0, 0, 0, 0.60)",
  backdropLight: "rgba(0, 0, 0, 0.30)",

  apricot: "#F4C880",
  pearl: "#272620",
  mist: "#6D6D69",
  transparent: "transparent",
} as const;

// ─── Theme Color Sets ────────────────────────────────────────────────────────

export interface ThemeColors {
  /** Absolute background */
  background: string;
  /** Card / elevated surface */
  card: string;
  /** Secondary surface */
  surface: string;
  /** Border color */
  border: string;
  /** Primary accent */
  primary: string;
  /** Primary accent — darker variant */
  primaryDark: string;
  /** Primary accent — lighter variant */
  primaryLight: string;
  /** Primary muted background */
  primaryMuted: string;
  /** Primary border tint */
  primaryBorder: string;
  /** Primary text (high contrast on background) */
  text: string;
  /** Secondary / muted text */
  textSecondary: string;
  /** Tertiary / disabled text */
  textTertiary: string;
  /** Text on primary-colored surfaces */
  textOnPrimary: string;
  /** Error */
  error: string;
  errorMuted: string;
  /** Warning */
  warning: string;
  warningMuted: string;
  /** Success */
  success: string;
  successMuted: string;
  /** Info */
  info: string;
  infoMuted: string;
  /** Glass card background */
  glass: string;
  /** Subtle glass */
  glassSubtle: string;
  /** Glass border */
  glassBorder: string;
  /** Backdrop overlay */
  backdrop: string;
  /** Skeleton base */
  skeletonBase: string;
  /** Skeleton highlight */
  skeletonHighlight: string;
  /** Tab bar background */
  tabBar: string;
  /** Status bar style */
  statusBar: "light" | "dark";
}

export const darkColors: ThemeColors = {
  background: palette.dark900,
  card: palette.dark800,
  surface: palette.dark700,
  border: palette.dark600,
  primary: "#A9C3A8",
  primaryDark: palette.limeDark,
  primaryLight: palette.limeLight,
  primaryMuted: palette.limeMuted,
  primaryBorder: palette.limeBorder,
  text: "#F2F1E9",
  textSecondary: "#C2C3B9",
  textTertiary: "#A9ADA3",
  textOnPrimary: "#1E1D1A",
  error: palette.errorRed,
  errorMuted: palette.errorRedMuted,
  warning: palette.warningAmber,
  warningMuted: palette.warningAmberMuted,
  success: palette.successGreen,
  successMuted: palette.successGreenMuted,
  info: palette.infoBlue,
  infoMuted: palette.infoBlueMuted,
  glass: "rgba(255,255,255,0.12)",
  glassSubtle: "rgba(255,255,255,0.08)",
  glassBorder: palette.glassBorder,
  backdrop: palette.backdropDark,
  skeletonBase: palette.dark700,
  skeletonHighlight: palette.dark500,
  tabBar: "rgba(30,29,26,0.72)",
  statusBar: "light",
};

export const lightColors: ThemeColors = {
  background: palette.light200,
  card: palette.light200,
  surface: palette.light300,
  border: palette.light400,
  primary: palette.limeDark,
  primaryDark: palette.limeDark,
  primaryLight: palette.limeLight,
  primaryMuted: palette.limeMuted,
  primaryBorder: palette.limeBorder,
  text: "#272620",
  // Darker semantic text preserves AA over the darkest mist surface.
  textSecondary: "#5C5D58",
  textTertiary: "#5C5D58",
  textOnPrimary: "#FFFFFF",
  error: palette.errorRed,
  errorMuted: palette.errorRedMuted,
  warning: palette.warningAmber,
  warningMuted: palette.warningAmberMuted,
  success: palette.successGreen,
  successMuted: palette.successGreenMuted,
  info: palette.infoBlue,
  infoMuted: palette.infoBlueMuted,
  glass: "rgba(255,255,255,0.55)",
  glassSubtle: "rgba(255,255,255,0.45)",
  glassBorder: "rgba(255,255,255,0.6)",
  backdrop: palette.backdropLight,
  skeletonBase: palette.light400,
  skeletonHighlight: palette.light300,
  tabBar: "rgba(255,255,255,0.55)",
  statusBar: "dark",
};

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 64,
} as const;

export type SpacingKey = keyof typeof spacing;

// ─── Border Radius ───────────────────────────────────────────────────────────

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

export type BorderRadiusKey = keyof typeof borderRadius;

// ─── Typography ──────────────────────────────────────────────────────────────

export interface TypographyVariant {
  fontSize: number;
  fontWeight: TextStyle["fontWeight"];
  lineHeight: number;
  letterSpacing?: number;
}

export const typography = {
  display: {
    fontSize: 48,
    fontWeight: "500" as const,
    lineHeight: 56,
    letterSpacing: -1.5,
  },
  h1: {
    fontSize: 32,
    fontWeight: "500" as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: "600" as const,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 28,
    letterSpacing: 0,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 14,
    fontWeight: "500" as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
} as const;

export type TypographyKey = keyof typeof typography;

// ─── Shadows ─────────────────────────────────────────────────────────────────

export const shadows = {
  /** Subtle card elevation */
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  /** Elevated glass panel */
  elevated: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  /** Glow effect for primary elements */
  glow: {
    shadowColor: palette.lime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  /** Subtle bottom sheet shadow */
  sheet: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
} as const;

// ─── Safe Area Defaults ──────────────────────────────────────────────────────

export const safeAreaDefaults = {
  /** Minimum top padding when no safe area */
  topFallback: 44,
  /** Minimum bottom padding when no safe area */
  bottomFallback: 34,
  /** Horizontal screen padding */
  horizontal: spacing.md,
} as const;

// ─── Animation Configs ───────────────────────────────────────────────────────

export const animations = {
  /** Snappy button press */
  press: {
    damping: 15,
    stiffness: 150,
    mass: 0.5,
  },
  /** Smooth entrance */
  enter: {
    damping: 20,
    stiffness: 120,
    mass: 0.8,
  },
  /** Gentle bounce */
  bounce: {
    damping: 12,
    stiffness: 180,
    mass: 0.6,
  },
  /** Quick snap for toggles */
  snap: {
    damping: 20,
    stiffness: 300,
    mass: 0.4,
  },
  /** Slow deceleration for sheets */
  sheet: {
    damping: 28,
    stiffness: 90,
    mass: 1.0,
  },
  /** Timing defaults */
  timing: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
} as const;

// ─── useTheme Hook ───────────────────────────────────────────────────────────

/**
 * Returns the resolved color set based on the current theme (dark or light).
 * Reads from the Zustand theme store.
 */
export function useTheme(): {
  colors: ThemeColors;
  isDark: boolean;
  colorScheme: "light" | "dark";
} {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === "dark";

  return {
    colors: isDark ? darkColors : lightColors,
    isDark,
    colorScheme: resolvedTheme,
  };
}
