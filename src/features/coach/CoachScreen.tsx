import React, { useCallback, useState } from "react";
import {
  AppState,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Flame,
  Footprints,
  MessageCircle,
} from "lucide-react-native";
import { GlassSurface, Skeleton, Text } from "../../components/ui";
import { LiquidBackdrop } from "../../components/ui/LiquidBackdrop";
import { NaturalButton } from "../../components/ui/NaturalButton";
import { AnimatedNumber } from "../../components/ui/AnimatedNumber";
import { useTheme } from "../../theme/tokens";
import { natural } from "../../theme/natural";
import { useAuthStore } from "../../store/auth";
import { useGoalsStore } from "../../store/goals";
import { useRunStore } from "../../store/run";
import { RunStatus } from "../../types/run";
import { SlideButton } from "../run/components/StartRunFlow";
import {
  dayNumber,
  getInsights,
  getTrainingPlan,
  getWeekProgress,
} from "./coachEngine";
import { loadCoachHistory } from "./loadHistory";
import { useCoachStore } from "./coachStore";
import { InsightCard } from "./InsightCard";
import { PlanSheet } from "./PlanSheet";
import { ENABLE_ASK_COACH } from "./config";
import type { Run, Workout } from "./types";

function WorkoutRow({
  workout,
  day,
  checked,
  disabled,
  onCheck,
}: {
  workout: Workout;
  day: string;
  checked: boolean;
  disabled: boolean;
  onCheck: () => void;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const motion = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <NaturalButton
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={`${day}, ${workout.title}. ${workout.instruction}`}
      disabled={disabled}
      onPress={() => {
        scale.set(
          reduced
            ? 1
            : withSpring(1.15, { ...natural.motion.spring, damping: 12 }, () =>
                scale.set(withSpring(1)),
              ),
        );
        onCheck();
      }}
      style={[
        s.workoutRow,
        { borderColor: colors.border, opacity: disabled ? 0.6 : 1 },
      ]}
    >
      <Animated.View
        style={[
          s.check,
          {
            backgroundColor: checked ? colors.primary : colors.glass,
            borderColor: colors.glassBorder,
          },
          motion,
        ]}
      >
        {checked ? (
          <Check size={16} color={colors.textOnPrimary} />
        ) : (
          <Footprints size={14} color={colors.textSecondary} />
        )}
      </Animated.View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "500" }}>{workout.title}</Text>
        <Text
          style={{ fontSize: 11, lineHeight: 17, color: colors.textSecondary }}
        >
          {day} ·{" "}
          {workout.kind === "rest"
            ? "Recovery"
            : `${workout.distanceKm} km · about ${workout.durationMin} min`}
        </Text>
      </View>
    </NaturalButton>
  );
}
export default function CoachScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const profile = useAuthStore((state) => state.profile);
  const account = useAuthStore((state) => state.userId) || profile.id;
  const goalMeters = useGoalsStore((state) => state.weeklyGoalMeters);
  const active = useCoachStore((state) => state.accounts[account]);
  const [history, setHistory] = useState<Run[]>([]);
  const [clock, setClock] = useState(() => new Date().toISOString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const refresh = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      setHistory(await loadCoachHistory(account));
      setClock(new Date().toISOString());
    } catch {
      setError(
        "Saved runs could not be loaded. Pull down to retry; your plan is still available offline.",
      );
    } finally {
      setLoading(false);
    }
  }, [account]);
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void loadCoachHistory(account)
        .then((runs) => {
          if (alive) {
            setHistory(runs);
            setError("");
          }
        })
        .catch(() => {
          if (alive)
            setError("Saved runs could not be loaded. Pull down to retry.");
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
      const update = () => setClock(new Date().toISOString());
      update();
      const timer = setInterval(update, 60000);
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") update();
      });
      return () => {
        alive = false;
        clearInterval(timer);
        subscription.remove();
      };
    }, [account]),
  );
  const coachProfile = {
    referenceDate: clock,
    timeZone: profile.timezone,
    weightKg: profile.weightKg || 70,
    weeklyGoalKm: goalMeters / 1000,
    daysPerWeek: active?.days || 3,
  };
  const week = getWeekProgress(history, coachProfile);
  const plan = active
    ? getTrainingPlan(active.level, active.goal, active.days)
    : null;
  const elapsed = active
    ? week.today - dayNumber(`${active.startDate}T12:00:00Z`)
    : 0;
  const workout =
    plan && elapsed >= 0
      ? plan.weeks[Math.floor(elapsed / 7)]?.days[elapsed % 7]
      : undefined;
  const insights = getInsights(history, coachProfile).filter(
    (insight) =>
      !active?.dismissed.includes(insight.id) &&
      !dismissed.includes(insight.id),
  );
  const best = Math.max(...week.days.map((day) => day.distanceKm));
  const goal = Math.max(0, coachProfile.weeklyGoalKm),
    progress = goal > 0 ? Math.min(1, week.distanceKm / goal) : 0;
  const start = () => {
    if (!workout || workout.kind === "rest") return;
    const status = useRunStore.getState().status;
    if (
      [RunStatus.Active, RunStatus.Paused, RunStatus.Countdown].includes(status)
    ) {
      router.push("/(tabs)/run");
      return;
    }
    useRunStore.setState({
      runType: "distance",
      targetValue: workout.distanceKm * 1000,
      targetTimeMinutes: workout.durationMin,
      plannedMode: "outdoor",
    });
    useRunStore.getState().startCountdown();
    router.push("/(tabs)/run");
  };
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "left", "right"]}
    >
      <LiquidBackdrop />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && history.length > 0}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={s.content}
      >
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.eyebrow}>YOUR OFFLINE COACH</Text>
            <Text variant="h1" style={{ fontSize: 34, lineHeight: 39 }}>
              Find your rhythm.
            </Text>
          </View>
          <View style={[s.streak, { backgroundColor: natural.color.sandTint }]}>
            <Flame size={16} color={natural.color.ink} />
            <Text style={{ fontSize: 12, color: natural.color.ink }}>
              {week.streak} days
            </Text>
          </View>
        </View>
        <Text
          style={{
            fontSize: 13,
            color: colors.textSecondary,
            marginTop: 8,
            marginBottom: 24,
          }}
        >
          A little guidance. A little further. Always yours.
        </Text>
        {!!error && (
          <Text
            accessibilityRole="alert"
            style={{
              color: colors.error,
              fontSize: 13,
              lineHeight: 20,
              marginBottom: 16,
            }}
          >
            {error}
          </Text>
        )}
        <GlassSurface style={s.hero}>
          <View style={s.between}>
            <Text style={s.eyebrow}>TODAY’S WORKOUT</Text>
            <NaturalButton
              onPress={() => setSheet(true)}
              accessibilityLabel="Choose or change training plan"
              style={s.planButton}
            >
              <Text style={{ fontSize: 11, color: colors.primary }}>
                {active ? `${active.goal}K plan` : "Choose a plan"}
              </Text>
              <ChevronDown size={14} color={colors.primary} />
            </NaturalButton>
          </View>
          <Text
            variant="h1"
            style={{ fontSize: 32, lineHeight: 38, marginTop: 12 }}
          >
            {workout?.title ||
              (plan ? "A chapter completed." : "Small steps. Real progress.")}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13,
              lineHeight: 21,
              marginTop: 12,
              marginBottom: 20,
            }}
          >
            {workout?.instruction ||
              (plan
                ? "Your plan is complete. Choose a new plan, repeat a block, or enjoy a recovery week."
                : "Choose a free 5K, 10K or half-marathon plan. Every workout and rest day is saved on your phone.")}
          </Text>
          {workout && workout.kind !== "rest" ? (
            <>
              <View style={s.heroNumbers}>
                <AnimatedNumber value={workout.distanceKm} size={40} />
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  km · about {workout.durationMin} min
                </Text>
              </View>
              <SlideButton label="Start workout" onComplete={start} />
            </>
          ) : (
            <NaturalButton
              accessibilityLabel="Choose training plan"
              onPress={() => setSheet(true)}
              style={[s.primary, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: colors.textOnPrimary, fontWeight: "600" }}>
                {workout ? "View your plan" : "Choose a plan"}
              </Text>
              <ArrowUpRight size={18} color={colors.textOnPrimary} />
            </NaturalButton>
          )}
          {workout && (
            <WorkoutRow
              workout={workout}
              day="Today"
              checked={!!active?.completed.includes(workout.id)}
              disabled={false}
              onCheck={() =>
                useCoachStore.getState().check(account, workout.id)
              }
            />
          )}
        </GlassSurface>
        {loading && !history.length ? (
          <Skeleton.Card height={170} />
        ) : !history.length && !error ? (
          <GlassSurface style={s.empty}>
            <Image
              source={require("../../../assets/natural-achievements.png")}
              style={{ width: 94, height: 80, opacity: 0.8 }}
              resizeMode="contain"
              accessible={false}
            />
            <Text variant="h2" style={{ marginTop: 8 }}>
              Your story starts here.
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 20,
                marginTop: 8,
              }}
            >
              Save your first run to unlock insights from your own distance,
              splits and recovery pattern.
            </Text>
            <NaturalButton
              onPress={() => router.push("/(tabs)/run")}
              accessibilityLabel="Do your first run"
              style={[
                s.primary,
                {
                  backgroundColor: colors.primary,
                  alignSelf: "stretch",
                  marginTop: 20,
                },
              ]}
            >
              <Text style={{ color: colors.textOnPrimary }}>
                Do your first run
              </Text>
            </NaturalButton>
          </GlassSurface>
        ) : null}
        {!!insights.length && (
          <View style={{ marginTop: 24 }}>
            <Text style={[s.eyebrow, { marginBottom: 16 }]}>
              A LITTLE PERSPECTIVE
            </Text>
            {insights.map((insight, index) => (
              <InsightCard
                key={`${account}-${insight.id}`}
                insight={insight}
                index={index}
                onDismiss={() => {
                  if (active)
                    useCoachStore.getState().dismiss(account, insight.id);
                  else setDismissed((items) => [...items, insight.id]);
                }}
              />
            ))}
          </View>
        )}
        <GlassSurface style={s.week}>
          <View style={s.between}>
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>THIS WEEK</Text>
              <View style={s.heroNumbers}>
                <AnimatedNumber value={week.distanceKm.toFixed(1)} size={36} />
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {" "}
                  / {goal} km
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                A rhythm worth keeping.
              </Text>
            </View>
            <View
              accessible
              accessibilityLabel={`${Math.round(progress * 100)} percent of weekly goal`}
              style={{ width: 88, height: 88 }}
            >
              <Svg width="88" height="88" viewBox="0 0 88 88">
                <Circle
                  cx="44"
                  cy="44"
                  r="36"
                  stroke={colors.border}
                  strokeWidth="6"
                  fill="none"
                />
                <Circle
                  cx="44"
                  cy="44"
                  r="36"
                  stroke={natural.color.sky}
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${progress * 226.2} 226.2`}
                  rotation="-90"
                  origin="44,44"
                />
              </Svg>
              <View style={s.ringLabel}>
                <Text style={{ fontSize: 15 }}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
            </View>
          </View>
          <View style={s.bars}>
            {week.days.map((day, i) => (
              <View
                key={i}
                accessible
                accessibilityLabel={`${["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][i]}: ${day.distanceKm} kilometers`}
                style={s.barColumn}
              >
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  {day.distanceKm || "—"}
                </Text>
                <View
                  style={{
                    height: 64,
                    width: 20,
                    justifyContent: "flex-end",
                    marginTop: 8,
                  }}
                >
                  <View
                    style={{
                      height: best
                        ? Math.max(3, (day.distanceKm / best) * 64)
                        : 3,
                      borderRadius: 8,
                      backgroundColor:
                        day.distanceKm === best && best > 0
                          ? natural.color.sand
                          : natural.color.skyTint,
                    }}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.textSecondary,
                    marginTop: 8,
                  }}
                >
                  {day.day}
                </Text>
              </View>
            ))}
          </View>
        </GlassSurface>
        {plan && active && (
          <View style={{ marginTop: 24 }}>
            <Text variant="h2">Your path, week by week.</Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                marginTop: 8,
                marginBottom: 16,
              }}
            >
              {plan.prerequisite}
            </Text>
            {plan.weeks.map((weekPlan, i) => (
              <GlassSurface
                key={`${plan.id}-${i}`}
                style={{ padding: 20, marginBottom: 16 }}
              >
                <Text
                  style={{ fontSize: 17, fontWeight: "600", marginBottom: 8 }}
                >
                  Week {weekPlan.number}
                  {Math.floor(elapsed / 7) === i ? " · You are here" : ""}
                </Text>
                {weekPlan.days.map((day, d) => {
                  const n = i * 7 + d;
                  const date = new Date(
                    Date.parse(`${active.startDate}T00:00:00Z`) + n * 86400000,
                  )
                    .toISOString()
                    .slice(0, 10);
                  return (
                    <WorkoutRow
                      key={day.id}
                      workout={day}
                      day={date}
                      checked={active.completed.includes(day.id)}
                      disabled={n > elapsed}
                      onCheck={() =>
                        useCoachStore.getState().check(account, day.id)
                      }
                    />
                  );
                })}
              </GlassSurface>
            ))}
          </View>
        )}
        {ENABLE_ASK_COACH && (
          <GlassSurface style={{ padding: 20, marginTop: 24 }}>
            <MessageCircle size={22} color={colors.primary} />
            <Text variant="h2" style={{ marginTop: 12 }}>
              A question on your mind?
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                marginVertical: 12,
              }}
            >
              Ask about pace, recovery or your next goal. Local answers are
              always available.
            </Text>
            <NaturalButton
              onPress={() => router.push("/coach-chat")}
              style={s.planButton}
              accessibilityLabel="Open Ask Coach"
            >
              <Text style={{ color: colors.primary }}>Ask Coach</Text>
              <ArrowUpRight color={colors.primary} size={17} />
            </NaturalButton>
          </GlassSurface>
        )}
        <Text
          style={{
            fontSize: 11,
            color: colors.textSecondary,
            lineHeight: 18,
            marginTop: 24,
          }}
        >
          Training tips are general guidance, not medical advice. Plans are
          templates, not personalized prescriptions. For pain or injury, consult
          a doctor.
        </Text>
        {sheet && (
          <PlanSheet
            visible
            current={active}
            onClose={() => setSheet(false)}
            onChoose={(level, goalDistance, days) => {
              const monday = new Date(week.monday * 86400000)
                .toISOString()
                .slice(0, 10);
              useCoachStore
                .getState()
                .choose(account, {
                  level,
                  goal: goalDistance,
                  days,
                  startDate: monday,
                });
              setSheet(false);
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  content: { padding: 20, paddingBottom: 132 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  eyebrow: { fontSize: 11, letterSpacing: 0.66, fontWeight: "500" },
  streak: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    padding: 10,
    gap: 5,
  },
  hero: { padding: 20, marginBottom: 24 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  planButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  primary: {
    minHeight: 52,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  heroNumbers: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginVertical: 12,
  },
  empty: { padding: 24, alignItems: "center" },
  week: { padding: 20, marginTop: 24 },
  bars: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 8,
  },
  barColumn: { alignItems: "center", flex: 1 },
  ringLabel: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  workoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
