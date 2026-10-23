/** Legacy import bridge. Post-run summaries are now entirely local. */
import { getPostRunSummary } from "../features/coach/coachEngine";
import type { InjuryRiskAlert, PostRunInsight } from "../types/ai";
import type { Run } from "../features/coach/types";

export async function generatePostRunInsight(params: {
  distanceMeters: number;
  durationSeconds: number;
  avgPaceSecondsPerKm: number;
  splitsCount: number;
  bestPaceSecondsPerKm: number | null;
  splits?: Run["splits"];
}): Promise<PostRunInsight> {
  const { loadCoachHistory } = await import("../features/coach/loadHistory");
  const { useAuthStore } = await import("../store/auth");
  const state = useAuthStore.getState();
  const history = await loadCoachHistory(
    state.userId || state.profile.id,
  ).catch(() => []);
  const distance = history.reduce((sum, run) => sum + run.distanceKm, 0);
  const minutes = history.reduce((sum, run) => sum + run.durationMin, 0);
  const summary = getPostRunSummary({
    id: "current",
    startedAt: new Date().toISOString(),
    distanceKm: params.distanceMeters / 1000,
    durationMin: params.durationSeconds / 60,
    averagePaceSeconds: distance ? (minutes * 60) / distance : undefined,
    splits: params.splits,
  });
  return {
    headline: summary.headline,
    paceTrend: summary.body,
    effortAssessment: summary.highlight,
    improvementTip: summary.tip,
    fullText: [summary.body, summary.highlight, summary.tip].join("\n"),
    generatedAt: new Date().toISOString(),
  };
}

/** Compatibility for older callers. A volume flag is not an injury diagnosis. */
export function checkInjuryRisk(
  currentWeekMeters: number,
  fourWeekAverageMeters: number,
): InjuryRiskAlert {
  const ratio =
    fourWeekAverageMeters > 0 ? currentWeekMeters / fourWeekAverageMeters : 1;
  const riskLevel = ratio > 1.25 ? "high" : ratio > 1.12 ? "moderate" : "low";
  const increase = Math.max(0, Math.round((ratio - 1) * 100));
  const message =
    riskLevel === "high"
      ? `Mileage spike detected (+${increase}% above baseline). Consider an easier session and more recovery. This is a training-load flag, not an injury prediction.`
      : riskLevel === "moderate"
        ? `Weekly distance is ${increase}% above your baseline. Consider keeping the next session easy.`
        : "No large volume increase was detected. How you feel still matters when planning recovery.";
  return {
    severity: riskLevel === "moderate" ? "medium" : riskLevel,
    title: "Training load",
    riskLevel,
    message,
    recommendations: ["Adjust training to your recovery and comfort."],
    recommendedAction: "Adjust training to your recovery and comfort.",
    mileageIncreasePercent: increase,
    triggerKey: "weekly_mileage_surge",
    createdAt: new Date().toISOString(),
  };
}
