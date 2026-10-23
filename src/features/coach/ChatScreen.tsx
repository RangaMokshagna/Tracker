import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Send } from "lucide-react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { GlassSurface, Text } from "../../components/ui";
import { NaturalButton } from "../../components/ui/NaturalButton";
import { NaturalScene } from "../../components/ui/GlassSurface";
import { LiquidBackdrop } from "../../components/ui/LiquidBackdrop";
import { useTheme } from "../../theme/tokens";
import { natural } from "../../theme/natural";
import { useAuthStore } from "../../store/auth";
import { useCoachStore } from "./coachStore";
import { loadCoachHistory } from "./loadHistory";
import { getWeekProgress } from "./coachEngine";
import { ENABLE_ASK_COACH } from "./config";
import { getMessagesLeft, sendCoachQuestion } from "./chatClient";
import type { ChatReply, CoachContext } from "./types";

function Dot({ index }: { index: number }) {
  const { colors } = useTheme(),
    reduced = useReducedMotion(),
    value = useSharedValue(0);
  useEffect(() => {
    if (!reduced)
      value.set(
        withDelay(
          index * 120,
          withRepeat(withTiming(1, { duration: 450 }), -1, true),
        ),
      );
    return () => cancelAnimation(value);
  }, [index, reduced, value]);
  const style = useAnimatedStyle(() => ({
    opacity: reduced ? 0.6 : 0.35 + value.value * 0.65,
    transform: [{ translateY: reduced ? 0 : -value.value * 3 }],
  }));
  return (
    <Animated.View
      style={[
        {
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: colors.primary,
        },
        style,
      ]}
    />
  );
}
type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  source?: ChatReply["source"];
  cached?: boolean;
};
function EnabledChat() {
  const { colors } = useTheme(),
    router = useRouter();
  const profile = useAuthStore((state) => state.profile),
    userId = useAuthStore((state) => state.userId);
  const account = userId || profile.id;
  const plan = useCoachStore((state) => state.accounts[account]);
  const [context, setContext] = useState<CoachContext>({
    weeklyDistanceKm: 0,
    averagePaceSeconds: null,
    goal: plan ? `${plan.goal}K` : "Build consistency",
  });
  const [contextReady, setContextReady] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      text: "A little support for your next run. Ask about pace, rest, fueling or a training plan.",
      source: "offline",
    },
  ]);
  const [input, setInput] = useState(""),
    [busy, setBusy] = useState(false);
  const serial = useRef(0),
    scroll = useRef<React.ComponentRef<typeof ScrollView>>(null),
    active = useRef<AbortController | null>(null),
    locked = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    void loadCoachHistory(account)
      .then((history) => {
        if (controller.signal.aborted) return;
        const weekly = getWeekProgress(history, {
          referenceDate: new Date().toISOString(),
          timeZone: profile.timezone,
          weeklyGoalKm: 0,
          daysPerWeek: 3,
        });
        const km = history.reduce((sum, run) => sum + run.distanceKm, 0),
          minutes = history.reduce((sum, run) => sum + run.durationMin, 0);
        setContext({
          weeklyDistanceKm: Math.round(weekly.distanceKm * 10) / 10,
          averagePaceSeconds: km ? Math.round((minutes * 60) / km) : null,
          goal: plan ? `${plan.goal}K` : "Build consistency",
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setContextReady(true);
      });
    void getMessagesLeft(controller.signal).then((left) => {
      if (!controller.signal.aborted) setRemaining(left);
    });
    return () => {
      controller.abort();
      active.current?.abort();
    };
  }, [account, profile.timezone, plan]);
  const send = async (suggestion?: string) => {
    const question = (suggestion || input).trim();
    if (!question || locked.current || !contextReady) return;
    locked.current = true;
    setBusy(true);
    setInput("");
    const user = ++serial.current,
      assistant = ++serial.current;
    setMessages((items) => [
      ...items,
      { id: user, role: "user", text: question },
      { id: assistant, role: "assistant", text: "" },
    ]);
    const controller = new AbortController();
    active.current = controller;
    try {
      const result = await sendCoachQuestion(
        question,
        context,
        (text) => {
          if (!controller.signal.aborted)
            setMessages((items) =>
              items.map((item) =>
                item.id === assistant ? { ...item, text } : item,
              ),
            );
        },
        controller.signal,
      );
      if (!controller.signal.aborted) {
        setMessages((items) =>
          items.map((item) =>
            item.id === assistant
              ? {
                  ...item,
                  text: result.text,
                  source: result.source,
                  cached: result.cached,
                }
              : item,
          ),
        );
        setRemaining(result.remaining);
      }
    } finally {
      locked.current = false;
      if (!controller.signal.aborted) setBusy(false);
    }
  };
  return (
    <NaturalScene>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <LiquidBackdrop />
        <View style={s.header}>
          <NaturalButton
            accessibilityLabel="Back to Coach"
            onPress={() => router.back()}
            style={s.circle}
          >
            <ArrowLeft color={colors.text} size={20} />
          </NaturalButton>
          <View style={{ flex: 1 }}>
            <Text variant="h1" style={{ fontSize: 28 }}>
              Ask Coach.
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary }}>
              {remaining === null
                ? "Offline coach · no daily limit"
                : `Messages left today: ${remaining}`}
            </Text>
          </View>
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            ref={scroll}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              scroll.current?.scrollToEnd({ animated: false })
            }
            contentContainerStyle={s.messages}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={{
                  alignSelf:
                    message.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "94%",
                  minWidth: 68,
                  marginBottom: 12,
                }}
              >
                <GlassSurface
                  style={{
                    padding: 16,
                    borderRadius: 24,
                    backgroundColor:
                      message.role === "user"
                        ? colors.primaryMuted
                        : colors.glass,
                  }}
                >
                  {message.text ? (
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 15,
                        lineHeight: 23,
                      }}
                    >
                      {message.text}
                    </Text>
                  ) : (
                    <View
                      accessibilityLabel="Coach is typing"
                      accessibilityRole="progressbar"
                      style={{ flexDirection: "row", gap: 6, padding: 8 }}
                    >
                      {[0, 1, 2].map((index) => (
                        <Dot key={index} index={index} />
                      ))}
                    </View>
                  )}
                </GlassSurface>
                {message.source && (
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.textSecondary,
                      marginTop: 5,
                      marginLeft: 8,
                    }}
                  >
                    {message.source === "offline"
                      ? "Offline coach answer"
                      : message.cached
                        ? "Gemini · saved answer"
                        : "Gemini · general guidance"}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
          <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
            >
              {[
                "How do I improve my pace?",
                "Should I run today?",
                "Plan for a 10K",
              ].map((question) => (
                <NaturalButton
                  key={question}
                  onPress={() => void send(question)}
                  disabled={busy || !contextReady}
                  style={[
                    s.chip,
                    {
                      backgroundColor: colors.glass,
                      borderColor: colors.glassBorder,
                    },
                  ]}
                  accessibilityLabel={question}
                >
                  <Text style={{ fontSize: 12 }}>{question}</Text>
                </NaturalButton>
              ))}
            </ScrollView>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 11,
                lineHeight: 17,
                marginBottom: 10,
              }}
            >
              AI tips are general guidance, not medical advice.
            </Text>
            <View
              style={[
                s.inputRow,
                {
                  backgroundColor: colors.glass,
                  borderColor: colors.glassBorder,
                },
              ]}
            >
              <TextInput
                accessibilityLabel="Ask a running question"
                placeholder="Ask about your next run…"
                placeholderTextColor={colors.textSecondary}
                value={input}
                onChangeText={setInput}
                maxLength={1000}
                multiline
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontFamily: natural.font.ui,
                  color: colors.text,
                  minHeight: 44,
                  maxHeight: 120,
                  padding: 10,
                }}
              />
              <NaturalButton
                disabled={busy || !input.trim() || !contextReady}
                onPress={() => void send()}
                accessibilityLabel="Send question"
                style={[
                  s.circle,
                  {
                    backgroundColor: colors.primary,
                    opacity: busy || !input.trim() ? 0.5 : 1,
                  },
                ]}
              >
                <Send color={colors.textOnPrimary} size={19} />
              </NaturalButton>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </NaturalScene>
  );
}
export default function ChatScreen() {
  const router = useRouter(),
    { colors } = useTheme();
  const account = useAuthStore((state) => state.userId || state.profile.id);
  if (!ENABLE_ASK_COACH)
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background, padding: 24 }}
      >
        <Text variant="h1">Your offline coach is ready.</Text>
        <Text style={{ fontSize: 15, marginVertical: 20 }}>
          Ask Coach is disabled. Your plans, insights and summaries work without
          it.
        </Text>
        <NaturalButton
          onPress={() => router.back()}
          accessibilityLabel="Back to Coach"
        >
          <Text>Back to Coach</Text>
        </NaturalButton>
      </SafeAreaView>
    );
  return <EnabledChat key={account} />;
}
const s = StyleSheet.create({
  header: { padding: 20, flexDirection: "row", alignItems: "center", gap: 12 },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  messages: { padding: 20, paddingTop: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  inputRow: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 6,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
});
