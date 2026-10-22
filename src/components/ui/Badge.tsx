/**
 * STRIDE — Badge / Chip Component
 *
 * Small badge with semantic color variants and optional icon support.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useTheme, borderRadius, spacing } from '../../theme';
import { Text } from './Text';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface BadgeProps {
  /** Badge label */
  label: string;
  /** Semantic variant */
  variant?: BadgeVariant;
  /** Optional icon rendered to the left */
  icon?: React.ReactNode;
  /** Additional style */
  style?: StyleProp<ViewStyle>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Badge({
  label,
  variant = 'neutral',
  icon,
  style,
}: BadgeProps): React.JSX.Element {
  const { colors } = useTheme();

  const getVariantColors = (): { bg: string; text: string } => {
    switch (variant) {
      case 'success':
        return { bg: colors.successMuted, text: colors.success };
      case 'warning':
        return { bg: colors.warningMuted, text: colors.warning };
      case 'error':
        return { bg: colors.errorMuted, text: colors.error };
      case 'info':
        return { bg: colors.infoMuted, text: colors.info };
      case 'neutral':
        return { bg: colors.glass, text: colors.textSecondary };
    }
  };

  const variantColors = getVariantColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: variantColors.bg,
          borderRadius: borderRadius.full,
        },
        style,
      ]}
      accessibilityLabel={label}
      accessibilityRole="text"
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        variant="caption"
        color={variantColors.text as any}
        style={styles.label}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: spacing.xxs,
  },
  label: {
    fontWeight: '600',
  },
});
