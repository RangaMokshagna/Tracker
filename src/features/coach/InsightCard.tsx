import React from "react";
import * as Haptics from "expo-haptics";
import { PanResponder, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import {
  Check,
  Footprints,
  Gauge,
  Moon,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react-native";
import { GlassSurface, Text } from "../../components/ui";
import { NaturalButton } from "../../components/ui/NaturalButton";
import { useTheme } from "../../theme/tokens";
import { natural } from "../../theme/natural";
import type { Insight } from "./types";

const icons = {
  check: Check,
  footprints: Footprints,
  pace: Gauge,
  rest: Moon,
  trend: TrendingUp,
  trophy: Trophy,
};
export function InsightCard({
  insight,
  index,
  onDismiss,
}: {
  insight: Insight;
  index: number;
  onDismiss: () => void;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const offset = useSharedValue(0),
    opacity = useSharedValue(1);
  const finish = () => {
    void Haptics.selectionAsync().catch(() => {});
    onDismiss();
  };
  const dismiss = () => {
    opacity.set(
      withTiming(0, { duration: reduced ? 120 : 180 }, (done) => {
        if (done) runOnJS(finish)();
      }),
    );
    if (!reduced) offset.set(withTiming(350, { duration: 180 }));
  };
  const responder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
    onPanResponderMove: (_, g) => {
      if (!reduced) offset.set(g.dx * 0.8);
    },
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > 90 || Math.abs(g.vx) > 0.8) dismiss();
      else offset.set(reduced ? 0 : withSpring(0, natural.motion.spring));
    },
    onPanResponderTerminate: () => offset.set(0),
  });
  const motion = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: offset.value }],
  }));
  const Icon = icons[insight.icon];
  return (
    <Animated.View
      entering={
        reduced
          ? FadeIn.duration(120)
          : FadeInDown.duration(300).delay(index * 40)
      }
      style={motion}
      {...responder.panHandlers}
    >
      <GlassSurface style={{ padding: 20, marginBottom: 12 }}>
        <View style={s.top}>
          <View
            style={[
              s.icon,
              {
                backgroundColor:
                  insight.severity === "warning"
                    ? natural.color.sandTint
                    : colors.primaryMuted,
              },
            ]}
          >
            <Icon size={19} strokeWidth={1.75} color={colors.text} />
          </View>
          <Text
            style={{
              flex: 1,
              fontSize: 17,
              fontWeight: "600",
              color: colors.text,
            }}
          >
            {insight.title}
          </Text>
          <NaturalButton
            accessibilityLabel={`Dismiss insight: ${insight.title}`}
            onPress={dismiss}
            style={s.close}
          >
            <X size={17} color={colors.textSecondary} />
          </NaturalButton>
        </View>
        <Text
          style={{
            fontSize: 13,
            lineHeight: 21,
            color: colors.textSecondary,
            marginTop: 12,
          }}
        >
          {insight.body}
        </Text>
      </GlassSurface>
    </Animated.View>
  );
}
const s = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  close: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -10,
  },
});
