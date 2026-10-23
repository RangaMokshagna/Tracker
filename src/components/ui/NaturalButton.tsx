import React from "react";
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { natural } from "../../theme/natural";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export function NaturalButton({
  children,
  style,
  onPressIn,
  onPressOut,
  onPress,
  ...props
}: Omit<PressableProps, "style" | "children"> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useSharedValue(1);
  const reduced = useReducedMotion();
  const motion = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedPressable
      {...props}
      accessibilityRole={props.accessibilityRole || "button"}
      onPressIn={(event) => {
        scale.set(reduced ? 1 : withSpring(0.96, natural.motion.spring));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(reduced ? 1 : withSpring(1, natural.motion.spring));
        onPressOut?.(event);
      }}
      onPress={(event) => {
        void Haptics.selectionAsync().catch(() => {});
        onPress?.(event);
      }}
      style={[{ minHeight: 44, minWidth: 44 }, style, motion]}
    >
      {children}
    </AnimatedPressable>
  );
}
