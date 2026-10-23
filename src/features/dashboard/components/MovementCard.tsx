import React, { useId } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { ArrowUpRight, Footprints, Play } from "lucide-react-native";
import { GlassCard, Text } from "../../../components/ui";
import { palette, useTheme } from "../../../theme/tokens";
import { natural } from "../../../theme/natural";

/** Keep artwork decorative and live metrics crisp above its contrast scrim. */
function Horizon() {
  const { colors } = useTheme();
  const id = `horizon-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <>
      <Image
        source={require("../../../../assets/natural-trail.jpg")}
        resizeMode="cover"
        style={[StyleSheet.absoluteFill, { left: "-16%" }]}
        accessible={false}
      />
      <Svg
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        viewBox="0 0 360 204"
      >
        <Defs>
          <LinearGradient id={id} x1="0" y1="0.6" x2="1" y2="0.3">
            <Stop stopColor={colors.background} stopOpacity="0.94" />
            <Stop
              offset="0.58"
              stopColor={colors.background}
              stopOpacity="0.55"
            />
            <Stop offset="1" stopColor={colors.background} stopOpacity="0.08" />
          </LinearGradient>
        </Defs>
        <Rect width="360" height="204" fill={`url(#${id})`} />
      </Svg>
    </>
  );
}

export function MovementCard({
  distance,
  unit,
  goal,
  progress,
  onStart,
}: {
  distance: string;
  unit: string;
  goal: string;
  progress: number;
  onStart: () => void;
}) {
  const { styles, colors } = useStyles();
  const completion = Math.max(0, Math.min(1, progress));
  return (
    <GlassCard style={styles.card}>
      <View style={styles.scene}>
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={StyleSheet.absoluteFill}
        >
          <Horizon />
        </View>
        <View style={styles.heading}>
          <View style={styles.badge}>
            <Footprints size={15} color={palette.lime} />
            <View style={styles.badgeDivider} />
            <Text style={styles.eyebrow}>TODAY’S MOVEMENT</Text>
          </View>
        </View>
        <View style={styles.metric}>
          <Text style={styles.distance} adjustsFontSizeToFit numberOfLines={1}>
            {distance}
            <Text style={styles.unit}> {unit}</Text>
          </Text>
          <Text style={styles.caption}>A little closer to your goal.</Text>
        </View>
      </View>
      <View style={styles.details}>
        <View style={styles.goalRow}>
          <View>
            <Text style={styles.goalLabel}>Your daily goal</Text>
            <Text style={styles.goalValue}>
              {goal} <Text style={styles.goalUnit}>{unit}</Text>
            </Text>
          </View>
          <View style={styles.percentBadge}>
            <Text style={styles.percent}>{Math.round(completion * 100)}%</Text>
            <Text style={styles.percentLabel}>complete</Text>
          </View>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Daily distance goal"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(completion * 100),
          }}
          style={styles.track}
        >
          <View style={[styles.fill, { width: `${completion * 100}%` }]} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start a run"
          onPress={onStart}
          style={({ pressed }) => [styles.start, pressed && styles.pressed]}
        >
          <View style={styles.play}>
            <Play
              size={16}
              color={colors.textOnPrimary}
              fill={colors.textOnPrimary}
            />
          </View>
          <View style={styles.startCopy}>
            <Text style={styles.startTitle}>Let’s go for a run</Text>
            <Text style={styles.startSubtitle}>Your next good moment.</Text>
          </View>
          <ArrowUpRight size={21} color={palette.limeLight} />
        </Pressable>
      </View>
    </GlassCard>
  );
}

const useStyles = () => {
  const { colors, isDark } = useTheme();
  const styles = StyleSheet.create({
    card: {
      padding: 7,
      borderRadius: 34,
      marginBottom: 24,
      backgroundColor: colors.glass,
      borderColor: "rgba(224,242,235,0.24)",
      borderTopColor: "rgba(243,250,245,0.45)",
    },
    scene: {
      minHeight: 216,
      borderRadius: 27,
      overflow: "hidden",
      justifyContent: "space-between",
      padding: 17,
      backgroundColor: "#344D56",
    },
    heading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 20,
      backgroundColor: colors.primaryMuted,
      borderWidth: 1,
      borderColor: "rgba(229,245,233,0.15)",
    },
    badgeDivider: {
      width: 1,
      height: 16,
      backgroundColor: colors.primaryMuted,
    },
    eyebrow: {
      fontSize: 11,
      letterSpacing: 0.6,
      fontWeight: "600",
      color: colors.text,
    },
    metric: { marginTop: 38, maxWidth: "82%" },
    distance: {
      fontSize: 66,
      lineHeight: 76,
      letterSpacing: -2.5,
      fontFamily: natural.font.display,
      fontWeight: "400",
      color: colors.text,
      fontVariant: ["tabular-nums"],
    },
    unit: {
      fontSize: 17,
      letterSpacing: -0.3,
      fontWeight: "400",
      color: colors.textSecondary,
    },
    caption: {
      fontSize: 11,
      lineHeight: 17,
      color: colors.textSecondary,
      marginTop: 2,
    },
    details: { paddingHorizontal: 10, paddingTop: 17, paddingBottom: 3 },
    goalRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    goalLabel: { fontSize: 11, lineHeight: 16, color: colors.textSecondary },
    goalValue: {
      fontSize: 21,
      lineHeight: 28,
      color: colors.text,
      fontWeight: "400",
    },
    goalUnit: { fontSize: 12, color: colors.textSecondary },
    percentBadge: { alignItems: "flex-end" },
    percent: {
      fontSize: 21,
      lineHeight: 26,
      color: colors.primary,
      fontWeight: "400",
      fontVariant: ["tabular-nums"],
    },
    percentLabel: { fontSize: 11, lineHeight: 14, color: colors.textSecondary },
    track: {
      height: 4,
      backgroundColor: "rgba(229,245,233,0.13)",
      borderRadius: 4,
      overflow: "hidden",
      marginTop: 12,
      marginBottom: 17,
    },
    fill: { height: "100%", borderRadius: 4, backgroundColor: colors.primary },
    start: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minHeight: 70,
      padding: 12,
      borderRadius: 24,
      backgroundColor: colors.primary,
      borderWidth: 1,
      borderColor: "rgba(229,245,233,0.1)",
    },
    pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
    play: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    startCopy: { flex: 1 },
    startTitle: {
      fontSize: 15,
      lineHeight: 21,
      fontWeight: "500",
      color: colors.textOnPrimary,
    },
    startSubtitle: {
      fontSize: 11,
      lineHeight: 16,
      color: colors.textOnPrimary,
      marginTop: 2,
    },
  });
  return { styles, colors, isDark };
};
