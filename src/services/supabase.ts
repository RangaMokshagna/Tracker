/**
 * STRIDE — Supabase client initialisation.
 *
 * Reads EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY from the
 * Expo environment (set in .env or app.config). Auth tokens are persisted
 * to AsyncStorage so sessions survive app restarts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '../types/database';

// ────────────────────────────────────────────────────────────
// Env
// ────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder-stride.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key-stride';

export const isSupabaseConfigured = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// ────────────────────────────────────────────────────────────
// Client
// ────────────────────────────────────────────────────────────

/**
 * Typed Supabase client for the STRIDE database.
 *
 * @example
 * ```ts
 * const { data } = await supabase.from('runs').select('*');
 * ```
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // not needed in React Native
  },
});

// ────────────────────────────────────────────────────────────
// Helper re-exports
// ────────────────────────────────────────────────────────────

export type { Database };
export type SupabaseClient = typeof supabase;
