/**
 * STRIDE — AI Coach type definitions.
 */

// ────────────────────────────────────────────────────────────
// Chat
// ────────────────────────────────────────────────────────────

/** A single message in the AI Coach conversation. */
export interface ChatMessage {
  id: string;
  /** Who sent the message. */
  role: 'user' | 'assistant' | 'system';
  /** Markdown content of the message. */
  content: string;
  /** Optional run context attached to this message. */
  runId: string | null;
  /** Extra metadata (e.g. weekly stats snapshot). */
  contextMetadata: Record<string, unknown> | null;
  /** ISO timestamp. */
  createdAt: string;
}

// ────────────────────────────────────────────────────────────
// Post-Run Insight
// ────────────────────────────────────────────────────────────

/** AI-generated insight shown after a run is saved. */
export interface PostRunInsight {
  /** Short headline (e.g. "Strong negative split!"). */
  headline?: string;
  /** Longer body copy with analysis. */
  body?: string;
  /** Suggestions for the next run. */
  suggestions?: string[];
  /** Comparison to recent performance. */
  comparison?: PostRunComparison | null;

  // 3-Line summary format
  paceTrend: string;
  effortAssessment: string;
  improvementTip: string;
  fullText: string;
  runId?: string;
  generatedAt?: string;
}

/** How the just-completed run compares to recent history. */
export interface PostRunComparison {
  /** "faster" | "slower" | "similar" relative to avg pace. */
  paceVsAvg: 'faster' | 'slower' | 'similar';
  /** Pace difference in seconds per km (positive = faster). */
  paceDeltaSeconds: number;
  /** Distance comparison vs weekly average run. */
  distanceVsAvg: 'longer' | 'shorter' | 'similar';
  /** Distance delta in meters. */
  distanceDeltaM: number;
}

// ────────────────────────────────────────────────────────────
// Weekly Plan
// ────────────────────────────────────────────────────────────

/** AI-generated weekly training plan. */
export interface WeeklyPlan {
  id: string;
  weekStart: string; // ISO date (Monday)
  difficulty: 'easy' | 'moderate' | 'hard';
  totalDistanceM: number;
  totalRuns: number;
  /** Explanation of why the AI chose this plan. */
  aiRationale: string;
  /** Per-day breakdown. */
  days: WeeklyPlanDay[];
  /** Whether the user has accepted this plan. */
  accepted: boolean;
}

/** A single day within a weekly plan. */
export interface WeeklyPlanDay {
  day:
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday';
  /** Workout type for this day. */
  type: 'rest' | 'easy' | 'tempo' | 'interval' | 'long' | 'recovery';
  /** Prescribed distance in meters. */
  distanceM: number;
  /** Estimated duration in minutes. */
  durationMinutes: number;
  /** Human-readable description. */
  description: string;
  /** Whether the user has completed this day. */
  completed: boolean;
}

// ────────────────────────────────────────────────────────────
// Injury Risk Alert
// ────────────────────────────────────────────────────────────

/** AI-detected injury risk alert. */
export interface InjuryRiskAlert {
  /** Severity level. */
  severity: 'low' | 'medium' | 'high';
  /** Short title. */
  title: string;
  /** Detailed explanation. */
  message: string;
  /** Recommended actions (e.g. "Take a rest day"). */
  recommendations: string[];
  /** What triggered the alert (e.g. "rapid_mileage_increase"). */
  triggerKey: string;
  /** ISO timestamp of when the alert was generated. */
  createdAt: string;

  riskLevel?: 'low' | 'moderate' | 'high';
  recommendedAction?: string;
  mileageIncreasePercent?: number;
}

// ────────────────────────────────────────────────────────────
// AI Request / Response wrappers
// ────────────────────────────────────────────────────────────

/** Payload sent to the AI edge function for chat. */
export interface AiChatRequest {
  messages: Pick<ChatMessage, 'role' | 'content'>[];
  runId?: string;
  /** Snapshot of the user's recent stats for context. */
  context?: AiContext;
}

/** Contextual data bundled with AI requests. */
export interface AiContext {
  recentRuns: AiRunSnapshot[];
  weeklyDistanceM: number;
  weeklyRunCount: number;
  currentStreak: number;
  personalBests: Record<string, number | null>;
}

/** Minimal run data sent as AI context (to stay within token limits). */
export interface AiRunSnapshot {
  distanceM: number;
  durationS: number;
  paceSecondsPerKm: number;
  date: string;
}
