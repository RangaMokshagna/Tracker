import { NaturalButton } from "../../components/ui/NaturalButton";
import { LiquidBackdrop } from "../../components/ui/LiquidBackdrop";
/**
 * STRIDE — AI Coach Tab
 */

import React, { useState, useRef, useEffect } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassCard, Text, OfflineBanner, Skeleton } from "../../components/ui";
import { palette, useTheme } from "../../theme/tokens";
import { useAuthStore } from "../../store/auth";
import { useGoalsStore } from "../../store/goals";
import { useHaptics } from "../../hooks/useHaptics";
import { askAICoach, checkInjuryRisk } from "../../services/ai";
import {
  Sparkles,
  Send,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Bot,
  User,
} from "lucide-react-native";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function CoachScreen(): React.JSX.Element {
  const { styles, colors, isDark } = useStyles();
  const haptics = useHaptics();
  const { profile } = useAuthStore();
  const { weekCompletedMeters, weeklyGoalMeters, currentStreakDays } =
    useGoalsStore();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<any>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome_1",
      role: "assistant",
      content: `Welcome back, ${profile.displayName?.split(" ")[0] || "Runner"}! I'm your STRIDE AI Coach. I analyze your real-time pace, distance splits, and volume load to keep your progression steady and injury-free.\n\nAsk me anything about your training, or choose one of the quick topics below!`,
      timestamp: "Just now",
    },
  ]);

  // Check injury risk
  const injuryAlert = checkInjuryRisk(
    weekCompletedMeters,
    weeklyGoalMeters * 0.85,
  );

  const quickPrompts = [
    "Analyze my week",
    "Build next week's plan",
    "Am I at risk of injury?",
    "How do I improve my 5K pace?",
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    haptics.light();
    const userMsg: ChatMessage = {
      id: "user_" + Date.now(),
      role: "user",
      content: text,
      timestamp: "Now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const reply = await askAICoach(
        messages.map((m) => ({ role: m.role, content: m.content })),
        text,
      );

      const assistantMsg: ChatMessage = {
        id: "assistant_" + Date.now(),
        role: "assistant",
        content: reply,
        timestamp: "Now",
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      console.warn("[STRIDE] AI Chat error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LiquidBackdrop />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <OfflineBanner />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.badgeRow}>
              <View style={styles.onlineDot} />
              <Text variant="caption" color="lime" style={styles.badgeText}>
                YOUR PERSONAL RUNNING COMPANION
              </Text>
            </View>
            <Text variant="h1" color="white" style={styles.title}>
              Your running coach
            </Text>
          </View>
          <View style={styles.coachAvatar}>
            <Sparkles size={22} color={palette.lime} />
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Injury Risk Nudge Banner (if moderate/high) */}
          {injuryAlert.riskLevel !== "low" && (
            <GlassCard variant="elevated" style={styles.injuryCard}>
              <View style={styles.injuryHeader}>
                <AlertTriangle size={18} color="#FF9500" />
                <Text
                  variant="label"
                  style={{ color: "#FF9500", fontWeight: "500" }}
                >
                  INJURY-RISK ALERT (
                  {(injuryAlert.riskLevel || "MODERATE").toUpperCase()})
                </Text>
              </View>
              <Text variant="bodySmall" color="white" style={styles.injuryText}>
                {injuryAlert.message}
              </Text>
              <Text variant="caption" color="lime" style={styles.recAction}>
                Recommendation: {injuryAlert.recommendedAction}
              </Text>
            </GlassCard>
          )}

          {/* Smart Weekly Training Plan Card */}
          <GlassCard variant="default" style={styles.planCard}>
            <View style={styles.planHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Calendar size={18} color={palette.lime} />
                <Text
                  variant="label"
                  color="lime"
                  style={{ fontWeight: "500" }}
                >
                  YOUR WEEK, IN BALANCE
                </Text>
              </View>
              <Text variant="caption" color="dark300">
                Target: {(weeklyGoalMeters / 1000).toFixed(0)} km
              </Text>
            </View>

            <View style={styles.weekGrid}>
              {[
                { day: "Mon", type: "5 km Easy", state: "done" },
                { day: "Tue", type: "Rest / Mobility", state: "done" },
                { day: "Wed", type: "6 km Tempo", state: "done" },
                { day: "Thu", type: "Rest", state: "done" },
                { day: "Fri", type: "4 km Aerobic", state: "today" },
                { day: "Sat", type: "8 km Long Run", state: "upcoming" },
                { day: "Sun", type: "Rest / Stretch", state: "upcoming" },
              ].map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.planDayRow,
                    item.state === "today" && styles.todayPlanRow,
                  ]}
                >
                  <Text
                    variant="caption"
                    color={item.state === "today" ? "lime" : "dark300"}
                    style={{ width: 36, fontWeight: "700" }}
                  >
                    {item.day}
                  </Text>
                  <Text
                    variant="bodySmall"
                    color={item.state === "today" ? "lime" : "white"}
                    style={{
                      flex: 1,
                      fontWeight: item.state === "today" ? "800" : "500",
                    }}
                  >
                    {item.type}
                  </Text>
                  {item.state === "done" ? (
                    <CheckCircle2 size={16} color={colors.textSecondary} />
                  ) : item.state === "today" ? (
                    <Text
                      variant="caption"
                      color="lime"
                      style={{ fontWeight: "500" }}
                    >
                      TODAY
                    </Text>
                  ) : (
                    <Text variant="caption" color="dark400">
                      Planned
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </GlassCard>

          {/* Quick Prompt Chips */}
          <View style={styles.quickPromptsSection}>
            <Text
              variant="caption"
              color="dark300"
              style={styles.quickPromptLabel}
            >
              SUGGESTED TOPICS
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsRow}
            >
              {quickPrompts.map((prompt, i) => (
                <NaturalButton
                  key={i}
                  style={styles.promptPill}
                  onPress={() => handleSend(prompt)}
                >
                  <Text
                    variant="caption"
                    color="white"
                    style={styles.promptPillText}
                  >
                    {prompt}
                  </Text>
                </NaturalButton>
              ))}
            </ScrollView>
          </View>

          {/* Chat Messages */}
          <View style={styles.messagesContainer}>
            {messages.map((m) => {
              const isAssistant = m.role === "assistant";
              return (
                <View
                  key={m.id}
                  style={[
                    styles.msgRow,
                    isAssistant ? styles.assistantRow : styles.userRow,
                  ]}
                >
                  {isAssistant && (
                    <View style={styles.botIcon}>
                      <Bot size={14} color={colors.textOnPrimary} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.bubble,
                      isAssistant ? styles.assistantBubble : styles.userBubble,
                    ]}
                  >
                    <Text
                      variant="bodySmall"
                      color={isAssistant ? "text" : "textOnPrimary"}
                      style={styles.messageContent}
                    >
                      {m.content}
                    </Text>
                  </View>
                  {!isAssistant && (
                    <View style={styles.userIcon}>
                      <User size={14} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              );
            })}

            {loading && (
              <View style={[styles.msgRow, styles.assistantRow]}>
                <View style={styles.botIcon}>
                  <Bot size={14} color={colors.textOnPrimary} />
                </View>
                <View style={[styles.bubble, styles.assistantBubble]}>
                  <Text
                    variant="caption"
                    color="lime"
                    style={{ fontStyle: "italic" }}
                  >
                    Coach is thinking...
                  </Text>
                  <Skeleton.Text lines={2} />
                </View>
              </View>
            )}
          </View>

          {/* Medical Disclaimer */}
          <View style={styles.disclaimerContainer}>
            <Text
              variant="caption"
              color="dark400"
              style={styles.disclaimerText}
            >
              STRIDE AI provides fitness education and training recommendations
              only. Not intended as medical advice. Always consult a healthcare
              professional before altering your exercise plan.
            </Text>
          </View>
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your coach anything..."
            placeholderTextColor={colors.textSecondary}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
          <NaturalButton
            accessibilityRole="button"
            accessibilityLabel="Send message to coach"
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            disabled={!input.trim() || loading}
            onPress={() => handleSend()}
          >
            <Send
              size={18}
              color={input.trim() ? colors.textOnPrimary : colors.textSecondary}
            />
          </NaturalButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = () => {
  const { colors, isDark } = useTheme();
  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 20,
    },
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    onlineDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: "500",
      letterSpacing: 1,
    },
    title: {
      fontWeight: "600",
      marginTop: 2,
    },
    coachAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primaryMuted,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    scrollContent: {
      paddingBottom: 20,
    },
    injuryCard: {
      marginHorizontal: 20,
      marginVertical: 8,
      padding: 14,
      borderWidth: 1,
      borderColor: "rgba(255, 149, 0, 0.4)",
      backgroundColor: "rgba(255, 149, 0, 0.08)",
    },
    injuryHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 6,
    },
    injuryText: {
      lineHeight: 18,
      marginBottom: 6,
    },
    recAction: {
      fontWeight: "700",
    },
    planCard: {
      marginHorizontal: 20,
      marginVertical: 8,
      padding: 16,
    },
    planHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    weekGrid: {
      gap: 6,
    },
    planDayRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    todayPlanRow: {
      backgroundColor: colors.primaryMuted,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
    },
    quickPromptsSection: {
      marginTop: 10,
      marginBottom: 6,
    },
    quickPromptLabel: {
      paddingHorizontal: 20,
      letterSpacing: 1.5,
      fontSize: 11,
      fontWeight: "500",
      marginBottom: 8,
    },
    pillsRow: {
      paddingHorizontal: 16,
      gap: 8,
    },
    promptPill: {
      backgroundColor: colors.glassSubtle,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
    },
    promptPillText: {
      fontWeight: "600",
      fontSize: 12,
    },
    messagesContainer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      gap: 12,
    },
    msgRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
    },
    assistantRow: {
      justifyContent: "flex-start",
    },
    userRow: {
      justifyContent: "flex-end",
    },
    botIcon: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    userIcon: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.glassSubtle,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    bubble: {
      maxWidth: "78%",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 18,
    },
    assistantBubble: {
      backgroundColor: colors.glassSubtle,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderBottomLeftRadius: 4,
    },
    userBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    messageContent: {
      lineHeight: 20,
    },
    disclaimerContainer: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      alignItems: "center",
    },
    disclaimerText: {
      textAlign: "center",
      fontSize: 11,
      lineHeight: 16,
    },
    inputBar: {
      marginBottom: 90,
      marginHorizontal: 20,
      borderRadius: 30,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.glassBorder,
      gap: 10,
    },
    textInput: {
      flex: 1,
      height: 44,
      backgroundColor: colors.glassSubtle,
      borderRadius: 22,
      paddingHorizontal: 16,
      color: colors.text,
      fontSize: 15,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: {
      backgroundColor: colors.glassSubtle,
    },
  });
  return { styles, colors, isDark };
};
