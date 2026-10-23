/**
 * STRIDE — Recent Run Glass Card
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassCard, Text } from '../../../components/ui';
import { palette } from '../../../theme/tokens';
import { formatDuration } from '../../../utils/format';
import { formatDistance } from '../../../utils/distance';
import { formatPace } from '../../../utils/pace';
import type { UnitPreference } from '../../../types/user';
import { ChevronRight, Zap } from 'lucide-react-native';

export interface RecentRunItem {
  id: string;
  date: string;
  distanceMeters: number;
  durationSeconds: number;
  avgPaceSecondsPerKm: number;
  caloriesBurned: number;
}

interface RecentRunCardProps {
  run: RecentRunItem;
  unit: UnitPreference;
  onPress: () => void;
  inset?: number;
}

export const RecentRunCard: React.FC<RecentRunCardProps> = ({ run, unit, onPress, inset = 16 }) => {
  const formattedDistance = formatDistance(run.distanceMeters, unit);
  const formattedDuration = formatDuration(run.durationSeconds);
  const formattedPace = formatPace(run.avgPaceSecondsPerKm, unit);

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <GlassCard variant="default" style={[styles.card, { marginHorizontal: inset }]}>
        <View style={styles.content}>
          <View style={styles.leftCol}>
            <View style={styles.dateRow}>
              <Zap size={14} color={palette.lime} />
              <Text variant="caption" color="dark300">
                {run.date}
              </Text>
            </View>
            <Text variant="h2" color="white" style={styles.distanceText}>
              {formattedDistance}
            </Text>
          </View>

          <View style={styles.statsCol}>
            <View style={styles.statItem}>
              <Text variant="caption" color="dark300">
                Pace
              </Text>
              <Text variant="label" color="white" style={styles.statVal}>
                {formattedPace}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="caption" color="dark300">
                Time
              </Text>
              <Text variant="label" color="white" style={styles.statVal}>
                {formattedDuration}
              </Text>
            </View>
          </View>

          <View style={styles.arrowCol}>
            <ChevronRight size={20} color="rgba(255, 255, 255, 0.4)" />
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 0,
    marginVertical: 6,
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: 1.2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  distanceText: {
    fontWeight: '500',
    fontSize: 22,
  },
  statsCol: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statVal: {
    fontWeight: '700',
    marginTop: 2,
  },
  arrowCol: {
    paddingLeft: 8,
  },
});
