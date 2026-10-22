/**
 * STRIDE — EmptyState Component
 *
 * Centered placeholder with icon, title, description, and optional CTA button.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useTheme, spacing } from '../../theme';
import { Text } from './Text';
import { Button } from './Button';
import type { ButtonVariant } from './Button';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  /** Icon element rendered above the title */
  icon?: React.ReactNode;
  /** Headline */
  title: string;
  /** Descriptive body text */
  description?: string;
  /** CTA button label */
  actionLabel?: string;
  /** CTA button handler */
  onAction?: () => void;
  /** CTA button variant */
  actionVariant?: ButtonVariant;
  /** Additional container style */
  style?: StyleProp<ViewStyle>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'primary',
  style,
}: EmptyStateProps): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.container, style]}
      accessibilityLabel={`${title}${description ? `. ${description}` : ''}`}
      accessibilityRole="summary"
    >
      {icon && <View style={styles.icon}>{icon}</View>}

      <Text variant="h3" center>
        {title}
      </Text>

      {description && (
        <Text
          variant="body"
          color="textSecondary"
          center
          style={styles.description}
        >
          {description}
        </Text>
      )}

      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant={actionVariant}
          size="md"
          style={styles.action}
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['4xl'],
  },
  icon: {
    marginBottom: spacing.xl,
  },
  description: {
    marginTop: spacing.xs,
    maxWidth: 280,
  },
  action: {
    marginTop: spacing.xl,
  },
});
