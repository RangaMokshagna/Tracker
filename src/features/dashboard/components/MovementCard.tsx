import React, { useId } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { ArrowUpRight, Play, Target } from 'lucide-react-native';
import { GlassCard, Text } from '../../../components/ui';
import { palette } from '../../../theme/tokens';

/** Scenic glass inset: vector artwork stays sharp at phone and tablet sizes. */
function Horizon() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <Svg width="100%" height="100%" viewBox="0 0 360 204" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id={`${id}sky`} x1="0" y1="0" x2="1" y2="1">
          <Stop stopColor="#627E80" />
          <Stop offset="0.5" stopColor="#344D56" />
          <Stop offset="1" stopColor="#182C35" />
        </LinearGradient>
        <LinearGradient id={`${id}hill`} x1="0" y1="0" x2="0.7" y2="1">
          <Stop stopColor="#94B7AC" />
          <Stop offset="1" stopColor="#223C42" />
        </LinearGradient>
        <RadialGradient id={`${id}orb`} cx="0.32" cy="0.22" r="0.8">
          <Stop stopColor="#F2E6E3" />
          <Stop offset="0.32" stopColor="#C9BFC9" />
          <Stop offset="0.72" stopColor="#637D86" />
          <Stop offset="1" stopColor="#253E48" />
        </RadialGradient>
        <LinearGradient id={`${id}shade`} x1="0" y1="0" x2="0" y2="1">
          <Stop stopColor="#101B21" stopOpacity="0" />
          <Stop offset="1" stopColor="#101B21" stopOpacity="0.82" />
        </LinearGradient>
      </Defs>
      <Rect width="360" height="204" fill={`url(#${id}sky)`} />
      <Circle
        cx="280"
        cy="65"
        r="38"
        fill={`url(#${id}orb)`}
        stroke="#E5F5E9"
        strokeOpacity="0.25"
        strokeWidth="0.7"
      />
      <Path d="M-20 158 Q70 72 153 125 T380 104 V210 H-20Z" fill="#526D70" />
      <Path
        d="M-20 184 C82 177 128 65 237 117 S324 169 380 140 V220 H-20Z"
        fill={`url(#${id}hill)`}
      />
      {[0, 1, 2, 3].map((i) => (
        <Path
          key={i}
          d={`M-20 ${192 + i * 8} C82 ${185 + i * 8} 128 ${73 + i * 8} 237 ${125 + i * 8} S324 ${177 + i * 8} 380 ${148 + i * 8}`}
          fill="none"
          stroke="#D5EADD"
          strokeOpacity="0.13"
          strokeWidth="0.7"
        />
      ))}
      <Path
        d="M190 191 C215 175 216 152 248 151 S290 137 307 127"
        stroke="#E5F5E9"
        strokeOpacity="0.75"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="307" cy="127" r="3" fill="#EDB79B" />
      <Rect width="360" height="204" fill={`url(#${id}shade)`} />
    </Svg>
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
            <View style={styles.dot} />
            <Text style={styles.eyebrow}>TODAY’S MOVEMENT</Text>
          </View>
          <View style={styles.target}>
            <Target size={16} color={palette.limeLight} />
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
          accessibilityValue={{ min: 0, max: 100, now: Math.round(completion * 100) }}
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
            <Play size={16} color={palette.dark900} fill={palette.dark900} />
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

const styles = StyleSheet.create({
  card: {
    padding: 9,
    borderRadius: 34,
    marginBottom: 18,
    backgroundColor: 'rgba(171,198,191,0.12)',
    borderColor: 'rgba(224,242,235,0.24)',
    borderTopColor: 'rgba(243,250,245,0.45)',
  },
  scene: {
    minHeight: 204,
    borderRadius: 25,
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 17,
    backgroundColor: '#344D56',
  },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(16,27,33,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(229,245,233,0.15)',
  },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: palette.lime },
  eyebrow: { fontSize: 8, letterSpacing: 1.4, fontWeight: '600', color: palette.limeLight },
  target: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,245,233,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(229,245,233,0.25)',
  },
  metric: { marginTop: 38 },
  distance: {
    fontSize: 58,
    lineHeight: 66,
    letterSpacing: -2.5,
    fontWeight: '300',
    color: palette.pearl,
    fontVariant: ['tabular-nums'],
  },
  unit: { fontSize: 17, letterSpacing: -0.3, fontWeight: '400', color: palette.limeLight },
  caption: { fontSize: 11, lineHeight: 17, color: '#C4D6D2', marginTop: 2 },
  details: { paddingHorizontal: 10, paddingTop: 17, paddingBottom: 3 },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  goalLabel: { fontSize: 11, lineHeight: 16, color: palette.mist },
  goalValue: { fontSize: 21, lineHeight: 28, color: palette.pearl, fontWeight: '400' },
  goalUnit: { fontSize: 12, color: palette.mist },
  percentBadge: { alignItems: 'flex-end' },
  percent: {
    fontSize: 21,
    lineHeight: 26,
    color: palette.lime,
    fontWeight: '400',
    fontVariant: ['tabular-nums'],
  },
  percentLabel: { fontSize: 10, lineHeight: 14, color: palette.mist },
  track: {
    height: 4,
    backgroundColor: 'rgba(229,245,233,0.13)',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 17,
  },
  fill: { height: '100%', borderRadius: 4, backgroundColor: palette.lime },
  start: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 70,
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(12,23,29,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(229,245,233,0.1)',
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  play: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startCopy: { flex: 1 },
  startTitle: { fontSize: 15, lineHeight: 21, fontWeight: '500', color: palette.pearl },
  startSubtitle: { fontSize: 10, lineHeight: 16, color: palette.mist, marginTop: 2 },
});
