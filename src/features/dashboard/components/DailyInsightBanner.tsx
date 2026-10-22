/**
 * STRIDE — AI Coach Daily Insight Banner
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassCard, Text } from '../../../components/ui';
import { palette } from '../../../theme/tokens';
import { Sparkles, ArrowRight } from 'lucide-react-native';

interface DailyInsightBannerProps {
  onPressAskCoach: () => void;
}

export const DailyInsightBanner: React.FC<DailyInsightBannerProps> = ({ onPressAskCoach }) => {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPressAskCoach}>
      <GlassCard variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.aiPill}>
            <Sparkles size={14} color={palette.lime} />
            <Text variant="caption" color="lime" style={styles.pillText}>
              AI COACH INSIGHT
            </Text>
          </View>
          <View style={styles.actionRow}>
            <Text variant="caption" color="dark300">
              Chat
            </Text>
            <ArrowRight size={14} color={palette.lime} />
          </View>
        </View>

        <Text variant="body" color="white" style={styles.insightBody}>
          Your aerobic cadence has climbed by 6 SPM this week. Keep tomorrow's run at conversational effort to cement this efficiency gain.
        </Text>
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(191, 255, 0, 0.25)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(191, 255, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillText: {
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  insightBody: {
    lineHeight: 22,
    fontSize: 14,
    color: '#E0E0E0',
  },
});
