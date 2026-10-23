import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Text } from "../../../components/ui";
import { GlassMaterial } from "../../../components/ui/GlassSurface";
import { useTheme } from "../../../theme/tokens";
import { natural } from "../../../theme/natural";

export function CountdownOverlay({ count }: { count: number }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  useEffect(() => {
    void Haptics.selectionAsync().catch(() => {});
    scale.set(reduced ? 1 : 0.86);
    opacity.set(0);
    if (!reduced) scale.set(withTiming(1.05, { duration: 850 }));
    opacity.set(
      withSequence(
        withTiming(1, { duration: 180 }),
        withTiming(0.45, { duration: 650 }),
      ),
    );
  }, [count, reduced, opacity, scale]);
  const motion = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={`Starting in ${count}`}
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: 999,
          backgroundColor: colors.glass,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <GlassMaterial />
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 11,
          letterSpacing: 1.5,
        }}
      >
        TAKE A BREATH. FIND YOUR RHYTHM.
      </Text>
      <Animated.View style={motion}>
        <Text
          style={{
            fontFamily: natural.font.display,
            fontSize: 152,
            lineHeight: 185,
            color: colors.primary,
          }}
        >
          {count > 0 ? count : "Go"}
        </Text>
      </Animated.View>
      <Text
        style={{
          fontFamily: natural.font.display,
          fontSize: 28,
          color: colors.text,
        }}
      >
        Your next good moment.
      </Text>
    </View>
  );
}
