/**
 * STRIDE — Goals, Streaks & Badges Zustand Store
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
  category: 'distance' | 'streak' | 'pace' | 'milestone';
}

export interface PersonalRecords {
  fastest1kSeconds: number | null;
  fastest5kSeconds: number | null;
  fastest10kSeconds: number | null;
  longestDistanceMeters: number | null;
  longestDurationSeconds: number | null;
}

interface GoalsStore {
  dailyGoalMeters: number;
  weeklyGoalMeters: number;
  todayCompletedMeters: number;
  weekCompletedMeters: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastRunDate: string | null;
  badges: BadgeItem[];
  personalRecords: PersonalRecords;

  // Actions
  initialize: () => Promise<void>;
  setDailyGoal: (meters: number) => Promise<void>;
  setWeeklyGoal: (meters: number) => Promise<void>;
  recordCompletedRun: (distanceMeters: number, durationSeconds: number, avgPace: number) => Promise<void>;
}

const STORAGE_KEY = '@stride_goals_state';

const DEFAULT_BADGES: BadgeItem[] = [
  {
    id: 'first_stride',
    name: 'First Stride',
    description: 'Completed your first run with STRIDE',
    icon: '👟',
    unlockedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    category: 'milestone',
  },
  {
    id: 'streak_3',
    name: '3-Day Momentum',
    description: 'Kept the fire burning for 3 consecutive days',
    icon: '🔥',
    unlockedAt: new Date(Date.now() - 86400000).toISOString(),
    category: 'streak',
  },
  {
    id: '5k_finisher',
    name: '5K Finisher',
    description: 'Conquered a single 5K run',
    icon: '⚡',
    unlockedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    category: 'distance',
  },
  {
    id: '10k_cruiser',
    name: '10K Crusher',
    description: 'Reached double digits in a single run',
    icon: '🏆',
    unlockedAt: null,
    category: 'distance',
  },
  {
    id: 'sub_25_5k',
    name: 'Speed Demon',
    description: 'Clocked a sub-25 minute 5K pace',
    icon: '🚀',
    unlockedAt: null,
    category: 'pace',
  },
  {
    id: 'night_owl',
    name: 'Night Runner',
    description: 'Logged a session under the city lights after 8 PM',
    icon: '🌙',
    unlockedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    category: 'milestone',
  },
  {
    id: 'week_warrior',
    name: 'Weekly Target Met',
    description: 'Hit 100% of your weekly distance goal',
    icon: '🎯',
    unlockedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    category: 'milestone',
  },
];

export const useGoalsStore = create<GoalsStore>((set, get) => ({
  dailyGoalMeters: 5000, // 5 km
  weeklyGoalMeters: 25000, // 25 km
  todayCompletedMeters: 3800,
  weekCompletedMeters: 18400,
  currentStreakDays: 4,
  longestStreakDays: 12,
  lastRunDate: new Date().toISOString(),
  badges: DEFAULT_BADGES,
  personalRecords: {
    fastest1kSeconds: 278, // 4:38
    fastest5kSeconds: 1475, // 24:35
    fastest10kSeconds: 3120, // 52:00
    longestDistanceMeters: 11200, // 11.2 km
    longestDurationSeconds: 3600, // 60 min
  },

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ ...parsed });
      }
    } catch (e) {
      console.warn('[STRIDE] Failed loading goals state:', e);
    }
  },

  setDailyGoal: async (meters) => {
    set({ dailyGoalMeters: meters });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get()));
  },

  setWeeklyGoal: async (meters) => {
    set({ weeklyGoalMeters: meters });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get()));
  },

  recordCompletedRun: async (distanceMeters, durationSeconds, avgPace) => {
    const state = get();
    const today = new Date().toISOString().split('T')[0];
    const lastDate = state.lastRunDate ? state.lastRunDate.split('T')[0] : null;

    let newStreak = state.currentStreakDays;
    if (lastDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastDate === yesterday) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }

    const longestStreak = Math.max(state.longestStreakDays, newStreak);
    const newToday = state.todayCompletedMeters + distanceMeters;
    const newWeek = state.weekCompletedMeters + distanceMeters;

    // Check PRs
    const prs = { ...state.personalRecords };
    if (!prs.longestDistanceMeters || distanceMeters > prs.longestDistanceMeters) {
      prs.longestDistanceMeters = distanceMeters;
    }
    if (!prs.longestDurationSeconds || durationSeconds > prs.longestDurationSeconds) {
      prs.longestDurationSeconds = durationSeconds;
    }
    if (distanceMeters >= 5000) {
      const paceFor5k = avgPace * 5;
      if (!prs.fastest5kSeconds || paceFor5k < prs.fastest5kSeconds) {
        prs.fastest5kSeconds = paceFor5k;
      }
    }

    // Check Badge Unlock
    const updatedBadges = state.badges.map((b) => {
      if (b.unlockedAt) return b;
      if (b.id === 'first_stride') return { ...b, unlockedAt: new Date().toISOString() };
      if (b.id === '5k_finisher' && distanceMeters >= 5000) return { ...b, unlockedAt: new Date().toISOString() };
      if (b.id === '10k_cruiser' && distanceMeters >= 10000) return { ...b, unlockedAt: new Date().toISOString() };
      if (b.id === 'streak_3' && newStreak >= 3) return { ...b, unlockedAt: new Date().toISOString() };
      if (b.id === 'week_warrior' && newWeek >= state.weeklyGoalMeters) return { ...b, unlockedAt: new Date().toISOString() };
      return b;
    });

    const nextState = {
      todayCompletedMeters: newToday,
      weekCompletedMeters: newWeek,
      currentStreakDays: newStreak,
      longestStreakDays: longestStreak,
      lastRunDate: new Date().toISOString(),
      personalRecords: prs,
      badges: updatedBadges,
    };

    set(nextState);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, ...nextState }));
  },
}));
