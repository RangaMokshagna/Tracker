/**
 * STRIDE — Post-Run Summary & AI Insight Modal
 */

import React, { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, GlassCard, Text } from "../../../components/ui";
import { palette, useTheme } from "../../../theme/tokens";
import { formatDuration } from "../../../utils/format";
import { formatDistance } from "../../../utils/distance";
import { formatPace } from "../../../utils/pace";
import { generatePostRunInsight } from "../../../services/ai";
import type { RunStats } from "../../../types/run";
import type { UnitPreference } from "../../../types/user";
import type { PostRunInsight } from "../../../types/ai";
import { Sparkles, Trophy, Check } from "lucide-react-native";

interface PostRunModalProps {
  visible: boolean;
  stats: RunStats;
  unit: UnitPreference;
  onSave: () => void;
  onDiscard: () => void;
}

export const PostRunModal: React.FC<PostRunModalProps> = ({
  visible,
  stats,
  unit,
  onSave,
  onDiscard,
}) => {
  const { styles, colors } = useStyles();
  const [insight, setInsight] = useState<PostRunInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(true);

  useEffect(() => {
    if (visible && stats.distanceMeters > 0) {
      setLoadingInsight(true);
      generatePostRunInsight({
        distanceMeters: stats.distanceMeters,
        durationSeconds: stats.durationSeconds,
        avgPaceSecondsPerKm: stats.avgPaceSecondsPerKm,
        splitsCount: stats.splits.length,
        bestPaceSecondsPerKm: stats.bestPaceSecondsPerKm,
      })
        .then((res) => setInsight(res))
        .finally(() => setLoadingInsight(false));
    }
  }, [visible, stats.distanceMeters]);

  if (!visible) return null;

  const formattedDistance = formatDistance(stats.distanceMeters, unit);
  const formattedDuration = formatDuration(stats.durationSeconds);
  const formattedAvgPace = formatPace(stats.avgPaceSecondsPerKm, unit);
  const formattedBestPace = stats.bestPaceSecondsPerKm
    ? formatPace(stats.bestPaceSecondsPerKm, unit)
    : "--:--";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalBg}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Header celebration */}
          <View style={styles.header}>
            <View style={styles.trophyCircle}>
              <Trophy size={36} color={palette.lime} />
            </View>
            <Text variant="caption" color="lime" style={styles.congratsLabel}>
              SESSION COMPLETE
            </Text>
            <Text variant="display" color="white" style={styles.distanceHero}>
              {formattedDistance}
            </Text>
            <Text variant="bodySmall" color="dark300">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>

          {/* Primary 4-Metric Grid */}
          <GlassCard variant="elevated" style={styles.metricsCard}>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text variant="caption" color="dark300">
                  DURATION
                </Text>
                <Text style={styles.metricVal}>{formattedDuration}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text variant="caption" color="dark300">
                  AVG PACE
                </Text>
                <Text style={styles.metricVal}>
                  {formattedAvgPace} /{unit}
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text variant="caption" color="dark300">
                  CALORIES
                </Text>
                <Text style={styles.metricVal}>
                  {stats.caloriesBurned} kcal
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text variant="caption" color="dark300">
                  BEST PACE
                </Text>
                <Text style={styles.metricVal}>
                  {formattedBestPace} /{unit}
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* AI 3-Line Post-Run Insight */}
          <GlassCard variant="default" style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Sparkles size={18} color={palette.lime} />
              <Text variant="label" color="lime" style={styles.aiTitle}>
                AI COACH 3-LINE ANALYSIS
              </Text>
            </View>

            {loadingInsight ? (
              <Text
                variant="bodySmall"
                color="dark300"
                style={styles.loadingAi}
              >
                Synthesizing pace dynamics & recovery metrics...
              </Text>
            ) : (
              <View style={styles.insightLines}>
                <View style={styles.lineRow}>
                  <Text variant="caption" color="lime" style={styles.bullet}>
                    •
                  </Text>
                  <Text
                    variant="bodySmall"
                    color="white"
                    style={styles.insightText}
                  >
                    <Text style={{ fontWeight: "700" }}>Pace Trend: </Text>
                    {insight?.paceTrend}
                  </Text>
                </View>
                <View style={styles.lineRow}>
                  <Text variant="caption" color="lime" style={styles.bullet}>
                    •
                  </Text>
                  <Text
                    variant="bodySmall"
                    color="white"
                    style={styles.insightText}
                  >
                    <Text style={{ fontWeight: "700" }}>Effort: </Text>
                    {insight?.effortAssessment}
                  </Text>
                </View>
                <View style={styles.lineRow}>
                  <Text variant="caption" color="lime" style={styles.bullet}>
                    •
                  </Text>
                  <Text
                    variant="bodySmall"
                    color="white"
                    style={styles.insightText}
                  >
                    <Text style={{ fontWeight: "700" }}>Next Step: </Text>
                    {insight?.improvementTip}
                  </Text>
                </View>
              </View>
            )}
          </GlassCard>

          {/* Splits Table (if any) */}
          {stats.splits.length > 0 && (
            <GlassCard variant="default" style={styles.splitsCard}>
              <Text variant="label" color="white" style={styles.splitsTitle}>
                SPLITS BREAKDOWN
              </Text>
              {stats.splits.map((s) => (
                <View key={s.number} style={styles.splitRow}>
                  <Text variant="caption" color="dark300" style={{ width: 60 }}>
                    {unit === "mi" ? "Mi" : "Km"} {s.number}
                  </Text>
                  <Text variant="label" color="white">
                    {formatPace(s.paceSecondsPerKm, unit)} /{unit}
                  </Text>
                  <Text variant="caption" color="dark400">
                    {s.elevationChangeM !== null
                      ? `${s.elevationChangeM > 0 ? "+" : ""}${s.elevationChangeM}m`
                      : "-"}
                  </Text>
                </View>
              ))}
            </GlassCard>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              variant="primary"
              size="lg"
              label="SAVE RUN TO LOG"
              icon={<Check size={20} color={colors.textOnPrimary} />}
              onPress={onSave}
              style={{ marginBottom: 12 }}
            />
            <Button
              variant="ghost"
              size="md"
              label="Discard Run"
              onPress={onDiscard}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const useStyles = () => {
  const { colors, isDark } = useTheme();
  const styles = StyleSheet.create({
    modalBg: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      padding: 20,
      paddingBottom: 40,
    },
    header: {
      alignItems: "center",
      marginVertical: 16,
    },
    trophyCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: colors.primaryMuted,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    congratsLabel: {
      letterSpacing: 2,
      fontSize: 11,
      fontWeight: "500",
    },
    distanceHero: {
      fontSize: 44,
      fontWeight: "300",
      marginTop: 4,
    },
    metricsCard: {
      padding: 16,
      marginVertical: 10,
    },
    metricsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
    },
    metricItem: {
      width: "45%",
    },
    metricVal: {
      fontSize: 20,
      fontWeight: "500",
      color: colors.text,
      marginTop: 4,
    },
    aiCard: {
      padding: 16,
      marginVertical: 10,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
    },
    aiHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    aiTitle: {
      fontWeight: "500",
      letterSpacing: 1,
      fontSize: 12,
    },
    loadingAi: {
      fontStyle: "italic",
      paddingVertical: 8,
    },
    insightLines: {
      gap: 10,
    },
    lineRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    bullet: {
      fontSize: 16,
      lineHeight: 20,
    },
    insightText: {
      flex: 1,
      lineHeight: 20,
    },
    splitsCard: {
      padding: 16,
      marginVertical: 10,
    },
    splitsTitle: {
      fontWeight: "500",
      letterSpacing: 1,
      fontSize: 12,
      marginBottom: 12,
    },
    splitRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255, 255, 255, 0.05)",
    },
    actions: {
      marginTop: 20,
    },
  });
  return { styles, colors, isDark };
};
