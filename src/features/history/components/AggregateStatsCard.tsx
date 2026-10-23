/**
 * STRIDE — Aggregate History Stats Glass Card
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { GlassCard, Text } from "../../../components/ui";
import { useTheme } from "../../../theme/tokens";
import { formatDistance } from "../../../utils/distance";
import { formatPace } from "../../../utils/pace";
import { formatDuration } from "../../../utils/format";
import type { UnitPreference } from "../../../types/user";

interface AggregateStatsCardProps {
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  totalRuns: number;
  avgPaceSecondsPerKm: number;
  totalCalories: number;
  unit: UnitPreference;
}

export const AggregateStatsCard: React.FC<AggregateStatsCardProps> = ({
  totalDistanceMeters,
  totalDurationSeconds,
  totalRuns,
  avgPaceSecondsPerKm,
  totalCalories,
  unit,
}) => {
  const { styles } = useStyles();
  const formattedDistance = formatDistance(totalDistanceMeters, unit);
  const formattedDuration = formatDuration(totalDurationSeconds);
  const formattedAvgPace = formatPace(avgPaceSecondsPerKm, unit);

  return (
    <GlassCard variant="elevated" style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text variant="caption" color="dark300" style={styles.periodLabel}>
            TOTAL DISTANCE
          </Text>
          <Text variant="display" color="white" style={styles.distanceVal}>
            {formattedDistance}
          </Text>
        </View>
        <View style={styles.runsPill}>
          <Text variant="caption" color="lime" style={styles.runsCount}>
            {totalRuns} {totalRuns === 1 ? "RUN" : "RUNS"}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomGrid}>
        <View style={styles.gridCell}>
          <Text variant="caption" color="dark300">
            Avg Pace
          </Text>
          <Text variant="label" color="white" style={styles.cellVal}>
            {formattedAvgPace} /{unit}
          </Text>
        </View>

        <View style={styles.gridCell}>
          <Text variant="caption" color="dark300">
            Total Time
          </Text>
          <Text variant="label" color="white" style={styles.cellVal}>
            {formattedDuration}
          </Text>
        </View>

        <View style={styles.gridCell}>
          <Text variant="caption" color="dark300">
            Calories
          </Text>
          <Text variant="label" color="white" style={styles.cellVal}>
            {totalCalories} kcal
          </Text>
        </View>
      </View>
    </GlassCard>
  );
};

const useStyles = () => {
  const { colors, isDark } = useTheme();
  const styles = StyleSheet.create({
    card: {
      marginHorizontal: 20,
      marginVertical: 8,
      padding: 18,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    periodLabel: {
      letterSpacing: 1.5,
      fontSize: 11,
      fontWeight: "500",
    },
    distanceVal: {
      fontSize: 34,
      fontWeight: "300",
      marginTop: 2,
    },
    runsPill: {
      backgroundColor: colors.primaryMuted,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
    },
    runsCount: {
      fontWeight: "500",
      letterSpacing: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.glassSubtle,
      marginVertical: 14,
    },
    bottomGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    gridCell: {
      alignItems: "flex-start",
    },
    cellVal: {
      fontWeight: "500",
      marginTop: 4,
    },
  });
  return { styles, colors, isDark };
};
