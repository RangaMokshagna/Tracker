import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Text } from "./Text";
import { natural } from "../../theme/natural";
import { useTheme } from "../../theme/tokens";

function Digit({
  digit,
  size,
  color,
}: {
  digit: string;
  size: number;
  color: string;
}) {
  const [last, setLast] = useState({ previous: digit, current: digit });
  if (last.current !== digit)
    setLast({ previous: last.current, current: digit });
  const motion = useSharedValue(1);
  const reduced = useReducedMotion();
  useEffect(() => {
    motion.set(0);
    motion.set(withTiming(1, { duration: reduced ? 120 : 300 }));
  }, [digit, motion, reduced]);
  const current = useAnimatedStyle(() => ({
    opacity: motion.value,
    transform: reduced ? [] : [{ translateY: (1 - motion.value) * size * 1.2 }],
  }));
  const previous = useAnimatedStyle(() => ({
    opacity: 1 - motion.value,
    transform: reduced ? [] : [{ translateY: -motion.value * size * 1.2 }],
  }));
  const style = {
    fontFamily: natural.font.display,
    fontSize: size,
    lineHeight: size * 1.2,
    color,
    fontWeight: "400" as const,
  };
  return (
    <View
      style={{
        width: digit === "." ? size * 0.22 : size * 0.49,
        height: size * 1.2,
        overflow: "hidden",
      }}
    >
      <Animated.View style={[StyleSheet.absoluteFill, previous]}>
        <Text style={style}>{last.previous}</Text>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, current]}>
        <Text style={style}>{digit}</Text>
      </Animated.View>
    </View>
  );
}

export function AnimatedNumber({
  value,
  size = 34,
  color,
}: {
  value: number | string;
  size?: number;
  color?: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={String(value)}
      style={{ flexDirection: "row" }}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ flexDirection: "row" }}
      >
        {String(value)
          .split("")
          .map((digit, index) => (
            <Digit
              key={index}
              digit={digit}
              size={size}
              color={color || colors.text}
            />
          ))}
      </View>
    </View>
  );
}
