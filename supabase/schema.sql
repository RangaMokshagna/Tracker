-- ============================================================
-- STRIDE — Complete Supabase (Postgres) schema
-- ============================================================
-- Run this file via the Supabase SQL editor or as a migration.
-- All tables live in the `public` schema.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Extensions
-- ────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- gen_random_uuid()

-- ────────────────────────────────────────────────────────────
-- Custom ENUM types
-- ────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE run_type       AS ENUM ('free', 'distance', 'time', 'interval', 'race');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE run_source     AS ENUM ('gps', 'manual', 'treadmill');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE goal_period    AS ENUM ('daily', 'weekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE goal_metric    AS ENUM ('distance', 'duration', 'runs', 'calories');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE badge_category AS ENUM ('distance', 'streak', 'pace', 'social', 'special');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ai_message_role AS ENUM ('user', 'assistant', 'system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE plan_difficulty AS ENUM ('easy', 'moderate', 'hard');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE unit_preference AS ENUM ('km', 'mi');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE theme_preference AS ENUM ('light', 'dark', 'system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ────────────────────────────────────────────────────────────
-- Helper: auto-update `updated_at` trigger
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- 1. USERS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id                     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                  TEXT NOT NULL,
  display_name           TEXT,
  avatar_url             TEXT,
  weight_kg              REAL,
  height_cm              REAL,
  date_of_birth          DATE,
  gender                 TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'prefer_not_to_say')),
  unit_preference        unit_preference  NOT NULL DEFAULT 'km',
  theme_preference       theme_preference NOT NULL DEFAULT 'system',
  weekly_distance_goal_m REAL             NOT NULL DEFAULT 20000,
  weekly_run_goal        INTEGER          NOT NULL DEFAULT 3,
  notification_enabled   BOOLEAN          NOT NULL DEFAULT TRUE,
  onboarding_completed   BOOLEAN          NOT NULL DEFAULT FALSE,
  timezone               TEXT             NOT NULL DEFAULT 'UTC',
  created_at             TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────
-- 2. RUNS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS runs (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at              TIMESTAMPTZ NOT NULL,
  finished_at             TIMESTAMPTZ,
  duration_seconds        INTEGER     NOT NULL DEFAULT 0,
  distance_meters         REAL        NOT NULL DEFAULT 0,
  avg_pace_seconds_per_km REAL,
  best_pace_seconds_per_km REAL,
  avg_speed_mps           REAL,
  max_speed_mps           REAL,
  calories_burned         REAL,
  elevation_gain_m        REAL,
  elevation_loss_m        REAL,
  avg_heart_rate          REAL,
  max_heart_rate          REAL,
  avg_cadence             REAL,
  route_polyline          TEXT,
  run_type                run_type    NOT NULL DEFAULT 'free',
  source                  run_source  NOT NULL DEFAULT 'gps',
  title                   TEXT,
  notes                   TEXT,
  weather_temp_c          REAL,
  weather_condition       TEXT,
  weather_humidity        REAL,
  rating                  SMALLINT    CHECK (rating BETWEEN 1 AND 5),
  perceived_effort        SMALLINT    CHECK (perceived_effort BETWEEN 1 AND 10),
  is_race                 BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_runs_user_started   ON runs (user_id, started_at DESC);
CREATE INDEX idx_runs_user_distance  ON runs (user_id, distance_meters DESC);

CREATE TRIGGER trg_runs_updated_at
  BEFORE UPDATE ON runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────
-- 3. RUN SPLITS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS run_splits (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            UUID    NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  split_number      INTEGER NOT NULL,
  distance_meters   REAL    NOT NULL,
  duration_seconds  REAL    NOT NULL,
  pace_seconds_per_km REAL  NOT NULL,
  elevation_change_m REAL,
  avg_heart_rate    REAL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (run_id, split_number)
);

CREATE INDEX idx_run_splits_run ON run_splits (run_id, split_number);

-- ────────────────────────────────────────────────────────────
-- 4. ROUTE POINTS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS route_points (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id     UUID    NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  sequence   INTEGER NOT NULL,
  latitude   DOUBLE PRECISION NOT NULL,
  longitude  DOUBLE PRECISION NOT NULL,
  altitude_m REAL,
  accuracy_m REAL,
  speed_mps  REAL,
  heading    REAL,
  timestamp  TIMESTAMPTZ NOT NULL,

  UNIQUE (run_id, sequence)
);

CREATE INDEX idx_route_points_run ON route_points (run_id, sequence);

-- ────────────────────────────────────────────────────────────
-- 5. AI MESSAGES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_messages (
  id                UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  run_id            UUID            REFERENCES runs(id) ON DELETE SET NULL,
  role              ai_message_role NOT NULL,
  content           TEXT            NOT NULL,
  context_metadata  JSONB,
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_messages_user    ON ai_messages (user_id, created_at DESC);
CREATE INDEX idx_ai_messages_run     ON ai_messages (run_id) WHERE run_id IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- 6. GOALS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS goals (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric        goal_metric NOT NULL,
  period        goal_period NOT NULL,
  target_value  REAL        NOT NULL,
  current_value REAL        NOT NULL DEFAULT 0,
  start_date    DATE        NOT NULL,
  end_date      DATE        NOT NULL,
  completed     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_user_period ON goals (user_id, period, start_date DESC);

CREATE TRIGGER trg_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────
-- 7. STREAKS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS streaks (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric             goal_metric NOT NULL,
  current_count      INTEGER     NOT NULL DEFAULT 0,
  longest_count      INTEGER     NOT NULL DEFAULT 0,
  last_activity_date DATE,
  started_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, metric)
);

CREATE TRIGGER trg_streaks_updated_at
  BEFORE UPDATE ON streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────
-- 8. BADGES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS badges (
  id        UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_key TEXT           NOT NULL,
  category  badge_category NOT NULL,
  earned_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  run_id    UUID           REFERENCES runs(id) ON DELETE SET NULL,

  UNIQUE (user_id, badge_key)
);

CREATE INDEX idx_badges_user ON badges (user_id, earned_at DESC);

-- ────────────────────────────────────────────────────────────
-- 9. WEEKLY PLANS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS weekly_plans (
  id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start       DATE            NOT NULL,
  plan_json        JSONB           NOT NULL,
  difficulty       plan_difficulty NOT NULL DEFAULT 'moderate',
  total_distance_m REAL            NOT NULL DEFAULT 0,
  total_runs       INTEGER         NOT NULL DEFAULT 0,
  ai_rationale     TEXT,
  accepted         BOOLEAN         NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, week_start)
);

CREATE TRIGGER trg_weekly_plans_updated_at
  BEFORE UPDATE ON weekly_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ────────────────────────────────────────────────────────────
-- Streak calculation function
-- ────────────────────────────────────────────────────────────

/**
 * update_running_streak(p_user_id UUID)
 *
 * Called after a run is saved. Recalculates the user's running streak
 * (consecutive days with at least one run). Updates the `streaks` row
 * for metric = 'runs'.
 */
CREATE OR REPLACE FUNCTION update_running_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_today          DATE := CURRENT_DATE;
  v_last_date      DATE;
  v_current_streak INTEGER := 0;
  v_run_date       DATE;
  v_prev_date      DATE;
BEGIN
  -- Walk backwards through distinct run dates
  v_prev_date := v_today;
  FOR v_run_date IN
    SELECT DISTINCT DATE(started_at) AS d
    FROM runs
    WHERE user_id = p_user_id
    ORDER BY d DESC
  LOOP
    -- If this date is today or yesterday relative to prev_date, it's consecutive
    IF v_run_date = v_prev_date OR v_run_date = v_prev_date - INTERVAL '1 day' THEN
      v_current_streak := v_current_streak + 1;
      v_prev_date := v_run_date;
    ELSE
      EXIT; -- streak broken
    END IF;
  END LOOP;

  -- Upsert the streak record
  INSERT INTO streaks (user_id, metric, current_count, longest_count, last_activity_date, started_at)
  VALUES (p_user_id, 'runs', v_current_streak, v_current_streak, v_today, NOW())
  ON CONFLICT (user_id, metric) DO UPDATE SET
    current_count      = v_current_streak,
    longest_count      = GREATEST(streaks.longest_count, v_current_streak),
    last_activity_date = v_today;
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────
-- Trigger: auto-update streak after a new run
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trg_after_run_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_running_streak(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_runs_streak
  AFTER INSERT ON runs
  FOR EACH ROW EXECUTE FUNCTION trg_after_run_insert();

-- ────────────────────────────────────────────────────────────
-- Row-Level Security (RLS)
-- ────────────────────────────────────────────────────────────

ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_splits    ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_points  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plans  ENABLE ROW LEVEL SECURITY;

-- Users: can read/update own row only
CREATE POLICY users_select ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_insert ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY users_update ON users FOR UPDATE USING (auth.uid() = id);

-- Runs: CRUD own data
CREATE POLICY runs_select ON runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY runs_insert ON runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY runs_update ON runs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY runs_delete ON runs FOR DELETE USING (auth.uid() = user_id);

-- Run splits: tied to own runs
CREATE POLICY splits_select ON run_splits FOR SELECT
  USING (EXISTS (SELECT 1 FROM runs WHERE runs.id = run_splits.run_id AND runs.user_id = auth.uid()));
CREATE POLICY splits_insert ON run_splits FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM runs WHERE runs.id = run_splits.run_id AND runs.user_id = auth.uid()));
CREATE POLICY splits_delete ON run_splits FOR DELETE
  USING (EXISTS (SELECT 1 FROM runs WHERE runs.id = run_splits.run_id AND runs.user_id = auth.uid()));

-- Route points: tied to own runs
CREATE POLICY points_select ON route_points FOR SELECT
  USING (EXISTS (SELECT 1 FROM runs WHERE runs.id = route_points.run_id AND runs.user_id = auth.uid()));
CREATE POLICY points_insert ON route_points FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM runs WHERE runs.id = route_points.run_id AND runs.user_id = auth.uid()));
CREATE POLICY points_delete ON route_points FOR DELETE
  USING (EXISTS (SELECT 1 FROM runs WHERE runs.id = route_points.run_id AND runs.user_id = auth.uid()));

-- AI messages: own data
CREATE POLICY ai_select ON ai_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY ai_insert ON ai_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Goals: own data
CREATE POLICY goals_select ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY goals_insert ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY goals_update ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY goals_delete ON goals FOR DELETE USING (auth.uid() = user_id);

-- Streaks: own data (read + auto-managed via trigger)
CREATE POLICY streaks_select ON streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY streaks_insert ON streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY streaks_update ON streaks FOR UPDATE USING (auth.uid() = user_id);

-- Badges: own data (read only; awarded server-side)
CREATE POLICY badges_select ON badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY badges_insert ON badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Weekly plans: own data
CREATE POLICY plans_select ON weekly_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY plans_insert ON weekly_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY plans_update ON weekly_plans FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- Done! All tables, indexes, triggers, functions, and RLS
-- policies are in place.
-- ============================================================
