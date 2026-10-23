import { LiquidBackdrop } from '../../components/ui/LiquidBackdrop';
/**
 * STRIDE — Run History Screen
 */

import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  View,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text, EmptyState, OfflineBanner } from '../../components/ui';
import { palette } from '../../theme/tokens';
import { useAuthStore } from '../../store/auth';
import { useHaptics } from '../../hooks/useHaptics';
import { getAllRuns, type LocalRun } from '../../services/sqlite';
import { PeriodTabs, type HistoryPeriod } from '../../features/history/components/PeriodTabs';
import { AggregateStatsCard } from '../../features/history/components/AggregateStatsCard';
import { RecentRunCard } from '../../features/dashboard/components/RecentRunCard';

const MOCK_RUNS: LocalRun[] = [
  {
    id: 'run_hist_1',
    userId: 'guest',
    startedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    finishedAt: new Date(Date.now() - 86400000 * 1 + 1940000).toISOString(),
    distanceMeters: 6200,
    durationSeconds: 1940,
    avgPace: 313,
    bestPace: 300,
    avgSpeed: 3.2,
    maxSpeed: 4.1,
    caloriesBurned: 420,
    elevationGain: 45,
    elevationLoss: 40,
    avgHeartRate: 155,
    maxHeartRate: 172,
    avgCadence: 168,
    routePolyline: '',
    runType: 'free',
    source: 'gps',
    title: 'Evening Cruise',
    notes: 'Strong negative split finish. Aerobic zone maintained.',
    rating: 5,
    perceivedEffort: 6,
    isRace: false,
    synced: true,
  },
  {
    id: 'run_hist_2',
    userId: 'guest',
    startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    finishedAt: new Date(Date.now() - 86400000 * 2 + 1610000).toISOString(),
    distanceMeters: 5100,
    durationSeconds: 1610,
    avgPace: 315,
    bestPace: 305,
    avgSpeed: 3.1,
    maxSpeed: 4.0,
    caloriesBurned: 350,
    elevationGain: 30,
    elevationLoss: 30,
    avgHeartRate: 150,
    maxHeartRate: 165,
    avgCadence: 165,
    routePolyline: '',
    runType: 'free',
    source: 'gps',
    title: 'Morning Easy',
    notes: 'Steady cadence work.',
    rating: 4,
    perceivedEffort: 5,
    isRace: false,
    synced: true,
  },
  {
    id: 'run_hist_3',
    userId: 'guest',
    startedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    finishedAt: new Date(Date.now() - 86400000 * 4 + 2750000).toISOString(),
    distanceMeters: 8400,
    durationSeconds: 2750,
    avgPace: 327,
    bestPace: 310,
    avgSpeed: 3.0,
    maxSpeed: 3.8,
    caloriesBurned: 580,
    elevationGain: 62,
    elevationLoss: 60,
    avgHeartRate: 158,
    maxHeartRate: 175,
    avgCadence: 166,
    routePolyline: '',
    runType: 'free',
    source: 'gps',
    title: 'Weekend Long Run',
    notes: 'Endurance foundation run with high efficiency.',
    rating: 5,
    perceivedEffort: 7,
    isRace: false,
    synced: true,
  },
  {
    id: 'run_hist_4',
    userId: 'guest',
    startedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    finishedAt: new Date(Date.now() - 86400000 * 6 + 1320000).toISOString(),
    distanceMeters: 4200,
    durationSeconds: 1320,
    avgPace: 314,
    bestPace: 300,
    avgSpeed: 3.2,
    maxSpeed: 4.2,
    caloriesBurned: 290,
    elevationGain: 22,
    elevationLoss: 20,
    avgHeartRate: 145,
    maxHeartRate: 160,
    avgCadence: 162,
    routePolyline: '',
    runType: 'free',
    source: 'gps',
    title: 'Shakeout Jog',
    notes: 'Recovery run.',
    rating: 4,
    perceivedEffort: 4,
    isRace: false,
    synced: true,
  },
];

export default function HistoryScreen(): React.JSX.Element {
  const router = useRouter();
  const haptics = useHaptics();
  const { profile } = useAuthStore();

  const [period, setPeriod] = useState<HistoryPeriod>('week');
  const [runs, setRuns] = useState<LocalRun[]>(MOCK_RUNS);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRuns = async () => {
    try {
      const dbRuns = await getAllRuns();
      if (dbRuns && dbRuns.length > 0) {
        setRuns(dbRuns);
      }
    } catch (e) {
      console.log('[STRIDE] Local runs fetch note:', e);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    await fetchRuns();
    setRefreshing(false);
  };

  // Filter runs based on period
  const filteredRuns = runs.filter((r) => {
    const runDate = new Date(r.startedAt).getTime();
    const now = Date.now();
    if (period === 'week') {
      return now - runDate <= 7 * 86400000;
    }
    if (period === 'month') {
      return now - runDate <= 30 * 86400000;
    }
    return true;
  });

  const totalDistance = filteredRuns.reduce((acc, r) => acc + r.distanceMeters, 0);
  const totalDuration = filteredRuns.reduce((acc, r) => acc + r.durationSeconds, 0);
  const totalCalories = filteredRuns.reduce((acc, r) => acc + (r.caloriesBurned || 0), 0);
  const avgPace =
    totalDistance > 0 ? Math.round((totalDuration / totalDistance) * 1000) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <LiquidBackdrop />
      <StatusBar barStyle="light-content" />
      <OfflineBanner />

      <FlatList
        showsVerticalScrollIndicator={false}
        data={filteredRuns}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.lime} />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text variant="caption" color="dark300" style={styles.headerSubtitle}>
                TRAINING LOG
              </Text>
              <Text variant="h1" color="white" style={styles.headerTitle}>
                Every stride counts.
              </Text>
            </View>

            <PeriodTabs selected={period} onSelect={setPeriod} />

            <AggregateStatsCard
              totalDistanceMeters={totalDistance}
              totalDurationSeconds={totalDuration}
              totalRuns={filteredRuns.length}
              avgPaceSecondsPerKm={avgPace}
              totalCalories={totalCalories}
              unit={profile.unitPreference}
            />

            <View style={styles.sectionTitleRow}>
              <Text variant="h3" color="white" style={{ fontWeight: '500' }}>
                All Sessions ({filteredRuns.length})
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <RecentRunCard
            run={{
              id: item.id,
              date: new Date(item.startedAt).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              distanceMeters: item.distanceMeters,
              durationSeconds: item.durationSeconds,
              avgPaceSecondsPerKm: item.avgPace || 300,
              caloriesBurned: item.caloriesBurned || 0,
            }}
            unit={profile.unitPreference}
            onPress={() => router.push(`/run/${item.id}` as any)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No Runs in This Period"
            description="Lace up your running shoes and track your first session with STRIDE."
            actionLabel="Start a Run"
            onAction={() => router.push('/(tabs)/run')}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#101B21',
  },
  listContent: {
    paddingBottom: 125,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerSubtitle: {
    letterSpacing: 2,
    fontSize: 11,
    fontWeight: '500',
  },
  headerTitle: {
    fontWeight: '600',
    marginTop: 2,
  },
  sectionTitleRow: {
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 8,
  },
});
