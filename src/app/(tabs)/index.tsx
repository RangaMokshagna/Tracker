/**
 * STRIDE — Dashboard Tab (Home Screen)
 */

import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text, OfflineBanner } from '../../components/ui';
import { palette } from '../../theme/tokens';
import { useAuthStore } from '../../store/auth';
import { useGoalsStore } from '../../store/goals';
import { useHaptics } from '../../hooks/useHaptics';
import { ProgressRing } from '../../features/dashboard/components/ProgressRing';
import { StreakBadge } from '../../features/dashboard/components/StreakBadge';
import { WeeklyDistanceChart } from '../../features/dashboard/components/WeeklyDistanceChart';
import { RecentRunCard, type RecentRunItem } from '../../features/dashboard/components/RecentRunCard';
import { DailyInsightBanner } from '../../features/dashboard/components/DailyInsightBanner';
import { getRecentRuns } from '../../services/sqlite';
import { Play, Bell } from 'lucide-react-native';

export default function DashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const haptics = useHaptics();
  const { profile, initialize: initAuth } = useAuthStore();
  const {
    todayCompletedMeters,
    dailyGoalMeters,
    currentStreakDays,
    longestStreakDays,
    initialize: initGoals,
  } = useGoalsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [recentRuns, setRecentRuns] = useState<RecentRunItem[]>([
    {
      id: 'demo_run_1',
      date: 'Yesterday, 6:45 PM',
      distanceMeters: 6200,
      durationSeconds: 1940,
      avgPaceSecondsPerKm: 313,
      caloriesBurned: 420,
    },
    {
      id: 'demo_run_2',
      date: 'Oct 20, 7:15 AM',
      distanceMeters: 5100,
      durationSeconds: 1610,
      avgPaceSecondsPerKm: 315,
      caloriesBurned: 350,
    },
    {
      id: 'demo_run_3',
      date: 'Oct 18, 6:30 PM',
      distanceMeters: 8400,
      durationSeconds: 2750,
      avgPaceSecondsPerKm: 327,
      caloriesBurned: 580,
    },
  ]);

  const loadData = async () => {
    try {
      await Promise.all([initAuth(), initGoals()]);
      const sqliteRuns = await getRecentRuns(3);
      if (sqliteRuns && sqliteRuns.length > 0) {
        const mapped = sqliteRuns.map((r) => ({
          id: r.id,
          date: new Date(r.startedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          distanceMeters: r.distanceMeters,
          durationSeconds: r.durationSeconds,
          avgPaceSecondsPerKm: r.avgPace || 300,
          caloriesBurned: r.caloriesBurned || 0,
        }));
        setRecentRuns(mapped);
      }
    } catch (e) {
      console.log('[STRIDE] Dashboard data load note:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    haptics.light();
    await loadData();
    setRefreshing(false);
  };

  const handleStartRun = () => {
    haptics.heavy();
    router.push('/(tabs)/run');
  };

  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <OfflineBanner />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.lime} />
        }
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text variant="caption" color="dark300" style={styles.dateText}>
              {todayDateString.toUpperCase()}
            </Text>
            <Text variant="h1" color="white" style={styles.greetingText}>
              Stride On, {profile.displayName?.split(' ')[0] || 'Runner'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.7}
            onPress={() => haptics.light()}
          >
            <Bell size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Hero Goal Progress Ring */}
        <ProgressRing
          currentMeters={todayCompletedMeters}
          goalMeters={dailyGoalMeters}
          unit={profile.unitPreference}
        />

        {/* Quick Start Run Action CTA */}
        <View style={styles.startRunContainer}>
          <Button
            variant="primary"
            size="lg"
            label="START RUN"
            icon={<Play size={20} color="#000000" fill="#000000" />}
            onPress={handleStartRun}
            style={styles.startButton}
          />
        </View>

        {/* Streak Counter Badge */}
        <StreakBadge
          currentStreak={currentStreakDays}
          longestStreak={longestStreakDays}
        />

        {/* AI Coach Daily Insight Banner */}
        <DailyInsightBanner onPressAskCoach={() => router.push('/(tabs)/coach')} />

        {/* 7-Day Weekly Distance Chart */}
        <WeeklyDistanceChart unit={profile.unitPreference} />

        {/* Recent Runs Section */}
        <View style={styles.sectionHeader}>
          <Text variant="h3" color="white" style={styles.sectionTitle}>
            Recent Runs
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
            <Text variant="label" color="lime">
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {recentRuns.map((run) => (
          <RecentRunCard
            key={run.id}
            run={run}
            unit={profile.unitPreference}
            onPress={() => router.push(`/run/${run.id}` as any)}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  dateText: {
    letterSpacing: 1.5,
    fontSize: 11,
    fontWeight: '700',
  },
  greetingText: {
    fontWeight: '800',
    marginTop: 2,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startRunContainer: {
    paddingHorizontal: 20,
    marginVertical: 12,
  },
  startButton: {
    shadowColor: palette.lime,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: '800',
  },
});
