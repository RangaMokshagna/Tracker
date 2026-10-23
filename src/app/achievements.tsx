import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Lock, Trophy } from 'lucide-react-native';
import { GlassCard, Text } from '../components/ui';
import { LiquidBackdrop } from '../components/ui/LiquidBackdrop';
import { BadgeGlyph } from '../features/profile/components/AchievementsFolder';
import { useGoalsStore } from '../store/goals';
import { palette } from '../theme/tokens';

export default function AchievementsScreen() {
  const router = useRouter();
  const badges = useGoalsStore((state) => state.badges);
  const [earnedOnly, setEarnedOnly] = useState(false);
  const earned = badges.filter((badge) => badge.unlockedAt);
  const visible = earnedOnly ? earned : badges;
  return (
    <SafeAreaView style={styles.screen}>
      <LiquidBackdrop />
      <View style={styles.header}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
          accessibilityRole="button"
          accessibilityLabel="Back to profile"
          style={styles.back}
        >
          <ArrowLeft size={22} color={palette.pearl} />
        </Pressable>
        <Text style={styles.headerLabel}>YOUR COLLECTION</Text>
        <View style={styles.headerSpace} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text accessibilityRole="header" style={styles.title}>
              Little wins.{'\n'}Lasting momentum.
            </Text>
            <Text style={styles.subtitle}>
              {earned.length} of {badges.length} achievements earned
            </Text>
          </View>
          <View style={styles.trophy}>
            <Trophy size={30} color={palette.lime} />
          </View>
        </View>
        <View accessibilityRole="tablist" style={styles.filters}>
          {[false, true].map((value) => (
            <Pressable
              key={String(value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: earnedOnly === value }}
              onPress={() => setEarnedOnly(value)}
              style={[styles.filter, earnedOnly === value && styles.selectedFilter]}
            >
              <Text style={[styles.filterText, earnedOnly === value && styles.selectedText]}>
                {value ? `Earned · ${earned.length}` : `All badges · ${badges.length}`}
              </Text>
            </Pressable>
          ))}
        </View>
        {visible.map((badge) => (
          <GlassCard key={badge.id} style={styles.badge}>
            <View style={[styles.glyph, !badge.unlockedAt && styles.lockedGlyph]}>
              <BadgeGlyph
                category={badge.category}
                size={28}
                color={badge.unlockedAt ? palette.lime : palette.mist}
              />
            </View>
            <View style={styles.badgeCopy}>
              <Text style={styles.badgeTitle}>{badge.name}</Text>
              <Text style={styles.description}>{badge.description}</Text>
              <View style={styles.status}>
                {badge.unlockedAt ? (
                  <Check size={12} color={palette.lime} />
                ) : (
                  <Lock size={12} color={palette.mist} />
                )}
                <Text style={[styles.statusText, badge.unlockedAt ? styles.earnedText : null]}>
                  {badge.unlockedAt
                    ? `Earned ${new Date(badge.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : 'Keep going to unlock'}
                </Text>
              </View>
            </View>
          </GlassCard>
        ))}
        {!visible.length && (
          <GlassCard style={styles.empty}>
            <Trophy size={30} color={palette.lime} />
            <Text style={styles.badgeTitle}>
              {earnedOnly ? 'Your first win is ahead.' : 'Your collection is on its way.'}
            </Text>
            <Text style={styles.description}>Keep running to collect your milestones.</Text>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.dark900 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(185,232,218,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(185,232,218,0.18)',
  },
  headerSpace: { width: 44 },
  headerLabel: { fontSize: 9, letterSpacing: 2, color: palette.mist },
  scroll: { padding: 20, paddingBottom: 32, width: '100%', maxWidth: 620, alignSelf: 'center' },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 26 },
  headingCopy: { flex: 1 },
  title: {
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '400',
    letterSpacing: -1.1,
    color: palette.pearl,
  },
  subtitle: { fontSize: 12, lineHeight: 18, color: palette.mist, marginTop: 12 },
  trophy: {
    width: 65,
    height: 65,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(185,232,218,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(185,232,218,0.24)',
    transform: [{ rotate: '8deg' }],
  },
  filters: {
    flexDirection: 'row',
    borderRadius: 22,
    backgroundColor: 'rgba(185,232,218,0.05)',
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  filter: {
    flex: 1,
    minHeight: 40,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  selectedFilter: { backgroundColor: 'rgba(185,232,218,0.16)' },
  filterText: { fontSize: 12, color: palette.mist },
  selectedText: { color: palette.limeLight, fontWeight: '600' },
  badge: {
    padding: 16,
    borderRadius: 25,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  glyph: {
    width: 56,
    height: 62,
    borderRadius: 19,
    backgroundColor: 'rgba(185,232,218,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(185,232,218,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedGlyph: { backgroundColor: 'rgba(129,149,158,0.06)', borderColor: 'rgba(129,149,158,0.18)' },
  badgeCopy: { flex: 1 },
  badgeTitle: { fontSize: 16, lineHeight: 22, fontWeight: '500', color: palette.pearl },
  description: { fontSize: 12, lineHeight: 18, color: palette.mist, marginTop: 4 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  statusText: { fontSize: 10, lineHeight: 15, color: palette.mist },
  earnedText: { color: palette.lime },
  empty: { padding: 24, gap: 10, alignItems: 'center' },
});
