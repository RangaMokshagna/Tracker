/**
 * STRIDE — Offline Sync Service
 * Synchronizes pending SQLite runs with Supabase Postgres backend.
 */

import NetInfo from '@react-native-community/netinfo';
import { supabase, isSupabaseConfigured } from './supabase';
import { getDatabase } from './sqlite';

let isSyncing = false;

export async function syncPendingRuns(): Promise<{ synced: number; failed: number }> {
  if (isSyncing || !isSupabaseConfigured) {
    return { synced: 0, failed: 0 };
  }

  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    return { synced: 0, failed: 0 };
  }

  isSyncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const db = await getDatabase();
    const pendingRecords = await db.getAllAsync<{
      id: string;
      table_name: string;
      record_id: string;
      action: string;
      payload: string;
    }>('SELECT * FROM pending_sync ORDER BY created_at ASC LIMIT 20');

    for (const record of pendingRecords) {
      try {
        const payload = JSON.parse(record.payload);

        if (record.table_name === 'runs' && record.action === 'INSERT') {
          const runPayload: any = {
            id: payload.id,
            user_id: payload.user_id,
            started_at: payload.started_at,
            ended_at: payload.ended_at,
            distance_meters: payload.distance_meters,
            duration_seconds: payload.duration_seconds,
            avg_pace_seconds_per_km: payload.avg_pace_seconds_per_km,
            calories_burned: payload.calories_burned,
            elevation_gain_meters: payload.elevation_gain_meters,
            route_polyline: payload.route_polyline,
            weather_summary: payload.weather_summary,
            ai_insight: payload.ai_insight,
            status: payload.status,
          };
          const { error } = await supabase.from('runs').upsert(runPayload);

          if (error) throw error;
        }

        // Delete from sync queue
        await db.runAsync('DELETE FROM pending_sync WHERE id = ?', [record.id]);
        synced++;
      } catch (err) {
        console.warn(`[STRIDE] Sync error for record ${record.id}:`, err);
        failed++;
      }
    }
  } catch (err) {
    console.warn('[STRIDE] Sync batch error:', err);
  } finally {
    isSyncing = false;
  }

  return { synced, failed };
}
