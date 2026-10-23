import { LiquidBackdrop } from '../../components/ui/LiquidBackdrop';
/**
 * STRIDE — Live Run Tracking Screen
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text, GlassCard } from '../../components/ui';
import { palette } from '../../theme/tokens';
import { useRunStore } from '../../store/run';
import { useAuthStore } from '../../store/auth';
import { useGoalsStore } from '../../store/goals';
import { useHaptics } from '../../hooks/useHaptics';
import { RunStatus } from '../../types/run';
import { startLocationTracking, stopLocationTracking } from '../../services/location';
import { CountdownOverlay } from '../../features/run/components/CountdownOverlay';
import { LiveRouteMap } from '../../features/run/components/LiveRouteMap';
import { LiveRunDashboard } from '../../features/run/components/LiveRunDashboard';
import { RunControls } from '../../features/run/components/RunControls';
import { AutoPauseBanner } from '../../features/run/components/AutoPauseBanner';
import { PostRunModal } from '../../features/run/components/PostRunModal';
import { Map, Activity, ChevronLeft } from 'lucide-react-native';

export default function RunScreen(): React.JSX.Element {
  const router = useRouter();
  const haptics = useHaptics();
  const { profile } = useAuthStore();
  const { recordCompletedRun } = useGoalsStore();

  const {
    status,
    countdownRemaining,
    stats,
    routePoints,
    isAutoPaused,
    startCountdown,
    tickCountdown,
    pauseRun,
    resumeRun,
    tickTimer,
    stopRun,
    discardRun,
    resetState,
  } = useRunStore();

  const [activeTab, setActiveTab] = useState<'metrics' | 'map'>('metrics');
  const [showPostModal, setShowPostModal] = useState(false);
  const timerRef = useRef<any>(null);

  // Countdown handler
  useEffect(() => {
    let interval: any = null;
    if (status === RunStatus.Countdown) {
      interval = setInterval(() => {
        tickCountdown();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, countdownRemaining]);

  // Active run lifecycle: start GPS and 1-second active timer
  useEffect(() => {
    if (status === RunStatus.Active) {
      startLocationTracking();

      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          tickTimer();
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (status !== RunStatus.Paused) {
        stopLocationTracking();
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status]);

  const handleStart = () => {
    startCountdown();
  };

  const handleStop = async () => {
    await stopLocationTracking();
    await stopRun();
    setShowPostModal(true);
  };

  const handleSaveCompletedRun = async () => {
    await recordCompletedRun(
      stats.distanceMeters,
      stats.durationSeconds,
      stats.avgPaceSecondsPerKm
    );
    setShowPostModal(false);
    resetState();
    router.replace('/(tabs)/');
  };

  const handleDiscard = () => {
    setShowPostModal(false);
    discardRun();
  };

  const currentLocation = routePoints.length > 0 ? routePoints[routePoints.length - 1] : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <LiquidBackdrop />
      <StatusBar barStyle="light-content" />

      {/* Countdown overlay */}
      {status === RunStatus.Countdown && <CountdownOverlay count={countdownRemaining} />}

      {/* Post run summary modal */}
      <PostRunModal
        visible={showPostModal}
        stats={stats}
        unit={profile.unitPreference}
        onSave={handleSaveCompletedRun}
        onDiscard={handleDiscard}
      />

      {/* Top Bar */}
      <View style={styles.topBar}>
        {status === RunStatus.Idle ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text variant="caption" color="lime" style={styles.liveText}>
              {status === RunStatus.Paused ? 'PAUSED' : 'LIVE TRACKING'}
            </Text>
          </View>
        )}

        {/* Tab switch (Metrics vs Map) during active or idle run */}
        <View style={styles.tabToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'metrics' && styles.toggleBtnActive]}
            onPress={() => {
              haptics.light();
              setActiveTab('metrics');
            }}
          >
            <Activity size={16} color={activeTab === 'metrics' ? '#000000' : '#888888'} />
            <Text
              variant="caption"
              color={activeTab === 'metrics' ? 'dark900' : 'dark300'}
              style={{ fontWeight: '700' }}
            >
              Stats
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'map' && styles.toggleBtnActive]}
            onPress={() => {
              haptics.light();
              setActiveTab('map');
            }}
          >
            <Map size={16} color={activeTab === 'map' ? '#000000' : '#888888'} />
            <Text
              variant="caption"
              color={activeTab === 'map' ? 'dark900' : 'dark300'}
              style={{ fontWeight: '700' }}
            >
              Route
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Auto-pause banner */}
      <AutoPauseBanner visible={isAutoPaused && status === RunStatus.Active} />

      {/* Main Content Area */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'metrics' ? (
          <LiveRunDashboard stats={stats} unit={profile.unitPreference} />
        ) : (
          <View style={styles.mapWrapper}>
            <LiveRouteMap
              routePoints={routePoints}
              currentLocation={currentLocation}
              height={360}
            />
          </View>
        )}
      </ScrollView>

      {/* One-Thumb Run Controls */}
      <View style={styles.controlsFooter}>
        <RunControls
          status={status}
          onStart={handleStart}
          onPause={pauseRun}
          onResume={resumeRun}
          onStop={handleStop}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#101B21',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(185, 232, 218, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(185, 232, 218, 0.25)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.lime,
  },
  liveText: {
    fontWeight: '500',
    letterSpacing: 1,
    fontSize: 10,
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 13,
  },
  toggleBtnActive: {
    backgroundColor: palette.lime,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  mapWrapper: {
    paddingHorizontal: 16,
  },
  controlsFooter: {
    paddingBottom: 110,
  },
});
