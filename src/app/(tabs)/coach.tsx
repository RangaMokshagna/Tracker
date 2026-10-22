/**
 * STRIDE — AI Coach Tab
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard, Text, OfflineBanner } from '../../components/ui';
import { palette } from '../../theme/tokens';
import { useAuthStore } from '../../store/auth';
import { useGoalsStore } from '../../store/goals';
import { useHaptics } from '../../hooks/useHaptics';
import { askAICoach, checkInjuryRisk } from '../../services/ai';
import {
  Sparkles,
  Send,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Bot,
  User,
} from 'lucide-react-native';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function CoachScreen(): React.JSX.Element {
  const haptics = useHaptics();
  const { profile } = useAuthStore();
  const { weekCompletedMeters, weeklyGoalMeters, currentStreakDays } = useGoalsStore();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<any>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      content: `Welcome back, ${profile.displayName?.split(' ')[0] || 'Runner'}! I'm your STRIDE AI Coach. I analyze your real-time pace, distance splits, and volume load to keep your progression steady and injury-free.\n\nAsk me anything about your training, or choose one of the quick topics below!`,
      timestamp: 'Just now',
    },
  ]);

  // Check injury risk
  const injuryAlert = checkInjuryRisk(weekCompletedMeters, weeklyGoalMeters * 0.85);

  const quickPrompts = [
    'Analyze my week',
    "Build next week's plan",
    'Am I at risk of injury?',
    'How do I improve my 5K pace?',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    haptics.light();
    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: 'Now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await askAICoach(
        messages.map((m) => ({ role: m.role, content: m.content })),
        text
      );

      const assistantMsg: ChatMessage = {
        id: 'assistant_' + Date.now(),
        role: 'assistant',
        content: reply,
        timestamp: 'Now',
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      console.warn('[STRIDE] AI Chat error:', e);
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
      <StatusBar barStyle="light-content" />
      <OfflineBanner />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.badgeRow}>
              <View style={styles.onlineDot} />
              <Text variant="caption" color="lime" style={styles.badgeText}>
                CLAUDE 3.5 AI ENGINE ACTIVE
              </Text>
            </View>
            <Text variant="h1" color="white" style={styles.title}>
              AI Coach
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
          {injuryAlert.riskLevel !== 'low' && (
            <GlassCard variant="elevated" style={styles.injuryCard}>
              <View style={styles.injuryHeader}>
                <AlertTriangle size={18} color="#FF9500" />
                <Text variant="label" style={{ color: '#FF9500', fontWeight: '800' }}>
                  INJURY-RISK ALERT ({(injuryAlert.riskLevel || 'MODERATE').toUpperCase()})
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Calendar size={18} color={palette.lime} />
                <Text variant="label" color="lime" style={{ fontWeight: '800' }}>
                  SMART WEEKLY PLAN
                </Text>
              </View>
              <Text variant="caption" color="dark300">
                Target: {(weeklyGoalMeters / 1000).toFixed(0)} km
              </Text>
            </View>

            <View style={styles.weekGrid}>
              {[
                { day: 'Mon', type: '5 km Easy', state: 'done' },
                { day: 'Tue', type: 'Rest / Mobility', state: 'done' },
                { day: 'Wed', type: '6 km Tempo', state: 'done' },
                { day: 'Thu', type: 'Rest', state: 'done' },
                { day: 'Fri', type: '4 km Aerobic', state: 'today' },
                { day: 'Sat', type: '8 km Long Run', state: 'upcoming' },
                { day: 'Sun', type: 'Rest / Stretch', state: 'upcoming' },
              ].map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.planDayRow,
                    item.state === 'today' && styles.todayPlanRow,
                  ]}
                >
                  <Text
                    variant="caption"
                    color={item.state === 'today' ? 'lime' : 'dark300'}
                    style={{ width: 36, fontWeight: '700' }}
                  >
                    {item.day}
                  </Text>
                  <Text
                    variant="bodySmall"
                    color={item.state === 'today' ? 'lime' : 'white'}
                    style={{ flex: 1, fontWeight: item.state === 'today' ? '800' : '500' }}
                  >
                    {item.type}
                  </Text>
                  {item.state === 'done' ? (
                    <CheckCircle2 size={16} color="rgba(255, 255, 255, 0.4)" />
                  ) : item.state === 'today' ? (
                    <Text variant="caption" color="lime" style={{ fontWeight: '800' }}>
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
            <Text variant="caption" color="dark300" style={styles.quickPromptLabel}>
              SUGGESTED TOPICS
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
              {quickPrompts.map((prompt, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.promptPill}
                  activeOpacity={0.7}
                  onPress={() => handleSend(prompt)}
                >
                  <Text variant="caption" color="white" style={styles.promptPillText}>
                    {prompt}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Chat Messages */}
          <View style={styles.messagesContainer}>
            {messages.map((m) => {
              const isAssistant = m.role === 'assistant';
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
                      <Bot size={14} color="#000000" />
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
                      color={isAssistant ? 'white' : 'dark900'}
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
                  <Bot size={14} color="#000000" />
                </View>
                <View style={[styles.bubble, styles.assistantBubble]}>
                  <Text variant="caption" color="lime" style={{ fontStyle: 'italic' }}>
                    Coach is thinking...
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Medical Disclaimer */}
          <View style={styles.disclaimerContainer}>
            <Text variant="caption" color="dark400" style={styles.disclaimerText}>
              STRIDE AI provides fitness education and training recommendations only. Not intended as medical advice. Always consult a healthcare professional before altering your exercise plan.
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
            placeholderTextColor="#666666"
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            disabled={!input.trim() || loading}
            onPress={() => handleSend()}
          >
            <Send size={18} color={input.trim() ? '#000000' : '#444444'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.lime,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontWeight: '900',
    marginTop: 2,
  },
  coachAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(191, 255, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(191, 255, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  injuryCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.4)',
    backgroundColor: 'rgba(255, 149, 0, 0.08)',
  },
  injuryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  injuryText: {
    lineHeight: 18,
    marginBottom: 6,
  },
  recAction: {
    fontWeight: '700',
  },
  planCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekGrid: {
    gap: 6,
  },
  planDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  todayPlanRow: {
    backgroundColor: 'rgba(191, 255, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(191, 255, 0, 0.3)',
  },
  quickPromptsSection: {
    marginTop: 10,
    marginBottom: 6,
  },
  quickPromptLabel: {
    paddingHorizontal: 20,
    letterSpacing: 1.5,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 8,
  },
  pillsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  promptPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  promptPillText: {
    fontWeight: '600',
    fontSize: 12,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  userIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  assistantBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: palette.lime,
    borderBottomRightRadius: 4,
  },
  messageContent: {
    lineHeight: 20,
  },
  disclaimerContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disclaimerText: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#141414',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 22,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});
