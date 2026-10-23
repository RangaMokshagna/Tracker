import { describe, expect, it } from "@jest/globals";
import {
  benchmark,
  dayKey,
  estimateCalories,
  getInsights,
  getPostRunSummary,
  getTrainingPlan,
  getWeekProgress,
  offlineAnswer,
} from "../src/features/coach/coachEngine";
import type { Profile, Run } from "../src/features/coach/types";

const profile: Profile = {
  referenceDate: "2026-10-23T12:00:00Z",
  timeZone: "UTC",
  weeklyGoalKm: 12,
  daysPerWeek: 3,
};
const run = (id: string, date: string, km = 5, min = 30): Run => ({
  id,
  startedAt: `${date}T07:00:00Z`,
  distanceKm: km,
  durationMin: min,
});
const ids = (runs: Run[], p = profile) =>
  getInsights(runs, p).map((i) => i.id.split("-")[0]);

describe("coach calories", () => {
  it("uses the gross MET formula and rounds to one kcal", () => {
    expect(
      estimateCalories({
        weightKg: 70,
        distanceKm: 5,
        durationMin: 30,
        mode: "outdoor",
      }),
    ).toBe(360);
  });
  it("adjusts trail up 8% and treadmill down 3%", () => {
    expect(
      estimateCalories({
        weightKg: 70,
        distanceKm: 5,
        durationMin: 30,
        mode: "trail",
      }),
    ).toBe(389);
    expect(
      estimateCalories({
        weightKg: 70,
        distanceKm: 5,
        durationMin: 30,
        mode: "treadmill",
      }),
    ).toBe(349);
  });
  it.each([0, -1, NaN, Infinity])("rejects invalid input %s", (n) => {
    for (const key of ["weightKg", "distanceKm", "durationMin"])
      expect(
        estimateCalories({
          weightKg: 70,
          distanceKm: 5,
          durationMin: 30,
          [key]: n,
        }),
      ).toBe(0);
  });
  it("selects the band at its lower speed boundary", () => {
    expect(
      estimateCalories({ weightKg: 60, distanceKm: 8, durationMin: 60 }),
    ).toBe(523);
    expect(
      estimateCalories({ weightKg: 60, distanceKm: 7.999, durationMin: 60 }),
    ).toBe(378);
  });
});
describe("prioritized local insights", () => {
  it("detects >8% slower distance-weighted second half with real paces", () => {
    const latest = {
      ...run("fade", "2026-10-23", 4, 23),
      splits: [
        { distanceKm: 1, durationMin: 5 },
        { distanceKm: 3, durationMin: 18 },
      ],
    };
    const insight = getInsights([latest], profile)[0];
    expect(insight.title).toBe("Start 10 seconds per km slower.");
    expect(insight.body).toContain("5:30/km");
    expect(insight.body).toContain("6:00/km");
    expect(insight.body).toContain("5:40/km");
  });
  it("does not invent split behavior when splits are missing or incomplete", () => {
    expect(ids([run("no-splits", "2026-10-23")])).not.toContain("pace");
    expect(
      ids([
        {
          ...run("partial", "2026-10-23"),
          splits: [
            { distanceKm: 1, durationMin: 5 },
            { distanceKm: 1, durationMin: 10 },
          ],
        },
      ]),
    ).not.toContain("pace");
  });
  it("does not trigger at exactly 8%", () => {
    expect(
      ids([
        {
          ...run("edge", "2026-10-23", 2, 10.4),
          splits: [
            { distanceKm: 1, durationMin: 5 },
            { distanceKm: 1, durationMin: 5.4 },
          ],
        },
      ]),
    ).not.toContain("pace");
  });
  it("counts consecutive dates rather than multiple runs on one day", () => {
    expect(
      ids([
        run("a", "2026-10-21"),
        run("b", "2026-10-22"),
        run("c", "2026-10-23"),
      ]),
    ).toContain("rest");
    expect(
      ids([
        run("a", "2026-10-23"),
        run("b", "2026-10-23"),
        run("c", "2026-10-23"),
      ]),
    ).not.toContain("rest");
  });
  it("continues yesterday’s streak and breaks it after a missed day", () => {
    const runs = [
      run("a", "2026-10-20"),
      run("b", "2026-10-21"),
      run("c", "2026-10-22"),
    ];
    expect(ids(runs)).toContain("rest");
    expect(
      ids(runs, { ...profile, referenceDate: "2026-10-24T12:00:00Z" }),
    ).not.toContain("rest");
  });
  it("warns only above 10% and not against a zero baseline", () => {
    expect(
      ids([run("prior", "2026-10-13", 10), run("now", "2026-10-22", 11.01)]),
    ).toContain("volume");
    expect(
      ids([run("prior", "2026-10-13", 10), run("now", "2026-10-22", 11)]),
    ).not.toContain("volume");
    expect(ids([run("now", "2026-10-22", 20)])).not.toContain("volume");
  });
  it.each([1, 5, 10])(
    "celebrates a genuine recorded %iK improvement",
    (distance) => {
      const insights = getInsights(
        [
          run("old", "2026-10-13", distance, distance * 6),
          run("new", "2026-10-23", distance, distance * 5),
        ],
        profile,
      );
      expect(insights.find((i) => i.id === "pb-new")?.body).toContain(
        `${distance * 60} seconds faster`,
      );
    },
  );
  it("never extrapolates a longer record and ignores equal/slower records", () => {
    expect(benchmark(run("x", "2026-10-23", 3, 12), 5)).toBeNull();
    expect(
      ids([run("old", "2026-10-10"), run("new", "2026-10-23")]),
    ).not.toContain("pb");
    expect(ids([run("new", "2026-10-23")])).not.toContain("pb");
  });
  it("uses contiguous splits for benchmark segments", () => {
    const candidate = {
      ...run("split", "2026-10-23", 6, 33),
      splits: [6, 5, 5, 5, 6, 6].map((durationMin) => ({
        distanceKm: 1,
        durationMin,
      })),
    };
    expect(benchmark(candidate, 1)).toBe(300);
    expect(benchmark(candidate, 5)).toBe(1620);
  });
  it("offers a gentle 2K after a gap, without punishing a single rest day", () => {
    expect(
      getInsights([run("last", "2026-10-20", 4)], profile)[0].body,
    ).toContain("3 days");
    expect(
      getInsights([run("last", "2026-10-20", 4)], profile)[0].body,
    ).toContain("2K");
    expect(ids([run("last", "2026-10-22")])).not.toContain("nudge");
  });
  it("praises an actual completed consistent week with a numeric 5% target", () => {
    const runs = [
      run("a", "2026-10-12", 4),
      run("b", "2026-10-14", 4),
      run("c", "2026-10-16", 4),
      run("today", "2026-10-23", 2),
    ];
    expect(
      getInsights(runs, profile).find((i) => i.id.startsWith("consistent"))
        ?.body,
    ).toContain("12.6 km");
    expect(ids(runs, { ...profile, weeklyGoalKm: 20 })).not.toContain(
      "consistent",
    );
  });
  it("prioritizes volume, recovery and pace before praise; caps at three", () => {
    const runs = [
      run("old", "2026-10-15", 1, 6),
      run("a", "2026-10-21"),
      run("b", "2026-10-22"),
      {
        ...run("c", "2026-10-23", 2, 11),
        splits: [
          { distanceKm: 1, durationMin: 5 },
          { distanceKm: 1, durationMin: 6 },
        ],
      },
    ];
    expect(ids(runs)).toEqual(["volume", "rest", "pace"]);
  });
  it("handles empty/invalid/future runs and leaves inputs untouched", () => {
    expect(getInsights([], profile)).toEqual([]);
    expect(
      getInsights(
        [
          run("future", "2026-10-24"),
          { ...run("bad", "2026-10-22"), distanceKm: NaN },
        ],
        profile,
      ),
    ).toEqual([]);
    const runs = Object.freeze([Object.freeze(run("x", "2026-10-22"))]);
    expect(() => getInsights(runs, profile)).not.toThrow();
  });
  it("uses local calendar days across time zones and DST boundaries", () => {
    expect(dayKey("2026-10-23T20:00:00Z", "Asia/Kolkata")).toBe("2026-10-24");
    const p = {
      ...profile,
      referenceDate: "2026-11-02T12:00:00Z",
      timeZone: "America/New_York",
    };
    expect(
      getWeekProgress(
        [
          run("sat", "2026-10-31"),
          run("sun", "2026-11-01"),
          run("mon", "2026-11-02"),
        ],
        p,
      ).streak,
    ).toBe(3);
  });
});
describe("bundled plans and summaries", () => {
  it.each(["beginner", "intermediate"] as const)(
    "ships complete 4–8 week %s plans for all goals",
    (level) => {
      for (const distance of [5, 10, 21] as const)
        for (const days of [2, 3, 4] as const) {
          const plan = getTrainingPlan(level, distance, days);
          expect(plan.weeks.length).toBeGreaterThanOrEqual(4);
          expect(plan.weeks.length).toBeLessThanOrEqual(8);
          for (const week of plan.weeks) {
            expect(week.days).toHaveLength(7);
            expect(week.days.filter((day) => day.kind !== "rest")).toHaveLength(
              days,
            );
            expect(week.days.every((day) => day.instruction && day.id)).toBe(
              true,
            );
          }
        }
    },
  );
  it("returns independent plans without mutating the JSON catalog", () => {
    const first = getTrainingPlan("beginner", 5);
    first.weeks[0].days[0].title = "changed";
    expect(getTrainingPlan("beginner", 5).weeks[0].days[0].title).toBe(
      "Rest & reset",
    );
  });
  it("builds a real post-run comparison and never invents negative splits", () => {
    const summary = getPostRunSummary({
      ...run("x", "2026-10-23", 5, 25),
      averagePaceSeconds: 320,
    });
    expect(summary.body).toContain("5:00/km");
    expect(summary.body).toContain("20 sec/km faster");
    expect(summary.highlight).not.toContain("second half");
    expect(
      getPostRunSummary({ ...run("zero", "2026-10-23"), durationMin: 0 }).body,
    ).toContain("completed run");
  });
  it("answers pace/rest/calories/plan/pain locally with bounded running guidance", () => {
    const ctx = { weeklyDistanceKm: 12, averagePaceSeconds: 360, goal: "10K" };
    for (const q of [
      "pace",
      "rest",
      "calories",
      "plan for 10K",
      "knee pain",
      "write code",
    ])
      expect(offlineAnswer(q, ctx).split(/\s+/).length).toBeLessThanOrEqual(
        120,
      );
    expect(offlineAnswer("knee pain", ctx)).toContain("doctor");
    expect(offlineAnswer("pace", ctx)).toContain("6:00/km");
  });
});
