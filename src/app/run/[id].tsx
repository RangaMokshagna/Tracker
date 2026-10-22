/**
 * STRIDE — Run Detail Screen
 */

import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GlassCard, Text, Button } from '../../components/ui';
import { palette } from '../../theme/tokens';
import { useAuthStore } from '../../store/auth';
import { formatDistance } from '../../utils/distance';
import { formatDuration } from '../../utils/format';
import { formatPace } from '../../utils/pace';
import { decodePolyline } from '../../utils/polyline';
import { getRunById, getRoutePoints, getRunSplits, type StoredRun } from '../../services/sqlite';
import { LiveRouteMap } from '../../features/run/components/LiveRouteMap';
import type { LocationPoint, Split } from '../../types/run';
import { ChevronLeft, Share2, Sparkles, Award } from 'lucide-react-native';

export default function RunDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuthStore();

  const [run, setRun] = useState<StoredRun | null>(null);
  const [routePoints, setRoutePoints] = useState<LocationPoint[]>([]);
  const [splits, setSplits] = useState<Split[]>([]);

  useEffect(() => {
    async function loadRun() {
      if (!id) return;
      try {
        const found = await getRunById(id);
        if (found) {
          setRun(found);
          const pts = await getRoutePoints(id);
          setRoutePoints(pts);
          const spl = await getRunSplits(id);
          setSplits(spl);
        } else {
          // Demo fallback
          setRun({
            id: id,
            userId: 'guest',
            startedAt: new Date(Date.now() - 86400000).toISOString(),
            finishedAt: new Date(Date.now() - 86400000 + 1940000).toISOString(),
            distanceMeters: 6200,
            durationSeconds: 1940,
            avgPace: 313,
            bestPace: 300,
            avgSpeed: 3.2,
            maxSpeed: 4.1,
            caloriesBurned: 420,
            elevationGain: 48,
            elevationLoss: 40,
            avgHeartRate: 154,
            maxHeartRate: 170,
            avgCadence: 165,
            routePolyline: '',
            runType: 'free',
            source: 'gps',
            title: 'Progression Run',
            weather_summary: 'Clear, 21°C',
            notes:
              'Pace Trend: Consistent acceleration across final 2km.\nEffort: Aerobic sweet spot.\nNext Step: Rest tomorrow or light 20-min mobility.',
            rating: 5,
            perceivedEffort: 6,
            isRace: false,
            synced: true,
          });
          setSplits([
            { number: 1, distanceMeters: 1000, durationSeconds: 320, paceSecondsPerKm: 320, elevationChangeM: 8, avgHeartRate: 142 },
            { number: 2, distanceMeters: 1000, durationSeconds: 318, paceSecondsPerKm: 318, elevationChangeM: -2, avgHeartRate: 148 },
            { number: 3, distanceMeters: 1000, durationSeconds: 315, paceSecondsPerKm: 315, elevationChangeM: 12, avgHeartRate: 154 },
            { number: 4, distanceMeters: 1000, durationSeconds: 310, paceSecondsPerKm: 310, elevationChangeM: 5, avgHeartRate: 158 },
            { number: 5, distanceMeters: 1000, durationSeconds: 308, paceSecondsPerKm: 308, elevationChangeM: -6, avgHeartRate: 162 },
            { number: 6, distanceMeters: 1000, durationSeconds: 302, paceSecondsPerKm: 302, elevationChangeM: 3, avgHeartRate: 168 },
          ]);
        }
      } catch (e) {
        console.warn('[STRIDE] Load run error:', e);
      }
    }
    loadRun();
  }, [id]);

  const handleShare = async () => {
    if (!run) return;
    const dist = formatDistance(run.distanceMeters, profile.unitPreference);
    const time = formatDuration(run.durationSeconds);
    const pace = formatPace(run.avgPace || 300, profile.unitPreference);

    try {
      await Share.share({
        message: `🏃 Stride Complete!\nI ran ${dist} in ${time} (Avg Pace: ${pace}/${profile.unitPreference}) using STRIDE AI Running Tracker!`,
      });
    } catch (e) {
      console.warn(e);
    }
  };

  if (!run) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text variant="body" color="dark300">
            Loading session...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const formattedDistance = formatDistance(run.distanceMeters, profile.unitPreference);
  const formattedDuration = formatDuration(run.durationSeconds);
  const formattedPace = formatPace(run.avgPace || 300, profile.unitPreference);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text variant="label" color="white" style={{ fontWeight: '800' }}>
          SESSION SUMMARY
        </Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
          <Share2 size={20} color={palette.lime} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Route Map Header */}
        <View style={styles.mapContainer}>
          <LiveRouteMap routePoints={routePoints} height={260} />
        </View>

        {/* Hero distance & date */}
        <View style={styles.heroSection}>
          <Text variant="caption" color="lime" style={styles.heroDate}>
            {new Date(run.startedAt).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }).toUpperCase()}
          </Text>
          <Text variant="display" color="white" style={styles.heroDistance}>
            {formattedDistance}
          </Text>
        </View>

        {/* 4-Stat Glass Card */}
        <GlassCard variant="elevated" style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <Text variant="caption" color="dark300">
                TIME
              </Text>
              <Text style={styles.statVal}>{formattedDuration}</Text>
            </View>
            <View style={styles.statCell}>
              <Text variant="caption" color="dark300">
                AVG PACE
              </Text>
              <Text style={styles.statVal}>{formattedPace} /{profile.unitPreference}</Text>
            </View>
            <View style={styles.statCell}>
              <Text variant="caption" color="dark300">
                CALORIES
              </Text>
              <Text style={styles.statVal}>{run.caloriesBurned || 0} kcal</Text>
            </View>
            <View style={styles.statCell}>
              <Text variant="caption" color="dark300">
                ELEVATION GAIN
              </Text>
              <Text style={styles.statVal}>+{run.elevationGain || 0} m</Text>
            </View>
          </View>
        </GlassCard>

        {/* AI Insight Card */}
        {run.notes && (
          <GlassCard variant="default" style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Sparkles size={18} color={palette.lime} />
              <Text variant="label" color="lime" style={styles.aiTitle}>
                AI COACH POST-RUN INSIGHT
              </Text>
            </View>
            <Text variant="bodySmall" color="white" style={styles.aiText}>
              {run.notes}
            </Text>
          </GlassCard>
        )}

        {/* Splits Breakdown */}
        {splits.length > 0 && (
          <GlassCard variant="default" style={styles.splitsCard}>
            <Text variant="label" color="white" style={styles.splitsHeading}>
              KILOMETER SPLITS
            </Text>
            {splits.map((s) => (
              <View key={s.number} style={styles.splitRow}>
                <Text variant="caption" color="dark300" style={{ width: 64 }}>
                  Km {s.number}
                </Text>
                <Text variant="label" color="white" style={{ fontWeight: '700' }}>
                  {formatPace(s.paceSecondsPerKm, profile.unitPreference)} /{profile.unitPreference}
                </Text>
                <Text variant="caption" color="dark400">
                  {s.elevationChangeM !== null ? `${s.elevationChangeM >= 0 ? '+' : ''}${s.elevationChangeM}m` : '-'}
                </Text>
              </View>
            ))}
          </GlassCard>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  mapContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  heroDate: {
    letterSpacing: 2,
    fontSize: 11,
    fontWeight: '800',
  },
  heroDistance: {
    fontSize: 48,
    fontWeight: '900',
    marginTop: 4,
  },
  statsCard: {
    padding: 16,
    marginVertical: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCell: {
    width: '45%',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  aiCard: {
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(191, 255, 0, 0.25)',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiTitle: {
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 12,
  },
  aiText: {
    lineHeight: 22,
    color: '#E0E0E0',
  },
  splitsCard: {
    padding: 16,
    marginVertical: 10,
  },
  splitsHeading: {
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 12,
    marginBottom: 12,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
});
