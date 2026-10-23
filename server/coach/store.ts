import { DatabaseSync } from "node:sqlite";
import { DAILY_LIMIT, USER_RPM } from "./config.ts";
export class CoachStore {
  db: DatabaseSync;
  globalRpm: number;
  constructor(path: string, globalRpm = 4) {
    this.db = new DatabaseSync(path);
    this.globalRpm = Math.max(1, Math.min(4, globalRpm));
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS usage (user TEXT, day TEXT, count INTEGER NOT NULL, PRIMARY KEY(user, day));
      CREATE TABLE IF NOT EXISTS throttle (bucket TEXT, minute INTEGER, count INTEGER NOT NULL, PRIMARY KEY(bucket, minute));
      CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, text TEXT NOT NULL, expires INTEGER NOT NULL);`);
  }
  remaining(user: string, now: number): number {
    const row = this.db
      .prepare("SELECT count FROM usage WHERE user=? AND day=?")
      .get(user, new Date(now).toISOString().slice(0, 10)) as
      | { count: number }
      | undefined;
    return Math.max(0, DAILY_LIMIT - (row?.count || 0));
  }
  cached(key: string, now: number): string | null {
    const row = this.db
      .prepare("SELECT text FROM cache WHERE key=? AND expires>?")
      .get(key, now) as { text: string } | undefined;
    return row?.text || null;
  }
  put(key: string, text: string, expires: number) {
    this.db
      .prepare("INSERT OR REPLACE INTO cache VALUES(?,?,?)")
      .run(key, text, expires);
  }
  reserve(
    user: string,
    now: number,
    cached: boolean,
  ): { allowed: boolean; remaining: number; reason?: string } {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const day = new Date(now).toISOString().slice(0, 10),
        minute = Math.floor(now / 60000),
        remaining = this.remaining(user, now);
      let reason: string | undefined = remaining ? undefined : "daily-limit";
      if (!reason && !cached)
        for (const [bucket, limit] of [
          [user, USER_RPM],
          ["__global__", this.globalRpm],
        ] as const) {
          const row = this.db
            .prepare("SELECT count FROM throttle WHERE bucket=? AND minute=?")
            .get(bucket, minute) as { count: number } | undefined;
          if ((row?.count || 0) >= limit) reason = "minute-limit";
        }
      if (reason) {
        this.db.exec("COMMIT");
        return { allowed: false, remaining, reason };
      }
      this.db
        .prepare(
          "INSERT INTO usage VALUES(?,?,1) ON CONFLICT(user,day) DO UPDATE SET count=count+1",
        )
        .run(user, day);
      if (!cached)
        for (const bucket of [user, "__global__"])
          this.db
            .prepare(
              "INSERT INTO throttle VALUES(?,?,1) ON CONFLICT(bucket,minute) DO UPDATE SET count=count+1",
            )
            .run(bucket, minute);
      this.db.prepare("DELETE FROM cache WHERE expires<=?").run(now);
      this.db.prepare("DELETE FROM throttle WHERE minute<?").run(minute - 2);
      this.db
        .prepare("DELETE FROM usage WHERE day<?")
        .run(new Date(now - 172800000).toISOString().slice(0, 10));
      this.db.exec("COMMIT");
      return { allowed: true, remaining: remaining - 1 };
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  close() {
    this.db.close();
  }
}
