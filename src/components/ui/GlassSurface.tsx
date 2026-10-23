import React, { createContext, useContext, useId, useRef } from "react";
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Pattern,
  Rect,
  Stop,
} from "react-native-svg";
import { useTheme } from "../../theme/tokens";
import { natural } from "../../theme/natural";

type Target = React.RefObject<React.ComponentRef<typeof View> | null>;
export const NaturalBlurContext = createContext<Target | undefined>(undefined);
export function NaturalScene({ children }: { children: React.ReactNode }) {
  const target = useRef<React.ComponentRef<typeof View>>(null);
  return (
    <NaturalBlurContext.Provider value={target}>
      {children}
    </NaturalBlurContext.Provider>
  );
}

export function GlassMaterial({ blurTarget }: { blurTarget?: Target }) {
  const id = useId().replace(/:/g, "");
  const inherited = useContext(NaturalBlurContext);
  const target = blurTarget || inherited;
  const { isDark } = useTheme();
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      {(Platform.OS !== "android" ||
        (target && Number(Platform.Version) >= 31)) && (
        <BlurView
          tint={isDark ? "dark" : "light"}
          intensity={natural.glass.blur}
          blurTarget={target}
          blurMethod={target ? "dimezisBlurViewSdk31Plus" : "none"}
          style={[
            StyleSheet.absoluteFill,
            Platform.OS === "web" &&
              ({
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                backdropFilter: "blur(28px) saturate(160%)",
                WebkitBackdropFilter: "blur(28px) saturate(160%)",
              } as ViewStyle),
          ]}
        />
      )}
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 400 300"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
            <Stop stopColor="#FFFFFF" stopOpacity="0.7" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.1" />
          </LinearGradient>
          <Pattern
            id={`${id}-grain`}
            width="7"
            height="9"
            patternUnits="userSpaceOnUse"
          >
            <Circle cx="1" cy="2" r="0.45" fill="#272620" opacity="0.025" />
            <Circle cx="5" cy="7" r="0.5" fill="#FFFFFF" opacity="0.03" />
          </Pattern>
        </Defs>
        <Rect width="400" height="300" fill={`url(#${id}-grain)`} />
        <Rect
          x="0.5"
          y="0.5"
          width="399"
          height="299"
          rx="28"
          fill="none"
          stroke={`url(#${id}-edge)`}
        />
      </Svg>
    </View>
  );
}

export function GlassSurface({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { isDark } = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: natural.glass.radius,
          backgroundColor: isDark ? natural.glass.dark : natural.glass.light,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: isDark
            ? "rgba(255,255,255,0.12)"
            : "rgba(255,255,255,0.6)",
          shadowColor: natural.color.ink,
          shadowOpacity: 0.1,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
        },
        style,
      ]}
    >
      <GlassMaterial />
      {children}
    </View>
  );
}
