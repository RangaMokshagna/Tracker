import React, { useState } from "react";
import { Modal, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { GlassSurface, Text } from "../../components/ui";
import { NaturalButton } from "../../components/ui/NaturalButton";
import { NaturalScene } from "../../components/ui/GlassSurface";
import { LiquidBackdrop } from "../../components/ui/LiquidBackdrop";
import { useTheme } from "../../theme/tokens";
import { useReducedMotion } from "react-native-reanimated";
import { getTrainingPlan } from "./coachEngine";
import type { ActivePlan } from "./coachStore";
import type { GoalDistance, Level } from "./types";

export function PlanSheet({
  visible,
  current,
  onClose,
  onChoose,
}: {
  visible: boolean;
  current?: ActivePlan;
  onClose: () => void;
  onChoose: (level: Level, goal: GoalDistance, days: 2 | 3 | 4) => void;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [level, setLevel] = useState<Level>(current?.level || "beginner");
  const [goal, setGoal] = useState<GoalDistance>(current?.goal || 5);
  const [days, setDays] = useState<2 | 3 | 4>(current?.days || 3);
  const plan = getTrainingPlan(level, goal, days);
  const chips = <T extends string | number>(
    options: readonly T[],
    selected: T,
    change: (value: T) => void,
    label: (value: T) => string,
  ) => (
    <View accessibilityRole="radiogroup" style={s.chips}>
      {options.map((option) => (
        <NaturalButton
          key={option}
          accessibilityRole="radio"
          accessibilityState={{ checked: option === selected }}
          accessibilityLabel={label(option)}
          onPress={() => change(option)}
          style={[
            s.chip,
            {
              backgroundColor:
                selected === option ? colors.primary : colors.glass,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          <Text
            style={{
              fontSize: 13,
              color: selected === option ? colors.textOnPrimary : colors.text,
            }}
          >
            {label(option)}
          </Text>
        </NaturalButton>
      ))}
    </View>
  );
  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduced ? "fade" : "slide"}
      onRequestClose={onClose}
    >
      <View style={s.scrim}>
        <NaturalScene>
          <SafeAreaView
            style={[s.sheet, { backgroundColor: colors.background }]}
            edges={["bottom"]}
            accessibilityViewIsModal
          >
            <LiquidBackdrop />
            <ScrollView contentContainerStyle={{ padding: 24 }}>
              <View style={s.title}>
                <Text variant="h1">Choose your rhythm.</Text>
                <NaturalButton
                  accessibilityLabel="Close plan selector"
                  onPress={onClose}
                  style={s.close}
                >
                  <X color={colors.text} size={20} />
                </NaturalButton>
              </View>
              <Text style={s.label}>LEVEL</Text>
              {chips(
                ["beginner", "intermediate"] as const,
                level,
                setLevel,
                (x) => (x === "beginner" ? "Beginner" : "Intermediate"),
              )}
              <Text style={s.label}>YOUR DISTANCE</Text>
              {chips([5, 10, 21] as const, goal, setGoal, (x) => `${x}K`)}
              <Text style={s.label}>RUNNING DAYS PER WEEK</Text>
              {chips([2, 3, 4] as const, days, setDays, (x) => `${x} days`)}
              <GlassSurface style={{ padding: 20, marginTop: 24 }}>
                <Text style={{ fontSize: 17, fontWeight: "600" }}>
                  {plan.title}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    marginTop: 8,
                    lineHeight: 21,
                  }}
                >
                  {plan.weeks.length} weeks · {days} running days per week.{" "}
                  {plan.prerequisite}
                </Text>
              </GlassSurface>
              <Text
                style={{
                  fontSize: 11,
                  lineHeight: 18,
                  color: colors.textSecondary,
                  marginVertical: 20,
                }}
              >
                Times and distances are guides. Repeat weeks when needed.
                Choosing a plan restarts its check-offs; your saved runs stay in
                History.
              </Text>
              <NaturalButton
                onPress={() => onChoose(level, goal, days)}
                accessibilityLabel={`Start ${plan.weeks.length} week ${goal}K plan`}
                style={[s.primary, { backgroundColor: colors.primary }]}
              >
                <Text
                  style={{ color: colors.textOnPrimary, fontWeight: "600" }}
                >
                  Use this plan
                </Text>
              </NaturalButton>
            </ScrollView>
          </SafeAreaView>
        </NaturalScene>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(39,38,32,0.28)",
  },
  sheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  title: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  close: { width: 44, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 11, letterSpacing: 0.6, marginTop: 24, marginBottom: 12 },
  chips: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  primary: {
    minHeight: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
