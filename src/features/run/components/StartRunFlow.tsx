import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  Activity,
  ArrowLeft,
  ChevronRight,
  Footprints,
  Minus,
  Mountain,
  Plus,
} from "lucide-react-native";
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import * as Haptics from "expo-haptics";
import { BlurTargetView } from "expo-blur";
import { GlassCard, Text } from "../../../components/ui";
import {
  GlassMaterial,
  NaturalScene,
} from "../../../components/ui/GlassSurface";
import { LiquidBackdrop } from "../../../components/ui/LiquidBackdrop";
import { NaturalButton } from "../../../components/ui/NaturalButton";
import { AnimatedNumber } from "../../../components/ui/AnimatedNumber";
import { natural } from "../../../theme/natural";
import { useTheme } from "../../../theme/tokens";
import { useRunStore } from "../../../store/run";
import { useAuthStore } from "../../../store/auth";
import { calculateCalories } from "../../../utils/calories";

const tick = () => {
  void Haptics.selectionAsync().catch(() => {});
};
const SPRING = natural.motion.spring;
function WaveChevron({ delay }: { delay: number }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.35);
  useEffect(() => {
    if (!reduced)
      opacity.set(
        withDelay(
          delay,
          withRepeat(withTiming(0.9, { duration: 700 }), -1, true),
        ),
      );
    return () => cancelAnimation(opacity);
  }, [delay, opacity, reduced]);
  const motion = useAnimatedStyle(() => ({
    opacity: reduced ? 0.6 : opacity.value,
  }));
  return (
    <Animated.View style={motion}>
      <ChevronRight color={colors.primaryDark} size={14} />
    </Animated.View>
  );
}

export function SlideButton({
  label,
  onComplete,
}: {
  label: string;
  onComplete: () => void;
}) {
  const { colors, isDark } = useTheme();
  const [width, setWidth] = useState(0);
  const [ready, setReady] = useState(false);
  const position = useSharedValue(0);
  const reduced = useReducedMotion();
  const completed = useRef(false);
  const travel = Math.max(0, width - 64);
  useFocusEffect(
    useCallback(() => {
      completed.current = false;
      position.set(0);
      setReady(false);
    }, [position]),
  );
  const finish = () => {
    if (completed.current) return;
    completed.current = true;
    tick();
    onComplete();
  };
  // PanResponder stores callbacks; completion reads its ref only after user input.
  // eslint-disable-next-line react-hooks/refs
  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponderCapture: (_, gesture) =>
      Math.abs(gesture.dx) > 6 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderMove: (_, gesture) => {
      position.set(Math.max(0, Math.min(travel, gesture.dx)));
      setReady(gesture.dx >= travel * 0.8);
    },
    onPanResponderRelease: (_, gesture) => {
      if (travel && gesture.dx >= travel * 0.8) finish();
      else {
        position.set(reduced ? 0 : withSpring(0, SPRING));
        setReady(false);
      }
    },
    onPanResponderTerminate: () => {
      position.set(reduced ? 0 : withSpring(0, SPRING));
      setReady(false);
    },
  });
  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value }],
  }));
  const fill = useAnimatedStyle(() => ({
    transform: [
      { scaleX: Math.max(0, (position.value + 56) / Math.max(1, width - 8)) },
    ],
  }));
  const normalLabel = useAnimatedStyle(() => ({
    opacity: interpolate(
      position.value / Math.max(1, travel),
      [0.6, 0.8],
      [1, 0],
      "clamp",
    ),
  }));
  const releaseLabel = useAnimatedStyle(() => ({
    opacity: interpolate(
      position.value / Math.max(1, travel),
      [0.6, 0.8],
      [0, 1],
      "clamp",
    ),
  }));
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityHint="Swipe up to confirm, or drag the thumb to the right"
      accessibilityValue={{ min: 0, max: 100, now: ready ? 100 : 0 }}
      accessibilityActions={[
        { name: "increment", label: "Confirm" },
        { name: "activate", label: "Confirm" },
      ]}
      onAccessibilityAction={(event) => {
        if (["activate", "increment"].includes(event.nativeEvent.actionName))
          finish();
      }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[
        s.slider,
        { backgroundColor: colors.glass, borderColor: colors.glassBorder },
      ]}
    >
      <Animated.View pointerEvents="none" style={[s.sliderFill, fill]}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 300 56"
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient id={`slide-${label.replace(/\s/g, "")}`}>
              <Stop stopColor={natural.color.sageTint} />
              <Stop
                offset="1"
                stopColor={natural.color.sage}
                stopOpacity="0.45"
              />
            </LinearGradient>
          </Defs>
          <Rect
            width="300"
            height="56"
            rx="28"
            fill={`url(#slide-${label.replace(/\s/g, "")})`}
          />
        </Svg>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[s.sliderLabel, normalLabel]}>
        <Text
          style={{
            color: colors.text,
            fontSize: 15,
            fontFamily: natural.font.medium,
          }}
        >
          {label}
        </Text>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[s.sliderLabel, releaseLabel]}>
        <Text
          style={{
            color: isDark ? colors.text : natural.color.ink,
            fontSize: 13,
          }}
        >
          Release to start
        </Text>
      </Animated.View>
      <View pointerEvents="none" style={s.wave}>
        {[0, 120, 240].map((delay) => (
          <WaveChevron key={delay} delay={delay} />
        ))}
      </View>
      <Animated.View style={[s.thumb, thumb]} {...pan.panHandlers}>
        <Pressable
          accessible={false}
          accessibilityElementsHidden
          onPress={finish}
          style={s.thumbPress}
        >
          <ChevronRight color="#FFFFFF" size={23} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

export function RunHero() {
  const router = useRouter();
  const { colors } = useTheme();
  const blurTarget = useRef<React.ComponentRef<typeof View>>(null);
  const reduced = useReducedMotion();
  const zoom = useSharedValue(1);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!reduced)
      zoom.set(
        withRepeat(
          withTiming(1.06, {
            duration: 20000,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true,
        ),
      );
    return () => cancelAnimation(zoom);
  }, [zoom, reduced]);
  const photoMotion = useAnimatedStyle(() => ({
    transform: [{ scale: zoom.value }, { translateY: (zoom.value - 1) * -50 }],
  }));
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BlurTargetView ref={blurTarget} style={StyleSheet.absoluteFill}>
        <Animated.Image
          source={require("../../../../assets/natural-trail.jpg")}
          style={[StyleSheet.absoluteFill, photoMotion]}
          resizeMode="cover"
        />
      </BlurTargetView>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 400 900"
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient id="run-photo-shade" x1="0" y1="0" x2="0" y2="1">
              <Stop stopColor="#1E1D1A" stopOpacity="0.18" />
              <Stop offset="0.45" stopColor="#1E1D1A" stopOpacity="0.03" />
              <Stop offset="1" stopColor="#1E1D1A" stopOpacity="0.62" />
            </LinearGradient>
          </Defs>
          <Rect width="400" height="900" fill="url(#run-photo-shade)" />
        </Svg>
      </View>
      <SafeAreaView style={s.heroContent}>
        <Text style={s.heroEyebrow}>STRIDE / THE WORLD IS YOUR ROUTE</Text>
        <Animated.View
          entering={reduced ? FadeIn.duration(150) : FadeInDown.duration(500)}
          style={{ paddingBottom: 88 + insets.bottom }}
        >
          <GlassCard style={{ padding: 24, borderRadius: 28 }}>
            <GlassMaterial blurTarget={blurTarget} />
            <Text style={[s.heroTitle, { color: colors.text }]}>
              <Text style={[s.heroTitle, { color: colors.primaryDark }]}>
                Run
              </Text>{" "}
              Into{"\n"}Adventure
            </Text>
            <Text style={[s.heroSubtitle, { color: colors.textSecondary }]}>
              Every Run Is A Story Waiting To Be Written.
            </Text>
            <SlideButton
              label="Get Started"
              onComplete={() => router.push("/run-setup")}
            />
          </GlassCard>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const MODES = [
  {
    id: "outdoor",
    label: "Outdoor",
    Icon: Footprints,
    color: natural.color.sageTint,
  },
  {
    id: "trail",
    label: "Trail",
    Icon: Mountain,
    color: natural.color.sandTint,
  },
  {
    id: "treadmill",
    label: "Treadmill",
    Icon: Activity,
    color: natural.color.mistDeep,
  },
] as const;
export type RunMode = (typeof MODES)[number]["id"];
function ModeChip({
  mode,
  selected,
  onPress,
}: {
  mode: (typeof MODES)[number];
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.set(reduced ? 1 : withSpring(selected ? 1.03 : 1, SPRING));
  }, [selected, reduced, scale]);
  const motion = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={[{ flex: 1 }, motion]}>
      <NaturalButton
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={mode.label}
        onPress={onPress}
        style={[
          s.modeChip,
          {
            backgroundColor: selected
              ? natural.color.sagePressed
              : colors.glass,
            borderColor: selected
              ? natural.color.sagePressed
              : colors.glassBorder,
          },
        ]}
      >
        <mode.Icon
          size={17}
          strokeWidth={1.75}
          color={selected ? "#FFFFFF" : colors.textSecondary}
        />
        <Text
          style={{
            fontSize: 11,
            color: selected ? "#FFFFFF" : colors.text,
            fontFamily: natural.font.medium,
          }}
        >
          {mode.label}
        </Text>
      </NaturalButton>
    </Animated.View>
  );
}
export function ModeChips({
  value,
  onChange,
}: {
  value: RunMode;
  onChange: (value: RunMode) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" style={s.modes}>
      {MODES.map((mode) => (
        <ModeChip
          key={mode.id}
          mode={mode}
          selected={value === mode.id}
          onPress={() => onChange(mode.id)}
        />
      ))}
    </View>
  );
}
export const ModeSwatches = ModeChips;

export function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const { colors } = useTheme();
  const latest = useRef(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => {
    const sub = AppState.addEventListener("change", stop);
    return () => {
      stop();
      sub.remove();
    };
  }, [stop]);
  const adjust = (delta: number) => {
    const next = Math.max(5, Math.min(600, latest.current + delta));
    if (next === latest.current) return;
    latest.current = next;
    onChange(next);
    tick();
  };
  const repeat = (delta: number, count = 0) => {
    adjust(delta);
    timer.current = setTimeout(
      () => repeat(delta, count + 1),
      Math.max(70, 260 - count * 20),
    );
  };
  return (
    <View style={s.stepper}>
      {[-5, 5].map((delta) => (
        <React.Fragment key={delta}>
          {delta > 0 && (
            <Text style={[s.time, { color: colors.text }]}>
              {value}
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                {" "}
                min
              </Text>
            </Text>
          )}
          <NaturalButton
            accessibilityLabel={
              delta < 0 ? "Decrease target time" : "Increase target time"
            }
            accessibilityState={{
              disabled: delta < 0 ? value <= 5 : value >= 600,
            }}
            disabled={delta < 0 ? value <= 5 : value >= 600}
            onPressIn={() => {
              held.current = false;
            }}
            onLongPress={() => {
              held.current = true;
              repeat(delta);
            }}
            delayLongPress={350}
            onPressOut={stop}
            onPress={() => {
              if (!held.current) adjust(delta);
            }}
            style={[
              s.step,
              {
                backgroundColor: colors.glass,
                borderColor: colors.glassBorder,
              },
            ]}
          >
            {delta < 0 ? (
              <Minus size={17} color={colors.text} />
            ) : (
              <Plus size={17} color={colors.text} />
            )}
          </NaturalButton>
        </React.Fragment>
      ))}
    </View>
  );
}

export const RUN_DISTANCES = [3, 5, 10, 21, 42];
export function DistanceRuler({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const { colors } = useTheme();
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [width, setWidth] = useState(0);
  const reduced = useReducedMotion();
  const index = Math.max(0, RUN_DISTANCES.indexOf(value));
  const indicator = useSharedValue(index);
  useEffect(() => {
    if (width) scroll.current?.scrollTo({ x: index * 76, animated: !reduced });
    indicator.set(reduced ? index : withSpring(index, SPRING));
  }, [index, width, reduced, indicator]);
  const handle = useAnimatedStyle(() => {
    const p = indicator.value / 4;
    return {
      transform: [
        { translateX: 8 + p * Math.max(0, width - 32) },
        { translateY: 4 * p * (1 - p) * 18 },
      ],
    };
  });
  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <View style={s.arc}>
        <Svg width="100%" height="30" viewBox={`0 0 ${Math.max(1, width)} 30`}>
          <Path
            d={`M8 4 Q${width / 2} 40 ${Math.max(8, width - 8)} 4`}
            stroke={colors.primaryBorder}
            strokeWidth="1"
            fill="none"
          />
          {Array.from({ length: 21 }, (_, i) => (
            <Path
              key={i}
              d={`M${8 + (i * (width - 16)) / 20} 5 v${i % 5 ? 3 : 6}`}
              stroke={colors.primaryBorder}
              strokeWidth="1"
            />
          ))}
        </Svg>
        <Animated.View
          style={[s.arcHandle, { backgroundColor: colors.primary }, handle]}
        />
      </View>
      <View>
        <ScrollView
          ref={scroll}
          horizontal
          snapToInterval={76}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onMomentumScrollEnd={(event) => {
            const next = Math.max(
              0,
              Math.min(4, Math.round(event.nativeEvent.contentOffset.x / 76)),
            );
            if (RUN_DISTANCES[next] !== value) {
              onChange(RUN_DISTANCES[next]);
              tick();
            }
          }}
          contentContainerStyle={{
            paddingHorizontal: Math.max(0, (width - 76) / 2),
          }}
        >
          {RUN_DISTANCES.map((distance) => (
            <NaturalButton
              key={distance}
              accessibilityRole="radio"
              accessibilityLabel={`${distance} kilometers`}
              accessibilityState={{ checked: value === distance }}
              onPress={() => onChange(distance)}
              style={s.distanceButton}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: value === distance ? colors.primary : "transparent",
                }}
              >
                ⌃
              </Text>
              <Text
                style={{
                  fontFamily: natural.font.display,
                  fontSize: value === distance ? 34 : 24,
                  color:
                    value === distance ? colors.text : colors.textSecondary,
                }}
              >
                {distance}K
              </Text>
            </NaturalButton>
          ))}
        </ScrollView>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            viewBox="0 0 320 70"
          >
            <Defs>
              <LinearGradient id="distance-edge-left">
                <Stop stopColor={colors.background} />
                <Stop
                  offset="1"
                  stopColor={colors.background}
                  stopOpacity="0"
                />
              </LinearGradient>
              <LinearGradient id="distance-edge-right">
                <Stop stopColor={colors.background} stopOpacity="0" />
                <Stop offset="1" stopColor={colors.background} />
              </LinearGradient>
            </Defs>
            <Rect width="48" height="70" fill="url(#distance-edge-left)" />
            <Rect
              x="272"
              width="48"
              height="70"
              fill="url(#distance-edge-right)"
            />
          </Svg>
        </View>
      </View>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: 11,
          textAlign: "center",
          marginTop: 4,
        }}
      >
        DISTANCE · KILOMETERS
      </Text>
    </View>
  );
}

export function RunSetup() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<RunMode>("outdoor");
  const [distance, setDistance] = useState(5);
  const [minutes, setMinutes] = useState(30);
  const weight = useAuthStore((state) => state.profile.weightKg) || 70;
  const color = MODES.find((item) => item.id === mode)!.color;
  const calories = calculateCalories(weight, distance * 1000, minutes * 60);
  return (
    <NaturalScene>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <LiquidBackdrop />
        <View style={s.top}>
          <NaturalButton
            accessibilityLabel="Back to Run"
            onPress={() => router.back()}
            style={[
              s.back,
              {
                backgroundColor: colors.glass,
                borderColor: colors.glassBorder,
              },
            ]}
          >
            <ArrowLeft color={colors.text} size={20} />
          </NaturalButton>
          <Text
            style={{
              color: colors.text,
              fontSize: 17,
              fontFamily: natural.font.medium,
            }}
          >
            Set Up Your Run
          </Text>
          <View style={{ width: 44 }} />
        </View>
        <ScrollView
          contentContainerStyle={s.setupScroll}
          showsVerticalScrollIndicator={false}
        >
          <ModeChips value={mode} onChange={setMode} />
          <View style={s.stage}>
            <Animated.View
              key={`tint-${mode}`}
              entering={FadeIn.duration(reduced ? 120 : 350)}
              style={[
                s.sun,
                { backgroundColor: color, opacity: isDark ? 0.14 : 0.75 },
              ]}
            />
            <Svg
              pointerEvents="none"
              width="100%"
              height="100%"
              viewBox="0 0 320 300"
              style={StyleSheet.absoluteFill}
            >
              <SvgText
                x="268"
                y="30"
                transform="rotate(90 268 30)"
                fontSize="100"
                fontWeight="600"
                fill="none"
                stroke={colors.text}
                strokeWidth="1"
                opacity="0.06"
              >
                RUN
              </SvgText>
            </Svg>
            <View style={[s.contactShadow, { backgroundColor: colors.text }]} />
            <Animated.Image
              key={mode}
              entering={FadeIn.duration(reduced ? 120 : 300)}
              source={require("../../../../assets/natural-runner.png")}
              style={s.runner}
              resizeMode="contain"
            />
          </View>
          <Animated.View
            entering={
              reduced
                ? FadeIn.duration(150)
                : FadeInDown.duration(350).delay(40)
            }
          >
            <DistanceRuler value={distance} onChange={setDistance} />
          </Animated.View>
          <Animated.View
            entering={
              reduced
                ? FadeIn.duration(150)
                : FadeInDown.duration(350).delay(80)
            }
          >
            <GlassCard style={s.panel}>
              <View style={s.timeColumn}>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                  Target Time
                </Text>
                <Stepper value={minutes} onChange={setMinutes} />
              </View>
              <View
                style={[s.panelDivider, { backgroundColor: colors.border }]}
              />
              <View style={s.calorieColumn}>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                  Est. Calories
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "baseline",
                    gap: 3,
                    marginTop: 12,
                  }}
                >
                  <AnimatedNumber value={calories} size={32} />
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                    kcal
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 11,
              lineHeight: 16,
              textAlign: "center",
              marginVertical: 16,
            }}
          >
            {mode === "treadmill"
              ? "Indoor mode tracks time. Distance needs a connected sensor."
              : "An estimate based on your profile and planned effort."}
          </Text>
          <SlideButton
            label="Start Run"
            onComplete={() => {
              useRunStore.setState({
                runType: "distance",
                targetValue: distance * 1000,
                plannedMode: mode,
                targetTimeMinutes: minutes,
              });
              useRunStore.getState().startCountdown();
              router.replace("/(tabs)/run");
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </NaturalScene>
  );
}

const s = StyleSheet.create({
  heroContent: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  heroEyebrow: {
    color: "#FFFFFF",
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: 24,
  },
  heroTitle: {
    fontFamily: natural.font.display,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "400",
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
    marginBottom: 24,
  },
  slider: {
    height: 64,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
  sliderFill: {
    position: "absolute",
    left: 4,
    right: 4,
    top: 4,
    bottom: 4,
    borderRadius: 999,
    overflow: "hidden",
    transformOrigin: "left center",
  },
  sliderLabel: {
    position: "absolute",
    left: 64,
    right: 48,
    alignItems: "center",
  },
  wave: { position: "absolute", right: 12, flexDirection: "row", gap: -5 },
  thumb: {
    position: "absolute",
    left: 4,
    top: 4,
    width: 54,
    height: 54,
    borderRadius: 30,
    backgroundColor: natural.color.sage,
  },
  thumbPress: { flex: 1, alignItems: "center", justifyContent: "center" },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  back: {
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  setupScroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },
  modes: { flexDirection: "row", gap: 8 },
  modeChip: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    padding: 8,
    gap: 5,
    borderRadius: 999,
  },
  stage: { height: 280, position: "relative", marginVertical: 16 },
  sun: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 110,
    top: 28,
    alignSelf: "center",
  },
  runner: { position: "absolute", width: "90%", height: 276, right: "5%" },
  contactShadow: {
    position: "absolute",
    width: 120,
    height: 10,
    borderRadius: 80,
    bottom: 4,
    left: "36%",
    opacity: 0.08,
  },
  arc: { height: 32 },
  arcHandle: {
    position: "absolute",
    top: 0,
    width: 16,
    height: 8,
    borderRadius: 5,
  },
  distanceButton: {
    width: 76,
    minHeight: 76,
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    marginTop: 24,
    padding: 16,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeColumn: { flex: 1.25 },
  calorieColumn: { flex: 1 },
  panelDivider: { height: 56, width: 1, opacity: 0.4 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 2,
  },
  step: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  time: { fontFamily: natural.font.display, fontSize: 22 },
});
