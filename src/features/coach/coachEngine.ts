import { pace } from "./format.ts";
import catalog from "./plans.json";
import type {
  GoalDistance,
  Insight,
  Level,
  Plan,
  Profile,
  Run,
  RunMode,
  Workout,
} from "./types";
export { pace } from "./format.ts";
export { offlineAnswer } from "./offlineCoach.ts";

const DAY = 86400000;
const finitePositive = (n: number) => Number.isFinite(n) && n > 0;
const round = (n: number) => Math.round(n * 10) / 10;
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
export function estimateCalories({
  weightKg,
  distanceKm,
  durationMin,
  mode = "outdoor",
}: {
  weightKg: number;
  distanceKm: number;
  durationMin: number;
  mode?: RunMode;
}): number {
  if (![weightKg, distanceKm, durationMin].every(finitePositive)) return 0;
  const speed = (distanceKm * 60) / durationMin;
  if (!Number.isFinite(speed)) return 0;
  // Approximate pace bands, km/h. Gross energy: MET × 3.5 × kg / 200 × minutes.
  const bands = [
    [4, 2.5],
    [6, 3.5],
    [8, 6],
    [9.7, 8.3],
    [11.3, 9.8],
    [12.9, 11],
    [14.5, 11.8],
    [16.1, 12.8],
    [Infinity, 14.5],
  ];
  const met = bands.find(([upper]) => speed < upper)![1];
  return Math.round(
    ((met *
      (mode === "trail" ? 1.08 : mode === "treadmill" ? 0.97 : 1) *
      3.5 *
      weightKg) /
      200) *
      durationMin,
  );
}

export function dayKey(date: string, timeZone = "UTC"): string {
  let formatter = dateFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    dateFormatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(new Date(date));
  return ["year", "month", "day"]
    .map((key) => parts.find((p) => p.type === key)!.value)
    .join("-");
}
export function dayNumber(date: string, timeZone = "UTC"): number {
  return Date.parse(`${dayKey(date, timeZone)}T00:00:00Z`) / DAY;
}
const valid = (run: Run) =>
  finitePositive(run.distanceKm) &&
  finitePositive(run.durationMin) &&
  Number.isFinite(Date.parse(run.startedAt));

export function getWeekProgress(history: readonly Run[], profile: Profile) {
  const today = dayNumber(profile.referenceDate, profile.timeZone);
  const monday = today - ((new Date(today * DAY).getUTCDay() + 6) % 7);
  const rows = history
    .filter(valid)
    .filter(
      (run) => Date.parse(run.startedAt) <= Date.parse(profile.referenceDate),
    );
  const total = (start: number, end: number) =>
    rows
      .filter((run) => {
        const d = dayNumber(run.startedAt, profile.timeZone);
        return d >= start && d < end;
      })
      .reduce((sum, run) => sum + run.distanceKm, 0);
  const days = Array.from({ length: 7 }, (_, i) => ({
    day: ["M", "T", "W", "T", "F", "S", "S"][i],
    distanceKm: round(total(monday + i, monday + i + 1)),
    isToday: monday + i === today,
  }));
  let streak = 0;
  const dates = new Set(
    rows.map((run) => dayNumber(run.startedAt, profile.timeZone)),
  );
  let cursor = dates.has(today) ? today : today - 1;
  while (dates.has(cursor--)) streak++;
  return {
    days,
    distanceKm: total(monday, monday + 7),
    previousKm: total(monday - 7, monday),
    streak,
    monday,
    today,
  };
}

/** Split-based benchmark; never extrapolate a 10K record from a shorter run. */
export function benchmark(run: Run, distance: number): number | null {
  if (!valid(run) || run.distanceKm + 0.000001 < distance) return null;
  if (Math.abs(run.distanceKm - distance) < 0.001) return run.durationMin * 60;
  const splits = run.splits?.filter(
    (s) => finitePositive(s.distanceKm) && finitePositive(s.durationMin),
  );
  if (!splits?.length) return null;
  const points = [{ km: 0, minutes: 0 }];
  for (const s of splits) {
    const last = points[points.length - 1];
    points.push({
      km: last.km + s.distanceKm,
      minutes: last.minutes + s.durationMin,
    });
  }
  const end = points[points.length - 1].km;
  if (end < distance) return null;
  const at = (km: number) => {
    if (km <= 0) return 0;
    const i = points.findIndex((p) => p.km >= km);
    const a = points[i - 1],
      b = points[i];
    return a.minutes + ((b.minutes - a.minutes) * (km - a.km)) / (b.km - a.km);
  };
  const starts = [
    ...points.map((p) => p.km),
    ...points.map((p) => p.km - distance),
  ].filter((km) => km >= 0 && km + distance <= end);
  return Math.min(
    ...starts.map((start) => (at(start + distance) - at(start)) * 60),
  );
}
function halfPaces(run: Run) {
  const splits = run.splits?.filter(
    (s) => finitePositive(s.distanceKm) && finitePositive(s.durationMin),
  );
  if (!splits || splits.length < 2) return null;
  const total = splits.reduce((sum, s) => sum + s.distanceKm, 0);
  if (Math.abs(total - run.distanceKm) > Math.max(0.05, run.distanceKm * 0.02))
    return null;
  let covered = 0,
    firstTime = 0,
    secondTime = 0;
  for (const split of splits) {
    const firstKm = Math.min(
      split.distanceKm,
      Math.max(0, total / 2 - covered),
    );
    firstTime += (split.durationMin * firstKm) / split.distanceKm;
    secondTime += split.durationMin * (1 - firstKm / split.distanceKm);
    covered += split.distanceKm;
  }
  return [(firstTime * 120) / total, (secondTime * 120) / total];
}
export function getInsights(
  history: readonly Run[],
  profile: Profile,
): Insight[] {
  const runs = history
    .filter(valid)
    .filter(
      (run) => Date.parse(run.startedAt) <= Date.parse(profile.referenceDate),
    )
    .slice()
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
  if (!runs.length) return [];
  const weekly = getWeekProgress(runs, profile);
  const insights: Insight[] = [];
  const latest = runs[0];
  const fresh =
    weekly.today - dayNumber(latest.startedAt, profile.timeZone) <= 7;
  if (
    weekly.previousKm > 0 &&
    weekly.distanceKm / weekly.previousKm > 1.1 + 1e-9
  )
    insights.push({
      id: `volume-${weekly.monday}`,
      title: "Give your body time to adapt",
      body: `You ran ${round(weekly.distanceKm)} km this week versus ${round(weekly.previousKm)} km last week (+${Math.round((weekly.distanceKm / weekly.previousKm - 1) * 100)}%). Consider an easier next session. A 10% rise is a planning flag, not an injury prediction.`,
      severity: "warning",
      icon: "trend",
    });
  if (weekly.streak >= 3)
    insights.push({
      id: `rest-${dayKey(latest.startedAt, profile.timeZone)}`,
      title: "A recovery day counts, too",
      body: `${weekly.streak} consecutive running days since your last rest day. Choose rest or a gentle walk today to make room for recovery.`,
      severity: "recovery",
      icon: "rest",
    });
  const halves = halfPaces(latest);
  if (fresh && halves && halves[1] / halves[0] > 1.08 + 1e-9)
    insights.push({
      id: `pace-${latest.id}`,
      title: "Start 10 seconds per km slower.",
      body: `Your first half averaged ${pace(halves[0])}/km; your second half ${pace(halves[1])}/km (${Math.round((halves[1] / halves[0] - 1) * 100)}% slower). Try starting near ${pace(halves[0] + 10)}/km next time, at a comfortable effort.`,
      severity: "tip",
      icon: "pace",
    });
  const records = [1, 5, 10].flatMap((distance) => {
    const current = benchmark(latest, distance);
    const previous = runs
      .slice(1)
      .map((r) => benchmark(r, distance))
      .filter((n): n is number => n !== null);
    const best = Math.min(...previous);
    return current !== null && previous.length && current < best - 0.5
      ? [{ distance, current, improvement: Math.round(best - current) }]
      : [];
  });
  if (fresh && records.length)
    insights.push({
      id: `pb-${latest.id}`,
      title: `A new ${records.map((r) => `${r.distance}K`).join(" & ")} best`,
      body:
        records
          .map(
            (r) =>
              `${r.distance}K in ${pace(r.current)} — ${r.improvement} seconds faster than your previous recorded best.`,
          )
          .join(" ") + " Enjoy this milestone and keep your next session easy.",
      severity: "celebration",
      icon: "trophy",
    });
  const gap = weekly.today - dayNumber(latest.startedAt, profile.timeZone);
  if (gap >= 2)
    insights.push({
      id: `nudge-${weekly.today}`,
      title: "Your next chapter can be short",
      body: `It has been ${gap} days since your ${round(latest.distanceKm)} km run. If you feel ready, try a gentle 2K run/walk. Rest is always a valid choice.`,
      severity: "tip",
      icon: "footprints",
    });
  const lastWeek = runs.filter((run) => {
    const day = dayNumber(run.startedAt, profile.timeZone);
    return day >= weekly.monday - 7 && day < weekly.monday;
  });
  const uniqueDays = new Set(
    lastWeek.map((r) => dayKey(r.startedAt, profile.timeZone)),
  ).size;
  if (
    profile.weeklyGoalKm > 0 &&
    weekly.previousKm >= profile.weeklyGoalKm &&
    uniqueDays >= profile.daysPerWeek &&
    !insights.some((i) => i.severity === "warning" || i.severity === "recovery")
  )
    insights.push({
      id: `consistent-${weekly.monday}`,
      title: "A week to feel good about",
      body: `${uniqueDays} running days and ${round(weekly.previousKm)} km last week met your ${profile.weeklyGoalKm} km target. If you feel recovered, consider ${round(profile.weeklyGoalKm * 1.05)} km next — a 5% increase.`,
      severity: "celebration",
      icon: "check",
    });
  return insights.slice(0, 3);
}

export function getTrainingPlan(
  level: Level,
  goalDistance: GoalDistance,
  daysPerWeek: 2 | 3 | 4 = 3,
): Plan {
  const raw = catalog.plans.find(
    (p) => p.level === level && p.goalDistance === goalDistance,
  );
  if (!raw || ![2, 3, 4].includes(daysPerWeek))
    throw new RangeError("Unsupported training plan");
  const workouts = catalog.workouts as Record<string, Omit<Workout, "id">>;
  return {
    ...raw,
    level,
    goalDistance,
    daysPerWeek,
    weeks: raw.weeks.map((ids, week) => ({
      number: week + 1,
      days: ids.map((id, day) => {
        const chosen =
          daysPerWeek === 2 && day === 3
            ? "rest"
            : daysPerWeek === 4 && day === 5
              ? "e2"
              : id;
        return { ...workouts[chosen], id: `${raw.id}-${week}-${day}` };
      }),
    })),
  };
}
export function getPostRunSummary(run: Run) {
  if (!valid(run))
    return {
      headline: "Every beginning counts",
      body: "Save a completed run to see its distance and pace.",
      highlight: "A fresh start is waiting.",
      tip: "Start gently and take walk breaks as needed.",
    };
  const seconds = (run.durationMin * 60) / run.distanceKm;
  const diff =
    run.averagePaceSeconds && finitePositive(run.averagePaceSeconds)
      ? Math.round(run.averagePaceSeconds - seconds)
      : null;
  const comparison =
    diff === null
      ? "This run can become a useful baseline."
      : Math.abs(diff) < 1
        ? "Right on your recent average pace."
        : `${Math.abs(diff)} sec/km ${diff > 0 ? "faster" : "slower"} than your recent average.`;
  const halves = halfPaces(run);
  return {
    headline: `${round(run.distanceKm)} km, in your own rhythm`,
    body: `${round(run.durationMin)} minutes at ${pace(seconds)}/km. ${comparison}`,
    highlight:
      halves && halves[1] < halves[0]
        ? `Your second half was ${Math.round(halves[0] - halves[1])} sec/km faster.`
        : `You covered ${round(run.distanceKm)} km — that is time made for movement.`,
    tip:
      halves && halves[1] > halves[0] * 1.08
        ? "Start your next run 10 seconds per km slower and settle into an easy effort."
        : run.distanceKm >= 10
          ? "Give yourself time to recover before your next demanding session."
          : "Keep your next easy run conversational; walk breaks are welcome.",
  };
}
