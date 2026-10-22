/**
 * STRIDE — 7-Day Weekly Distance Bar Chart
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassCard, Text } from '../../../components/ui';
import { palette } from '../../../theme/tokens';
import type { UnitPreference } from '../../../types/user';

interface DayDistance {
  day: string; // 'M', 'T', 'W', 'T', 'F', 'S', 'S'
  distanceMeters: number;
  isToday: boolean;
}

interface WeeklyDistanceChartProps {
  unit: UnitPreference;
  days?: DayDistance[];
}

const DEFAULT_DAYS: DayDistance[] = [
  { day: 'M', distanceMeters: 5200, isToday: false },
  { day: 'T', distanceMeters: 4100, isToday: false },
  { day: 'W', distanceMeters: 6500, isToday: false },
  { day: 'T', distanceMeters: 0, isToday: false },
  { day: 'F', distanceMeters: 5800, isToday: false },
  { day: 'S', distanceMeters: 8400, isToday: false },
  { day: 'S', distanceMeters: 3800, isToday: true },
];

export const WeeklyDistanceChart: React.FC<WeeklyDistanceChartProps> = ({
  unit,
  days = DEFAULT_DAYS,
}) => {
  const maxMeters = Math.max(...days.map((d) => d.distanceMeters), 5000);
  const conversion = unit === 'mi' ? 1609.34 : 1000;
  const totalWeeklyKm = (
    days.reduce((acc, d) => acc + d.distanceMeters, 0) / conversion
  ).toFixed(1);

  return (
    <GlassCard variant="default" style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text variant="caption" color="dark300" style={styles.subTitle}>
            THIS WEEK
          </Text>
          <Text variant="h3" color="white" style={styles.title}>
            {totalWeeklyKm} {unit} Total
          </Text>
        </View>
        <View style={styles.legend}>
          <View style={styles.legendDot} />
          <Text variant="caption" color="lime">
            Active Days
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {days.map((item, index) => {
          const heightPercent = Math.max(8, Math.round((item.distanceMeters / maxMeters) * 100));
          const val = (item.distanceMeters / conversion).toFixed(1);

          return (
            <View key={index} style={styles.column}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${heightPercent}%` },
                    item.isToday
                      ? styles.todayBar
                      : item.distanceMeters > 0
                      ? styles.activeBar
                      : styles.restBar,
                  ]}
                />
              </View>
              <Text
                variant="caption"
                color={item.isToday ? 'lime' : item.distanceMeters > 0 ? 'white' : 'dark400'}
                style={[styles.dayLabel, item.isToday && styles.todayLabel]}
              >
                {item.day}
              </Text>
            </View>
          );
        })}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  subTitle: {
    letterSpacing: 1.5,
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    fontWeight: '800',
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.lime,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
  },
  column: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 24,
    height: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    padding: 2,
  },
  barFill: {
    width: '100%',
    borderRadius: 10,
  },
  todayBar: {
    backgroundColor: palette.lime,
    shadowColor: palette.lime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  activeBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  restBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dayLabel: {
    marginTop: 8,
    fontWeight: '600',
    fontSize: 12,
  },
  todayLabel: {
    fontWeight: '800',
  },
});
