import React from 'react';
import { useRouter } from 'expo-router';
import { AchievementDeck, type DeckBadge } from '../features/profile/components/AchievementDeck';
import { useGoalsStore } from '../store/goals';

export default function AchievementsScreen() {
  const router = useRouter();
  const { badges, personalRecords, longestStreakDays, weekCompletedMeters, weeklyGoalMeters } =
    useGoalsStore();
  const colors = { milestone: '#B9D6B3', distance: '#D2B889', streak: '#D4A28A', pace: '#ADA0CD' };
  const collection: DeckBadge[] = badges.map((badge) => {
    let progress = badge.unlockedAt ? 1 : 0;
    let stats: string | undefined;
    if (badge.id === '5k_finisher' || badge.id === '10k_cruiser') {
      const target = badge.id === '5k_finisher' ? 5000 : 10000;
      progress = badge.unlockedAt
        ? 1
        : Math.min(1, (personalRecords.longestDistanceMeters || 0) / target);
      stats = badge.unlockedAt
        ? `Longest run · ${((personalRecords.longestDistanceMeters || 0) / 1000).toFixed(1)} km`
        : `${((personalRecords.longestDistanceMeters || 0) / 1000).toFixed(1)} / ${target / 1000} km`;
    } else if (badge.id === 'streak_3') {
      progress = badge.unlockedAt ? 1 : Math.min(1, longestStreakDays / 3);
      stats = `Longest streak · ${longestStreakDays} days`;
    } else if (badge.id === 'week_warrior') {
      progress = badge.unlockedAt
        ? 1
        : Math.min(1, weekCompletedMeters / Math.max(1, weeklyGoalMeters));
      stats = `This week · ${(weekCompletedMeters / 1000).toFixed(1)} / ${(weeklyGoalMeters / 1000).toFixed(1)} km`;
    } else if (badge.id === 'sub_25_5k' && personalRecords.fastest5kSeconds) {
      progress = badge.unlockedAt ? 1 : Math.min(1, 1500 / personalRecords.fastest5kSeconds);
      stats = `Best 5K · ${Math.floor(personalRecords.fastest5kSeconds / 60)}:${String(personalRecords.fastest5kSeconds % 60).padStart(2, '0')}`;
    }
    return {
      id: badge.id,
      title: badge.name,
      earned: !!badge.unlockedAt,
      earnedAt: badge.unlockedAt,
      description: badge.description,
      progress,
      stats,
      color: colors[badge.category],
      category: badge.category,
    };
  });
  return (
    <AchievementDeck
      badges={collection}
      onClose={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
    />
  );
}
