import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Defs, LinearGradient, Stop, Path, Circle } from 'react-native-svg';
import { ArrowUpRight, ArrowRight, Play, Sparkles, Footprints, Target } from 'lucide-react-native';
import { Button, Text, GlassCard, OfflineBanner } from '../../components/ui';
import { LiquidBackdrop } from '../../components/ui/LiquidBackdrop';
import { palette } from '../../theme/tokens';
import { useAuthStore } from '../../store/auth';
import { useGoalsStore } from '../../store/goals';
import { useHaptics } from '../../hooks/useHaptics';
import { WeeklyDistanceChart } from '../../features/dashboard/components/WeeklyDistanceChart';
import {
  RecentRunCard,
  type RecentRunItem,
} from '../../features/dashboard/components/RecentRunCard';
import { getRecentRuns } from '../../services/sqlite';

function TidalLandscape() {
  return (
    <Svg width="100%" height="205" viewBox="0 0 350 205" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="tidal" x1="0" y1="0" x2="1" y2="1">
          <Stop stopColor="#81BDB0" />
          <Stop offset="1" stopColor="#243D46" />
        </LinearGradient>
        <LinearGradient id="ridge" x1="0" y1="0" x2="0" y2="1">
          <Stop stopColor="#C8DBBC" stopOpacity="0.5" />
          <Stop offset="1" stopColor="#315C5A" stopOpacity="0.1" />
        </LinearGradient>
      </Defs>
      <Path
        d="M-30 155 C35 130 60 175 125 116 S220 45 390 115 L390 230 L-30 230Z"
        fill="url(#tidal)"
      />
      <Path
        d="M-30 157 C70 132 90 212 173 127 S270 88 390 68 L390 230 L-30 230Z"
        fill="url(#ridge)"
      />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Path
          key={i}
          d={`M-40 ${124 + i * 13} C70 ${62 + i * 14} 83 ${230 + i * 5} 183 ${125 + i * 10} S300 ${64 + i * 17} 400 ${104 + i * 12}`}
          stroke="#C8E8DD"
          strokeOpacity={0.13 + i * 0.025}
          strokeWidth="0.8"
          fill="none"
        />
      ))}
      <Path
        d="M58 150 C87 118 113 158 142 130 S161 71 194 89 S212 146 245 119 S271 83 294 88"
        stroke="#E5F5E9"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx="58" cy="150" r="4" fill="#E5F5E9" />
      <Circle cx="294" cy="88" r="8" fill="#EDB79B" fillOpacity="0.18" />
      <Circle cx="294" cy="88" r="3.5" fill="#EDB79B" />
    </Svg>
  );
}

export default function DashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const haptics = useHaptics();
  const { profile, initialize: initAuth } = useAuthStore();
  const {
    todayCompletedMeters,
    dailyGoalMeters,
    currentStreakDays,
    initialize: initGoals,
  } = useGoalsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [recentRuns, setRecentRuns] = useState<RecentRunItem[]>([]);
  const [week, setWeek] = useState(
    Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - ((date.getDay() + 6) % 7) + index);
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'narrow' }),
        distanceMeters: 0,
        isToday: date.toDateString() === new Date().toDateString(),
      };
    }),
  );
  const loadData = useCallback(async () => {
    try {
      await Promise.all([initAuth(), initGoals()]);
      const runs = await getRecentRuns(100);
      setRecentRuns(
        runs
          .slice(0, 3)
          .map((run) => ({
            id: run.id,
            date: new Date(run.startedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
            distanceMeters: run.distanceMeters,
            durationSeconds: run.durationSeconds,
            avgPaceSecondsPerKm: run.avgPace || 0,
            caloriesBurned: run.caloriesBurned || 0,
          })),
      );
      const now = new Date();
      const monday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - ((now.getDay() + 6) % 7),
      );
      setWeek(
        Array.from({ length: 7 }, (_, i) => {
          const date = new Date(monday);
          date.setDate(date.getDate() + i);
          return {
            day: date.toLocaleDateString('en-US', { weekday: 'narrow' }),
            isToday: date.toDateString() === now.toDateString(),
            distanceMeters: runs
              .filter((run) => new Date(run.startedAt).toDateString() === date.toDateString())
              .reduce((sum, run) => sum + run.distanceMeters, 0),
          };
        }),
      );
    } catch (error) {
      console.log('[STRIDE] Dashboard:', error);
    }
  }, [initAuth, initGoals]);
  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);
  const onRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };
  const unit = profile.unitPreference;
  const divisor = unit === 'mi' ? 1609.344 : 1000;
  const progress = Math.max(
    0,
    Math.min(1, dailyGoalMeters > 0 ? todayCompletedMeters / dailyGoalMeters : 0),
  );
  const firstName = profile.displayName?.split(' ')[0] || 'Runner';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <LiquidBackdrop />
      <StatusBar barStyle="light-content" />
      <OfflineBanner />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.lime} />
        }
      >
        <View style={styles.topline}>
          <View style={styles.wordmark}>
            <View style={styles.brandDot} />
            <Text style={styles.brand}>stride</Text>
            <Text style={styles.edition}>/ daily motion</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Open your profile"
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{firstName.slice(0, 1).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.greeting}>
          <Text color="textSecondary" variant="bodySmall">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.title}>A little further.{'\n'}A little more you.</Text>
          <Text color="textSecondary" style={styles.subtitle}>
            Your space to move, {firstName}.
          </Text>
        </View>
        <GlassCard style={styles.hero}>
          <View style={styles.heroHeader}>
            <View style={styles.pill}>
              <View style={styles.dot} />
              <Text style={styles.pillText}>TODAY’S MOVEMENT</Text>
            </View>
            <Target size={18} color={palette.lime} />
          </View>
          <View pointerEvents="none" style={styles.landscape}>
            <TidalLandscape />
          </View>
          <View style={styles.heroMetric}>
            <Text style={styles.distance}>{(todayCompletedMeters / divisor).toFixed(2)}</Text>
            <Text style={styles.distanceUnit}>{unit}</Text>
          </View>
          <Text color="textSecondary" variant="bodySmall">
            Every step is a good beginning.
          </Text>
          <View style={styles.goalLine}>
            <Text color="textSecondary" variant="caption">
              Daily goal · {(dailyGoalMeters / divisor).toFixed(1)} {unit}
            </Text>
            <Text variant="caption" color="primary">
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <View
            style={styles.track}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
          >
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          </View>
        </GlassCard>
        <Button
          label="Let’s go for a run"
          size="lg"
          icon={<Play size={17} color={palette.dark900} fill={palette.dark900} />}
          iconRight={<ArrowUpRight size={21} color={palette.dark900} />}
          onPress={() => router.push('/(tabs)/run')}
          style={styles.start}
        />
        <View style={styles.miniRow}>
          <GlassCard style={styles.miniCard}>
            <View style={styles.miniHeading}>
              <Footprints size={17} color={palette.apricot} />
              <Text color="textSecondary" variant="caption">
                Your rhythm
              </Text>
            </View>
            <Text style={styles.miniValue}>
              {currentStreakDays}
              <Text color="textSecondary" style={styles.smallUnit}>
                {' '}
                day streak
              </Text>
            </Text>
            <Text color="textSecondary" variant="caption">
              One day at a time.
            </Text>
          </GlassCard>
          <GlassCard
            pressable
            onPress={() => router.push('/(tabs)/coach')}
            accessibilityLabel="Talk to your running coach"
            style={styles.miniCard}
          >
            <View style={styles.miniHeading}>
              <Sparkles size={17} color={palette.lime} />
              <Text color="textSecondary" variant="caption">
                A little guidance
              </Text>
            </View>
            <View style={styles.coachLink}>
              <Text style={styles.coachTitle}>Find your flow</Text>
              <ArrowUpRight size={17} color={palette.lime} />
            </View>
            <Text color="textSecondary" variant="caption">
              Meet your AI coach
            </Text>
          </GlassCard>
        </View>
        <WeeklyDistanceChart unit={unit} days={week} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your latest strides</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="View all runs"
            onPress={() => router.push('/(tabs)/history')}
            style={styles.seeAll}
          >
            <Text variant="caption" color="primary">
              See all
            </Text>
            <ArrowRight size={15} color={palette.lime} />
          </TouchableOpacity>
        </View>
        {recentRuns.length ? (
          recentRuns.map((run) => (
            <RecentRunCard
              inset={0}
              key={run.id}
              run={run}
              unit={unit}
              onPress={() => router.push(`/run/${run.id}`)}
            />
          ))
        ) : (
          <GlassCard style={styles.empty}>
            <Footprints size={24} color={palette.lime} />
            <Text style={styles.emptyTitle}>Your story starts with a stride.</Text>
            <Text variant="bodySmall" color="textSecondary">
              Finish your first run to see it here.
            </Text>
          </GlassCard>
        )}
        <Text style={styles.footer} color="textSecondary">
          MOVE WITH INTENTION.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.dark900 },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 122,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
  },
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandDot: {
    width: 8,
    height: 20,
    backgroundColor: palette.lime,
    borderRadius: 8,
    transform: [{ rotate: '24deg' }],
  },
  brand: { fontSize: 25, lineHeight: 32, fontWeight: '600', letterSpacing: -1.2 },
  edition: { fontSize: 11, color: palette.mist, marginLeft: 4 },
  avatar: {
    width: 43,
    height: 43,
    borderRadius: 24,
    backgroundColor: '#36484C',
    borderWidth: 1,
    borderColor: '#6F8785',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: palette.lime, fontSize: 18, fontWeight: '500' },
  greeting: { paddingTop: 26, paddingBottom: 24 },
  title: { fontSize: 37, lineHeight: 42, fontWeight: '400', letterSpacing: -1.5, marginTop: 10 },
  subtitle: { fontSize: 14, marginTop: 12 },
  hero: { padding: 22, minHeight: 320, backgroundColor: 'rgba(35, 58, 63, 0.7)', borderRadius: 32 },
  heroHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 4, backgroundColor: palette.lime },
  pillText: { fontSize: 9, letterSpacing: 1.8, color: palette.lime, fontWeight: '600' },
  landscape: { position: 'absolute', right: -8, left: 0, top: 36, opacity: 0.85 },
  heroMetric: { flexDirection: 'row', alignItems: 'baseline', gap: 9, marginTop: 112 },
  distance: {
    fontSize: 66,
    lineHeight: 76,
    letterSpacing: -3.5,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
  distanceUnit: { fontSize: 19, color: palette.lime, fontWeight: '400' },
  goalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 9,
  },
  track: {
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(229,245,233,0.12)',
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: palette.lime, borderRadius: 4 },
  start: { marginTop: 14, height: 58, marginBottom: 18 },
  miniRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  miniCard: { flex: 1, padding: 16, borderRadius: 25 },
  miniHeading: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 17 },
  miniValue: { fontSize: 30, lineHeight: 37, fontWeight: '400', marginBottom: 6 },
  smallUnit: { fontSize: 12, fontWeight: '400' },
  coachTitle: { fontSize: 17, lineHeight: 25, fontWeight: '500', letterSpacing: -0.5 },
  coachLink: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: '500', letterSpacing: -0.6 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 44 },
  empty: { alignItems: 'center', padding: 24, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '500', textAlign: 'center' },
  footer: { fontSize: 9, letterSpacing: 3, textAlign: 'center', paddingTop: 30 },
});
