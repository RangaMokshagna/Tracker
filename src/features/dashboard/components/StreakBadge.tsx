/**
 * STRIDE — Streak Counter & Badge Card
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassCard, Text } from '../../../components/ui';
import { palette } from '../../../theme/tokens';
import { Flame, Trophy } from 'lucide-react-native';

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ currentStreak, longestStreak }) => {
  return (
    <GlassCard variant="elevated" style={styles.card}>
      <View style={styles.content}>
        <View style={styles.streakLeft}>
          <View style={styles.iconCircle}>
            <Flame size={26} color="#FF9500" fill="#FF9500" />
          </View>
          <View style={styles.textBlock}>
            <View style={styles.numberRow}>
              <Text variant="h2" color="white" style={styles.streakNumber}>
                {currentStreak}
              </Text>
              <Text variant="h3" color="lime" style={styles.daySuffix}>
                {currentStreak === 1 ? 'DAY' : 'DAYS'}
              </Text>
            </View>
            <Text variant="caption" color="dark300">
              Active Running Streak
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.recordRight}>
          <Trophy size={18} color="#FFD700" />
          <Text variant="caption" color="dark300" style={styles.bestLabel}>
            Best: {longestStreak} days
          </Text>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  textBlock: {
    justifyContent: 'center',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  streakNumber: {
    fontWeight: '800',
    fontSize: 26,
    lineHeight: 30,
  },
  daySuffix: {
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  recordRight: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  bestLabel: {
    fontWeight: '600',
  },
});
