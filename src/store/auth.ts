/**
 * STRIDE — Auth & User Profile Store
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { UserProfile, UnitPreference, ThemePreference } from '../types/user';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AUTH_STORAGE_KEY = '@stride_user_profile';

const DEFAULT_PROFILE: UserProfile = {
  id: 'guest_user_stride',
  email: 'runner@stride.app',
  displayName: 'Alex Mercer',
  avatarUrl: null,
  weightKg: 70,
  heightCm: 178,
  dateOfBirth: '1996-05-15',
  gender: 'not_specified',
  unitPreference: 'km',
  themePreference: 'dark',
  weeklyDistanceGoalM: 25000, // 25 km
  weeklyRunGoal: 3,
  notificationEnabled: true,
  onboardingCompleted: true,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
};

interface AuthStore {
  userId: string | null;
  profile: UserProfile;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setUnitPreference: (unit: UnitPreference) => Promise<void>;
  setThemePreference: (theme: ThemePreference) => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  userId: DEFAULT_PROFILE.id,
  profile: DEFAULT_PROFILE,
  isLoading: true,
  isAuthenticated: true,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true });
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        set({
          profile: parsed,
          userId: parsed.id,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }

      if (isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const userRow = data as any;
          if (userRow) {
            const mappedProfile: UserProfile = {
              id: userRow.id,
              email: userRow.email,
              displayName: userRow.display_name,
              avatarUrl: userRow.avatar_url,
              weightKg: userRow.weight_kg,
              heightCm: userRow.height_cm,
              dateOfBirth: userRow.date_of_birth,
              gender: userRow.gender,
              unitPreference: userRow.unit_preference as UnitPreference,
              themePreference: userRow.theme_preference as ThemePreference,
              weeklyDistanceGoalM: userRow.weekly_distance_goal_m,
              weeklyRunGoal: userRow.weekly_run_goal,
              notificationEnabled: userRow.notification_enabled,
              onboardingCompleted: userRow.onboarding_completed,
              timezone: userRow.timezone,
            };
            set({
              profile: mappedProfile,
              userId: mappedProfile.id,
              isAuthenticated: true,
              isLoading: false,
            });
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mappedProfile));
            return;
          }
        }
      }

      // Default fallback
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE));
      set({
        profile: DEFAULT_PROFILE,
        userId: DEFAULT_PROFILE.id,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      console.warn('[STRIDE] Auth initialize error:', err);
      set({ profile: DEFAULT_PROFILE, isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    const current = get().profile;
    const updated = { ...current, ...updates };
    set({ profile: updated });
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured && get().userId && get().userId !== 'guest_user_stride') {
      try {
        await supabase
          .from('users')
          .update({
            display_name: updated.displayName,
            avatar_url: updated.avatarUrl,
            weight_kg: updated.weightKg,
            height_cm: updated.heightCm,
            unit_preference: updated.unitPreference,
            theme_preference: updated.themePreference,
            weekly_distance_goal_m: updated.weeklyDistanceGoalM,
            weekly_run_goal: updated.weeklyRunGoal,
            notification_enabled: updated.notificationEnabled,
            onboarding_completed: updated.onboardingCompleted,
          } as any)
          .eq('id', updated.id);
      } catch (e) {
        console.warn('[STRIDE] Sync profile to Supabase error:', e);
      }
    }
  },

  setUnitPreference: async (unit) => {
    await get().updateProfile({ unitPreference: unit });
  },

  setThemePreference: async (theme) => {
    await get().updateProfile({ themePreference: theme });
  },

  setOnboardingCompleted: async (completed) => {
    await get().updateProfile({ onboardingCompleted: completed });
  },

  signOut: async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    set({
      userId: null,
      profile: DEFAULT_PROFILE,
      isAuthenticated: false,
    });
  },

  deleteAccount: async () => {
    if (isSupabaseConfigured && get().userId) {
      await supabase.from('users').delete().eq('id', get().userId!);
    }
    await AsyncStorage.clear();
    set({
      userId: null,
      profile: DEFAULT_PROFILE,
      isAuthenticated: false,
    });
  },
}));
