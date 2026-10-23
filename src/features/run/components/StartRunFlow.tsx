import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, PanResponder, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, Minus, Plus } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  cancelAnimation,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurTargetView, BlurView } from 'expo-blur';
import { GlassCard, Text } from '../../../components/ui';
import { useRunStore } from '../../../store/run';
import { useAuthStore } from '../../../store/auth';
import { calculateCalories } from '../../../utils/calories';

const MINT = '#2EF2C5';
export function SlideButton({ label, onComplete }: { label: string; onComplete: () => void }) {
  const [width, setWidth] = useState(0);
  const position = useSharedValue(0);
  const reduced = useReducedMotion();
  const completed = useRef(false);
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (!reduced) pulse.set(withRepeat(withTiming(0.25, { duration: 900 }), -1, true));
    return () => cancelAnimation(pulse);
  }, [pulse, reduced]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: reduced ? 1 : pulse.value }));
  const travel = Math.max(0, width - 64);
  useFocusEffect(
    useCallback(() => {
      completed.current = false;
      position.set(0);
    }, [position]),
  );
  const finish = () => {
    if (completed.current) return;
    completed.current = true;
    void Haptics.selectionAsync().catch(() => {});
    onComplete();
  };
  // PanResponder stores these callbacks; the ref is read only after a gesture.
  // eslint-disable-next-line react-hooks/refs
  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 5,
    onPanResponderMove: (_, gesture) => position.set(Math.max(0, Math.min(travel, gesture.dx))),
    onPanResponderRelease: (_, gesture) => {
      if (travel > 0 && gesture.dx > travel * 0.8) finish();
      else position.set(reduced ? 0 : withSpring(0));
    },
    onPanResponderTerminate: () => position.set(0),
  });
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: position.value }] }));
  const fill = useAnimatedStyle(() => ({ width: position.value + 56 }));
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={s.slider}>
      <Animated.View pointerEvents="none" style={[s.sliderFill, fill]} />
      <Text style={s.slideLabel}>{label}</Text>
      <Animated.Text style={[s.chevrons, pulseStyle]}>› › ›</Animated.Text>
      <Animated.View style={[s.thumb, thumb]} {...pan.panHandlers}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint="Activate to confirm, or drag right"
          onAccessibilityTap={finish}
          onPress={finish}
          style={s.thumbPress}
        >
          <ChevronRight color="#101B21" size={24} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

export function RunHero() {
  const router = useRouter();
  const blurTarget = useRef<React.ComponentRef<typeof View>>(null);
  const reduced = useReducedMotion();
  const zoom = useSharedValue(1);
  useEffect(() => {
    if (!reduced)
      zoom.set(
        withRepeat(
          withTiming(1.08, { duration: 14000, easing: Easing.inOut(Easing.ease) }),
          -1,
          true,
        ),
      );
    return () => cancelAnimation(zoom);
  }, [zoom, reduced]);
  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ scale: zoom.value }] }));
  return (
    <View style={s.hero}>
      <BlurTargetView ref={blurTarget} style={StyleSheet.absoluteFill}>
        <Animated.Image
          source={require('../../../../assets/run-adventure-hero.png')}
          style={[StyleSheet.absoluteFill, zoomStyle]}
          resizeMode="cover"
        />
      </BlurTargetView>
      <View style={s.heroShade} />
      <SafeAreaView style={s.heroContent}>
        <Text style={s.eyebrow}>STRIDE / OUT THERE, IN YOUR ELEMENT</Text>
        <Animated.View
          entering={reduced ? undefined : FadeInDown.duration(350)}
          style={s.heroBottom}
        >
          <GlassCard style={s.heroCard}>
            <BlurView
              pointerEvents="none"
              tint="dark"
              intensity={45}
              blurTarget={blurTarget}
              blurMethod="dimezisBlurViewSdk31Plus"
              style={StyleSheet.absoluteFill}
            />
            <Text style={s.heroTitle}>
              <Text style={[s.heroTitle, { color: MINT }]}>Run</Text> Into{'\n'}Adventure
            </Text>
            <Text style={s.subtitle}>Every Run Is A Story Waiting To Be Written.</Text>
            <SlideButton label="Get Started" onComplete={() => router.push('/run-setup')} />
          </GlassCard>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const MODES = [
  { id: 'outdoor', label: 'Outdoor', color: MINT },
  { id: 'trail', label: 'Trail', color: '#EDB79B' },
  { id: 'treadmill', label: 'Treadmill', color: '#A8B8BF' },
] as const;
type Mode = (typeof MODES)[number]['id'];
export function ModeSwatches({
  value,
  onChange,
}: {
  value: Mode;
  onChange: (value: Mode) => void;
}) {
  return (
    <View style={s.modes}>
      <Text style={s.small}>Mode</Text>
      {MODES.map((mode) => (
        <Pressable
          key={mode.id}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === mode.id }}
          accessibilityLabel={mode.label}
          onPress={() => {
            void Haptics.selectionAsync().catch(() => {});
            onChange(mode.id);
          }}
          style={s.modeButton}
        >
          <View
            style={[
              s.swatch,
              {
                backgroundColor: mode.color,
                borderColor: value === mode.id ? '#fff' : 'transparent',
                transform: [{ scale: value === mode.id ? 1.08 : 1 }],
              },
            ]}
          />
          <Text style={s.modeLabel}>{mode.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
export function Stepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <View style={s.stepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease target time"
        disabled={value <= 5}
        onPress={() => onChange(Math.max(5, value - 5))}
        style={s.step}
      >
        <Minus size={17} color="#fff" />
      </Pressable>
      <Text style={s.time}>
        {value}
        <Text style={s.small}> min</Text>
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase target time"
        disabled={value >= 600}
        onPress={() => onChange(Math.min(600, value + 5))}
        style={s.step}
      >
        <Plus size={17} color="#fff" />
      </Pressable>
    </View>
  );
}
const DISTANCES = [3, 5, 10, 21, 42];
export function DistanceRuler({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [width, setWidth] = useState(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (width) scroll.current?.scrollTo({ x: DISTANCES.indexOf(value) * 62, animated: !reduced });
  }, [value, width, reduced]);
  return (
    <View>
      <View style={s.rulerArc}>
        <View style={[s.indicator, { left: `${10 + DISTANCES.indexOf(value) * 20}%` }]} />
      </View>
      <ScrollView
        ref={scroll}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={62}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const index = Math.max(0, Math.min(4, Math.round(e.nativeEvent.contentOffset.x / 62)));
          onChange(DISTANCES[index]);
          void Haptics.selectionAsync().catch(() => {});
        }}
        contentContainerStyle={{ paddingHorizontal: Math.max(0, (width - 62) / 2) }}
      >
        {DISTANCES.map((distance) => (
          <Pressable
            key={distance}
            accessibilityRole="radio"
            accessibilityState={{ checked: distance === value }}
            accessibilityLabel={`${distance} kilometers`}
            onPress={() => {
              onChange(distance);
              void Haptics.selectionAsync().catch(() => {});
            }}
            style={s.distanceButton}
          >
            <Text style={{ color: distance === value ? MINT : 'transparent' }}>⌃</Text>
            <Text style={[s.distanceText, distance === value && s.selectedDistance]}>
              {distance}K
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={[s.small, { textAlign: 'center', marginTop: 6 }]}>Distance</Text>
    </View>
  );
}

export function RunSetup() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('outdoor');
  const [distance, setDistance] = useState(5);
  const [minutes, setMinutes] = useState(30);
  const weight = useAuthStore((state) => state.profile.weightKg) || 70;
  const color = MODES.find((item) => item.id === mode)!.color;
  const calories = calculateCalories(weight, distance * 1000, minutes * 60);
  return (
    <SafeAreaView style={s.setup}>
      <View style={s.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={s.back}
        >
          <ArrowLeft color="#fff" size={20} />
        </Pressable>
        <Text style={s.topTitle}>Set Up Your Run</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={s.setupScroll} showsVerticalScrollIndicator={false}>
        <View style={s.stage}>
          <View style={[s.glow, { backgroundColor: color }]} />
          <Text style={s.runWord}>RUN</Text>
          <Image
            source={require('../../../../assets/runner-seaglass.png')}
            style={[s.runner, { tintColor: mode === 'outdoor' ? undefined : color }]}
            resizeMode="contain"
          />
          <ModeSwatches value={mode} onChange={setMode} />
        </View>
        <DistanceRuler value={distance} onChange={setDistance} />
        <GlassCard style={s.panel}>
          <View style={s.panelColumn}>
            <Text style={s.small}>Target Time</Text>
            <Stepper value={minutes} onChange={setMinutes} />
          </View>
          <View style={s.panelDivider} />
          <View style={s.panelColumn}>
            <Text style={s.small}>Est. Calories</Text>
            <Text style={s.calories}>
              {calories}
              <Text style={s.small}> kcal</Text>
            </Text>
          </View>
        </GlassCard>
        <Text style={s.estimate}>Estimate based on your profile and planned effort.</Text>
        <SlideButton
          label="Start Run"
          onComplete={() => {
            useRunStore.setState({
              runType: 'distance',
              targetValue: distance * 1000,
              plannedMode: mode,
              targetTimeMinutes: minutes,
            });
            useRunStore.getState().startCountdown();
            router.replace('/(tabs)/run');
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hero: { flex: 1, backgroundColor: '#101B21' },
  heroShade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(5,14,18,0.48)',
  },
  heroRunner: {
    position: 'absolute',
    top: '10%',
    width: '110%',
    height: '60%',
    right: '-15%',
    opacity: 0.85,
  },
  heroContent: { flex: 1, justifyContent: 'space-between', padding: 16 },
  eyebrow: { color: '#B9E8DA', fontSize: 9, letterSpacing: 2, marginTop: 20 },
  heroBottom: { paddingBottom: 100 },
  heroCard: { padding: 22, borderRadius: 28, backgroundColor: 'rgba(30,43,45,0.78)' },
  heroTitle: { fontSize: 32, lineHeight: 39, fontWeight: '600', color: '#fff' },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 12,
    marginBottom: 24,
  },
  slider: {
    height: 64,
    borderRadius: 40,
    backgroundColor: '#18292C',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sliderFill: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: 40,
    backgroundColor: 'rgba(46,242,197,0.18)',
  },
  thumb: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: 54,
    height: 54,
    borderRadius: 30,
    backgroundColor: MINT,
  },
  thumbPress: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  slideLabel: { textAlign: 'center', color: '#fff', fontSize: 14, fontWeight: '600' },
  chevrons: { position: 'absolute', right: 18, color: '#8BA7A0', fontSize: 18 },
  setup: { flex: 1, backgroundColor: '#080E11' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  back: {
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A272C',
    borderWidth: 1,
    borderColor: '#344449',
  },
  topTitle: { color: '#fff', fontSize: 16, fontWeight: '500' },
  setupScroll: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  stage: { height: 290, position: 'relative' },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.07,
    top: 30,
    left: '20%',
  },
  runner: { position: 'absolute', width: '84%', height: 280, right: '-2%' },
  runWord: {
    position: 'absolute',
    right: -30,
    top: 95,
    fontSize: 105,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.05)',
    transform: [{ rotate: '90deg' }],
  },
  modes: { position: 'absolute', top: 16, left: 0, gap: 8 },
  small: { color: 'rgba(255,255,255,0.6)', fontSize: 11, lineHeight: 17 },
  modeButton: { minHeight: 58, minWidth: 58, alignItems: 'center', gap: 5 },
  swatch: { width: 28, height: 28, borderRadius: 20, borderWidth: 2 },
  modeLabel: { color: '#A8B8BF', fontSize: 9 },
  rulerArc: {
    height: 22,
    borderBottomWidth: 1,
    borderColor: '#395B53',
    borderBottomLeftRadius: 180,
    borderBottomRightRadius: 180,
  },
  indicator: {
    position: 'absolute',
    bottom: -4,
    width: 14,
    height: 7,
    borderRadius: 4,
    backgroundColor: MINT,
  },
  distanceRow: { flexGrow: 1, justifyContent: 'space-around' },
  distanceButton: { width: 62, minHeight: 60, alignItems: 'center', justifyContent: 'center' },
  distanceText: { color: '#6C7B80', fontSize: 19 },
  selectedDistance: { color: '#fff', fontSize: 27, fontWeight: '600' },
  panel: {
    marginTop: 24,
    padding: 16,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  panelColumn: { flex: 1 },
  panelDivider: { height: 48, width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  step: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#243237',
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: { fontSize: 17, color: '#fff' },
  calories: { color: '#fff', fontSize: 29, lineHeight: 44, marginTop: 10 },
  estimate: { color: '#81959E', fontSize: 10, marginVertical: 12, textAlign: 'center' },
});
