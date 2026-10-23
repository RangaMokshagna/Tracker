import React, { useContext, useId } from "react";
import { Image, StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { BlurTargetView } from "expo-blur";
import { NaturalBlurContext } from "./GlassSurface";
import { useTheme } from "../../theme/tokens";

/** The photograph is blurred once behind the reusable glass surfaces. */
export function LiquidBackdrop() {
  const target = useContext(NaturalBlurContext);
  const { isDark, colors } = useTheme();
  return (
    <BlurTargetView
      ref={target}
      pointerEvents="none"
      accessibilityElementsHidden
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}
    >
      <Image
        source={require("../../../assets/natural-forest.jpg")}
        blurRadius={24}
        resizeMode="cover"
        style={[StyleSheet.absoluteFill, { opacity: isDark ? 0.17 : 0.28 }]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark
              ? "rgba(30,29,26,0.62)"
              : "rgba(233,238,240,0.42)",
          },
        ]}
      />
    </BlurTargetView>
  );
}

export function GlassSheen() {
  const id = `sheen-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      style={StyleSheet.absoluteFill}
    >
      <Svg
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        viewBox="0 0 400 240"
      >
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop stopColor="#FFFFFF" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        <Rect width="400" height="240" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
