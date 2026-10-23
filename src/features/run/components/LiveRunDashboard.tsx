/**
 * STRIDE — Live Run Metrics Display
 *
 * Huge typography inspired by Nike Run Club and Apple Fitness.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, GlassCard } from '../../../components/ui';
import { palette } from '../../../theme/tokens';
import { formatDuration } from '../../../utils/format';
import { formatDistance } from '../../../utils/distance';
import { formatPace } from '../../../utils/pace';
import type { RunStats } from '../../../types/run';
import type { UnitPreference } from '../../../types/user';
import { Flame, Mountain, Timer, Gauge } from 'lucide-react-native';

interface LiveRunDashboardProps {
  stats: RunStats;
  unit: UnitPreference;
}

export const LiveRunDashboard: React.FC<LiveRunDashboardProps> = ({ stats, unit }) => {
  const formattedDistance = formatDistance(stats.distanceMeters, unit);
  const formattedDuration = formatDuration(stats.durationSeconds);
  const currentPace = formatPace(stats.currentPaceSecondsPerKm, unit);
  const avgPace = formatPace(stats.avgPaceSecondsPerKm, unit);

  return (
    <View style={styles.container}>
      {/* Giant Pace Display */}
      <View style={styles.heroPaceContainer}>
        <Text variant="caption" color="dark300" style={styles.metricCaption}>
          CURRENT PACE
        </Text>
        <Text style={styles.heroPaceText}>{currentPace}</Text>
        <Text variant="bodySmall" color="lime" style={styles.unitSuffix}>
          /{unit === 'mi' ? 'mi' : 'km'}
        </Text>
      </View>

      {/* Grid of secondary metrics */}
      <View style={styles.grid}>
        {/* Distance */}
        <GlassCard style={styles.gridItem}>
          <View style={styles.labelRow}>
            <Gauge size={14} color="rgba(255, 255, 255, 0.5)" />
            <Text variant="caption" color="dark300">
              DISTANCE
            </Text>
          </View>
          <Text style={styles.gridValue}>{formattedDistance}</Text>
        </GlassCard>

        {/* Time */}
        <GlassCard style={styles.gridItem}>
          <View style={styles.labelRow}>
            <Timer size={14} color="rgba(255, 255, 255, 0.5)" />
            <Text variant="caption" color="dark300">
              TIME
            </Text>
          </View>
          <Text style={styles.gridValue}>{formattedDuration}</Text>
        </GlassCard>

        {/* Calories */}
        <GlassCard style={styles.gridItem}>
          <View style={styles.labelRow}>
            <Flame size={14} color="#FF9500" />
            <Text variant="caption" color="dark300">
              CALORIES
            </Text>
          </View>
          <Text style={styles.gridValue}>{stats.caloriesBurned} kcal</Text>
        </GlassCard>

        {/* Elevation */}
        <GlassCard style={styles.gridItem}>
          <View style={styles.labelRow}>
            <Mountain size={14} color="#00E676" />
            <Text variant="caption" color="dark300">
              ELEVATION
            </Text>
          </View>
          <Text style={styles.gridValue}>+{Math.round(stats.elevationGainM)} m</Text>
        </GlassCard>
      </View>

      {/* Average Pace Footer */}
      <View style={styles.avgPaceBar}>
        <Text variant="caption" color="dark300">
          Average Pace
        </Text>
        <Text variant="label" color="white" style={styles.avgPaceVal}>
          {avgPace} /{unit}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  heroPaceContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  metricCaption: {
    letterSpacing: 2,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  heroPaceText: {
    fontSize: 72,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -2,
    lineHeight: 74,
  },
  unitSuffix: {
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  gridValue: {
    fontSize: 22,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  avgPaceBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(185, 232, 218, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(185, 232, 218, 0.2)',
  },
  avgPaceVal: {
    fontWeight: '500',
  },
});
