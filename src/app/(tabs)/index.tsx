import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  useWindowDimensions,
  ScrollView,
  StyleSheet,
  View,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowUpRight, ArrowRight, Sparkles, Footprints } from 'lucide-react-native';
import { Text, GlassCard, OfflineBanner } from '../../components/ui';
import { MovementCard } from '../../features/dashboard/components/MovementCard';
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

export default function DashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const viewport = useWindowDimensions();
  const headerWidth = Math.min(viewport.width, 620) - 44;
  const headingSize = Math.max(23, Math.min(37, headerWidth * 0.077));
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
        runs.slice(0, 3).map((run) => ({
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
          <View style={styles.greetingCopy}>
            <Text color="textSecondary" variant="bodySmall">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text style={[styles.title, { fontSize: headingSize, lineHeight: headingSize * 1.18 }]}>
              A little further.{'\n'}A little more you.
            </Text>
            <Text color="textSecondary" style={styles.subtitle}>
              Your space to move, {firstName}.
            </Text>
          </View>
          <View
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.runnerArtwork, { width: Math.min(148, headerWidth * 0.28) }]}
          >
            <Image
              source={require('../../../assets/runner-seaglass.png')}
              resizeMode="contain"
              style={styles.runnerImage}
              accessible={false}
            />
          </View>
        </View>
        <MovementCard
          distance={(todayCompletedMeters / divisor).toFixed(2)}
          unit={unit}
          goal={(dailyGoalMeters / divisor).toFixed(1)}
          progress={progress}
          onStart={() => {
            haptics.light();
            router.push('/(tabs)/run');
          }}
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
  greeting: {
    paddingTop: 26,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greetingCopy: { flex: 1, minWidth: 0 },
  runnerArtwork: { aspectRatio: 0.9 },
  runnerImage: { width: '100%', height: '100%', opacity: 0.8 },
  title: { fontSize: 37, lineHeight: 42, fontWeight: '400', letterSpacing: -1.5, marginTop: 10 },
  subtitle: { fontSize: 14, marginTop: 12 },
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
