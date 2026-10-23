/** Minimal local coaching data. No identity or GPS is needed by the engine. */
export type RunMode = "outdoor" | "trail" | "treadmill";
export interface Run {
  id: string;
  startedAt: string;
  distanceKm: number;
  durationMin: number;
  mode?: RunMode;
  splits?: readonly { distanceKm: number; durationMin: number }[];
  averagePaceSeconds?: number;
}
export interface Profile {
  referenceDate: string; // Inject the clock so every engine function stays pure.
  timeZone?: string;
  weightKg?: number;
  weeklyGoalKm: number;
  daysPerWeek: number;
}
export interface Insight {
  id: string;
  title: string;
  body: string;
  severity: "warning" | "recovery" | "tip" | "celebration";
  icon: "trend" | "rest" | "pace" | "trophy" | "footprints" | "check";
}
export type Level = "beginner" | "intermediate";
export type GoalDistance = 5 | 10 | 21;
export interface Workout {
  id: string;
  kind: "intervals" | "rest" | "easy" | "long";
  title: string;
  instruction: string;
  distanceKm: number;
  durationMin: number;
}
export interface Plan {
  id: string;
  level: Level;
  goalDistance: GoalDistance;
  title: string;
  prerequisite: string;
  daysPerWeek: 2 | 3 | 4;
  weeks: { number: number; days: Workout[] }[];
}
export interface CoachContext {
  weeklyDistanceKm: number;
  averagePaceSeconds: number | null;
  goal: string;
}
export interface ChatReply {
  text: string;
  source: "gemini" | "offline";
  remaining: number | null;
  cached?: boolean;
  reason?: string;
}
