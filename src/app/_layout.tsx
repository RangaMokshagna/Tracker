/**
 * STRIDE — App Root Layout
 *
 * Sets up TanStack Query Client, SQLite initialization,
 * and Stack navigation routes.
 */

import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { getDatabase } from '../services/sqlite';
import { useAuthStore } from '../store/auth';
import { useGoalsStore } from '../store/goals';
import { syncPendingRuns } from '../services/sync';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 min
    },
  },
});

export default function RootLayout(): React.JSX.Element {
  const [appReady, setAppReady] = useState(false);
  const initializeAuth = useAuthStore((s) => s.initialize);
  const initializeGoals = useGoalsStore((s) => s.initialize);

  useEffect(() => {
    async function prepare() {
      try {
        // Init SQLite
        await getDatabase();
        // Init Auth & Goals store
        await Promise.all([initializeAuth(), initializeGoals()]);
        // Trigger background sync if online
        syncPendingRuns().catch(() => {});
      } catch (e) {
        console.warn('[STRIDE] App prepare error:', e);
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }
    prepare();
  }, []);

  if (!appReady) {
    return <></>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#101B21' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="achievements"
          options={{
            gestureEnabled: false,
            presentation: 'transparentModal',
            animation: 'none',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen
          name="run-setup"
          options={{ animation: 'fade_from_bottom', animationDuration: 350 }}
        />
        <Stack.Screen
          name="run/[id]"
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="onboarding/index"
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
