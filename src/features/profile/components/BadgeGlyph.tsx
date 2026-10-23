import React from 'react';
import { Flame, Footprints, Trophy, Zap } from 'lucide-react-native';
import type { BadgeItem } from '../../../store/goals';

export function BadgeGlyph({
  category,
  size = 24,
  color = '#B9E8DA',
}: {
  category: BadgeItem['category'];
  size?: number;
  color?: string;
}) {
  const Icon =
    category === 'streak'
      ? Flame
      : category === 'pace'
        ? Zap
        : category === 'distance'
          ? Footprints
          : Trophy;
  return <Icon size={size} color={color} strokeWidth={1.6} />;
}
