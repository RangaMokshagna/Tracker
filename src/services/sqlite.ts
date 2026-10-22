/**
 * STRIDE — SQLite local database for offline-first caching.
 *
 * Uses expo-sqlite (synchronous API on the JS thread via JSI).
 * Stores runs, route points, and splits for offline access, plus a
 * `pending_sync` queue so data can be pushed to Supabase when connectivity
 * resumes.
 */

import * as SQLite from 'expo-sqlite';

import type { LocationPoint, Split } from '../types/run';

// ────────────────────────────────────────────────────────────
// Database handle
// ────────────────────────────────────────────────────────────

const DB_NAME = 'stride.db';
const CURRENT_VERSION = 1;

let _db: SQLite.SQLiteDatabase | null = null;

/**
 * Open (or create) the local SQLite database and run pending migrations.
 *
 * @returns The initialised database handle.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await runMigrations(_db);
  return _db;
}

// ────────────────────────────────────────────────────────────
// Migrations
// ────────────────────────────────────────────────────────────

/**
 * Version-based migration runner.
 * Each migration is idempotent — it only runs once, tracked by `user_version`.
 */
async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await migrateV1(db);
  }

  // Future migrations: if (currentVersion < 2) { await migrateV2(db); }

  await db.execAsync(`PRAGMA user_version = ${CURRENT_VERSION}`);
}

/**
 * V1 — initial schema: runs, route_points, run_splits, pending_sync.
 */
async function migrateV1(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS runs (
      id               TEXT PRIMARY KEY,
      user_id          TEXT NOT NULL,
      started_at       TEXT NOT NULL,
      finished_at      TEXT,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      distance_meters  REAL    NOT NULL DEFAULT 0,
      avg_pace         REAL,
      best_pace        REAL,
      avg_speed        REAL,
      max_speed        REAL,
      calories_burned  REAL,
      elevation_gain   REAL,
      elevation_loss   REAL,
      avg_heart_rate   REAL,
      max_heart_rate   REAL,
      avg_cadence      REAL,
      route_polyline   TEXT,
      run_type         TEXT    NOT NULL DEFAULT 'free',
      source           TEXT    NOT NULL DEFAULT 'gps',
      title            TEXT,
      notes            TEXT,
      rating           INTEGER,
      perceived_effort INTEGER,
      is_race          INTEGER NOT NULL DEFAULT 0,
      synced           INTEGER NOT NULL DEFAULT 0,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS route_points (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id     TEXT    NOT NULL,
      sequence   INTEGER NOT NULL,
      latitude   REAL    NOT NULL,
      longitude  REAL    NOT NULL,
      altitude   REAL,
      accuracy   REAL,
      speed      REAL,
      heading    REAL,
      timestamp  TEXT    NOT NULL,
      FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_route_points_run
      ON route_points(run_id, sequence);

    CREATE TABLE IF NOT EXISTS run_splits (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id           TEXT    NOT NULL,
      split_number     INTEGER NOT NULL,
      distance_meters  REAL    NOT NULL,
      duration_seconds REAL    NOT NULL,
      pace             REAL    NOT NULL,
      elevation_change REAL,
      avg_heart_rate   REAL,
      FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_run_splits_run
      ON run_splits(run_id, split_number);

    CREATE TABLE IF NOT EXISTS pending_sync (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id  TEXT NOT NULL,
      action     TEXT NOT NULL CHECK(action IN ('insert', 'update', 'delete')),
      payload    TEXT NOT NULL,
      retries    INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_pending_sync_table
      ON pending_sync(table_name, created_at);
  `);
}

// ────────────────────────────────────────────────────────────
// Run CRUD
// ────────────────────────────────────────────────────────────

/** Offline run record stored in SQLite. */
export interface LocalRun {
  id: string;
  userId: string;
  user_id?: string;
  startedAt: string;
  started_at?: string;
  finishedAt: string | null;
  ended_at?: string | null;
  durationSeconds: number;
  duration_seconds?: number;
  distanceMeters: number;
  distance_meters?: number;
  avgPace: number | null;
  avg_pace_seconds_per_km?: number | null;
  bestPace: number | null;
  avgSpeed: number | null;
  maxSpeed: number | null;
  caloriesBurned: number | null;
  calories_burned?: number | null;
  elevationGain: number | null;
  elevation_gain_meters?: number | null;
  elevationLoss: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgCadence: number | null;
  routePolyline: string | null;
  runType: string;
  source: string;
  title: string | null;
  notes: string | null;
  ai_insight?: string | null;
  aiInsight?: string | null;
  weather_summary?: string | null;
  rating: number | null;
  perceivedEffort: number | null;
  isRace: boolean;
  synced: boolean;
}

/**
 * Insert a completed run into the local database.
 *
 * @param run - The run data to persist.
 */
export async function insertRun(run: LocalRun): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO runs (
      id, user_id, started_at, finished_at, duration_seconds, distance_meters,
      avg_pace, best_pace, avg_speed, max_speed, calories_burned,
      elevation_gain, elevation_loss, avg_heart_rate, max_heart_rate,
      avg_cadence, route_polyline, run_type, source, title, notes,
      rating, perceived_effort, is_race, synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      run.id,
      run.userId,
      run.startedAt,
      run.finishedAt,
      run.durationSeconds,
      run.distanceMeters,
      run.avgPace,
      run.bestPace,
      run.avgSpeed,
      run.maxSpeed,
      run.caloriesBurned,
      run.elevationGain,
      run.elevationLoss,
      run.avgHeartRate,
      run.maxHeartRate,
      run.avgCadence,
      run.routePolyline,
      run.runType,
      run.source,
      run.title,
      run.notes,
      run.rating,
      run.perceivedEffort,
      run.isRace ? 1 : 0,
      run.synced ? 1 : 0,
    ],
  );
}

/**
 * Retrieve a single run by its ID.
 *
 * @param id - Run UUID.
 * @returns The run record, or `null` if not found.
 */
export async function getRunById(id: string): Promise<LocalRun | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM runs WHERE id = ?',
    [id],
  );
  return row ? mapRowToLocalRun(row) : null;
}

/**
 * Retrieve all runs for a user, ordered by most recent first.
 *
 * @param userId - Supabase user ID.
 * @param limit  - Maximum number of runs to return (default 50).
 */
export async function getRunsByUser(
  userId: string,
  limit = 50,
): Promise<LocalRun[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM runs WHERE user_id = ? ORDER BY started_at DESC LIMIT ?',
    [userId, limit],
  );
  return rows.map(mapRowToLocalRun);
}

/**
 * Delete a run and its associated route points / splits.
 *
 * @param id - Run UUID.
 */
export async function deleteRun(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM run_splits WHERE run_id = ?', [id]);
  await db.runAsync('DELETE FROM route_points WHERE run_id = ?', [id]);
  await db.runAsync('DELETE FROM runs WHERE id = ?', [id]);
}

/**
 * Mark a run as synced with the remote database.
 *
 * @param id - Run UUID.
 */
export async function markRunSynced(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE runs SET synced = 1 WHERE id = ?', [id]);
}

/**
 * Retrieve all un-synced runs.
 */
export async function getUnsyncedRuns(): Promise<LocalRun[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM runs WHERE synced = 0 ORDER BY started_at ASC',
  );
  return rows.map(mapRowToLocalRun);
}

// ────────────────────────────────────────────────────────────
// Route Points CRUD
// ────────────────────────────────────────────────────────────

/**
 * Batch-insert route points for a run.
 *
 * @param runId  - Parent run UUID.
 * @param points - Ordered array of GPS points.
 */
export async function insertRoutePoints(
  runId: string,
  points: LocationPoint[],
): Promise<void> {
  if (points.length === 0) return;
  const db = await getDatabase();

  // Use a transaction for bulk inserts.
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      await db.runAsync(
        `INSERT INTO route_points
          (run_id, sequence, latitude, longitude, altitude, accuracy, speed, heading, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          runId,
          i,
          p.latitude,
          p.longitude,
          p.altitude,
          p.accuracy,
          p.speed,
          p.heading,
          new Date(p.timestamp).toISOString(),
        ],
      );
    }
  });
}

/**
 * Retrieve all route points for a run, ordered by sequence.
 */
export async function getRoutePoints(runId: string): Promise<LocationPoint[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM route_points WHERE run_id = ? ORDER BY sequence ASC',
    [runId],
  );
  return rows.map((r) => ({
    latitude: r['latitude'] as number,
    longitude: r['longitude'] as number,
    altitude: (r['altitude'] as number) ?? null,
    accuracy: (r['accuracy'] as number) ?? 0,
    speed: (r['speed'] as number) ?? null,
    heading: (r['heading'] as number) ?? null,
    timestamp: new Date(r['timestamp'] as string).getTime(),
  }));
}

// ────────────────────────────────────────────────────────────
// Splits CRUD
// ────────────────────────────────────────────────────────────

/**
 * Batch-insert splits for a run.
 *
 * @param runId  - Parent run UUID.
 * @param splits - Ordered array of splits.
 */
export async function insertSplits(
  runId: string,
  splits: Split[],
): Promise<void> {
  if (splits.length === 0) return;
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    for (const s of splits) {
      await db.runAsync(
        `INSERT INTO run_splits
          (run_id, split_number, distance_meters, duration_seconds, pace, elevation_change, avg_heart_rate)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          runId,
          s.number,
          s.distanceMeters,
          s.durationSeconds,
          s.paceSecondsPerKm,
          s.elevationChangeM,
          s.avgHeartRate,
        ],
      );
    }
  });
}

/**
 * Retrieve all splits for a run, ordered by split number.
 */
export async function getSplits(runId: string): Promise<Split[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM run_splits WHERE run_id = ? ORDER BY split_number ASC',
    [runId],
  );
  return rows.map((r) => ({
    number: r['split_number'] as number,
    distanceMeters: r['distance_meters'] as number,
    durationSeconds: r['duration_seconds'] as number,
    paceSecondsPerKm: r['pace'] as number,
    elevationChangeM: (r['elevation_change'] as number) ?? null,
    avgHeartRate: (r['avg_heart_rate'] as number) ?? null,
  }));
}

// ────────────────────────────────────────────────────────────
// Pending Sync Queue
// ────────────────────────────────────────────────────────────

/** An item waiting to be synced to Supabase. */
export interface PendingSyncItem {
  id: number;
  tableName: string;
  recordId: string;
  action: 'insert' | 'update' | 'delete';
  payload: string; // JSON string
  retries: number;
  createdAt: string;
}

/**
 * Enqueue a record for future sync.
 *
 * @param tableName - Target Supabase table (e.g. "runs").
 * @param recordId  - The record's UUID.
 * @param action    - insert | update | delete.
 * @param payload   - JSON-serialised payload.
 */
export async function enqueueSyncItem(
  tableName: string,
  recordId: string,
  action: 'insert' | 'update' | 'delete',
  payload: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO pending_sync (table_name, record_id, action, payload)
     VALUES (?, ?, ?, ?)`,
    [tableName, recordId, action, payload],
  );
}

/**
 * Retrieve all pending sync items, oldest first.
 */
export async function getPendingSyncItems(): Promise<PendingSyncItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM pending_sync ORDER BY created_at ASC',
  );
  return rows.map((r) => ({
    id: r['id'] as number,
    tableName: r['table_name'] as string,
    recordId: r['record_id'] as string,
    action: r['action'] as PendingSyncItem['action'],
    payload: r['payload'] as string,
    retries: r['retries'] as number,
    createdAt: r['created_at'] as string,
  }));
}

/**
 * Remove a sync item after successful sync.
 */
export async function removeSyncItem(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM pending_sync WHERE id = ?', [id]);
}

/**
 * Increment the retry counter for a failed sync item.
 */
export async function incrementSyncRetry(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE pending_sync SET retries = retries + 1 WHERE id = ?',
    [id],
  );
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/** Map a raw SQLite row to a typed LocalRun. */
function mapRowToLocalRun(row: Record<string, unknown>): LocalRun {
  const startedAt = row['started_at'] as string;
  const durationSeconds = row['duration_seconds'] as number;
  const distanceMeters = row['distance_meters'] as number;
  const avgPace = (row['avg_pace'] as number) ?? null;
  const caloriesBurned = (row['calories_burned'] as number) ?? null;
  const elevationGain = (row['elevation_gain'] as number) ?? null;

  return {
    id: row['id'] as string,
    userId: row['user_id'] as string,
    user_id: row['user_id'] as string,
    startedAt,
    started_at: startedAt,
    finishedAt: (row['finished_at'] as string) ?? null,
    ended_at: (row['finished_at'] as string) ?? null,
    durationSeconds,
    duration_seconds: durationSeconds,
    distanceMeters,
    distance_meters: distanceMeters,
    avgPace,
    avg_pace_seconds_per_km: avgPace,
    bestPace: (row['best_pace'] as number) ?? null,
    avgSpeed: (row['avg_speed'] as number) ?? null,
    maxSpeed: (row['max_speed'] as number) ?? null,
    caloriesBurned,
    calories_burned: caloriesBurned,
    elevationGain,
    elevation_gain_meters: elevationGain,
    elevationLoss: (row['elevation_loss'] as number) ?? null,
    avgHeartRate: (row['avg_heart_rate'] as number) ?? null,
    maxHeartRate: (row['max_heart_rate'] as number) ?? null,
    avgCadence: (row['avg_cadence'] as number) ?? null,
    routePolyline: (row['route_polyline'] as string) ?? null,
    runType: (row['run_type'] as string) ?? 'free',
    source: (row['source'] as string) ?? 'gps',
    title: (row['title'] as string) ?? null,
    notes: (row['notes'] as string) ?? null,
    ai_insight: (row['notes'] as string) ?? null,
    aiInsight: (row['notes'] as string) ?? null,
    rating: (row['rating'] as number) ?? null,
    perceivedEffort: (row['perceived_effort'] as number) ?? null,
    isRace: (row['is_race'] as number) === 1,
    synced: (row['synced'] as number) === 1,
  };
}

// ────────────────────────────────────────────────────────────
// Convenience Aliases & API
// ────────────────────────────────────────────────────────────

export type StoredRun = LocalRun;

export interface InsertRunParams {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  distance_meters: number;
  duration_seconds: number;
  avg_pace_seconds_per_km: number;
  calories_burned: number;
  elevation_gain_meters: number;
  route_polyline: string;
  weather_summary: string | null;
  ai_insight: string | null;
  status: string;
  created_at: string;
}

export async function getAllRuns(): Promise<LocalRun[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM runs ORDER BY started_at DESC'
  );
  return rows.map(mapRowToLocalRun);
}

export async function getRecentRuns(limit = 10): Promise<LocalRun[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM runs ORDER BY started_at DESC LIMIT ?',
    [limit]
  );
  return rows.map(mapRowToLocalRun);
}

export async function getRunSplits(runId: string): Promise<Split[]> {
  return getSplits(runId);
}

export async function saveRun(
  runData: InsertRunParams,
  points: LocationPoint[],
  splits: Split[]
): Promise<void> {
  const localRun: LocalRun = {
    id: runData.id,
    userId: runData.user_id,
    startedAt: runData.started_at,
    finishedAt: runData.ended_at,
    durationSeconds: runData.duration_seconds,
    distanceMeters: runData.distance_meters,
    avgPace: runData.avg_pace_seconds_per_km,
    bestPace: null,
    avgSpeed: runData.avg_pace_seconds_per_km > 0 ? Math.round((1000 / runData.avg_pace_seconds_per_km) * 10) / 10 : 0,
    maxSpeed: 0,
    caloriesBurned: runData.calories_burned,
    elevationGain: runData.elevation_gain_meters,
    elevationLoss: 0,
    avgHeartRate: null,
    maxHeartRate: null,
    avgCadence: null,
    routePolyline: runData.route_polyline,
    runType: 'free',
    source: 'stride_gps',
    title: null,
    notes: null,
    rating: null,
    perceivedEffort: null,
    isRace: false,
    synced: false,
  };

  await insertRun(localRun);
  if (points && points.length > 0) {
    await insertRoutePoints(localRun.id, points);
  }
  if (splits && splits.length > 0) {
    await insertSplits(localRun.id, splits);
  }
  await enqueueSyncItem('runs', localRun.id, 'insert', JSON.stringify(runData));
}

