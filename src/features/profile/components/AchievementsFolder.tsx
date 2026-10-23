import React, { useId } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { ArrowUpRight, Flame, Footprints, Trophy, Zap } from 'lucide-react-native';
import { Text } from '../../../components/ui';
import { GlassSheen } from '../../../components/ui/LiquidBackdrop';
import { palette } from '../../../theme/tokens';
import type { BadgeItem } from '../../../store/goals';

export function BadgeGlyph({
  category,
  size = 24,
  color = palette.lime,
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

/** Layered cards and a translucent vector folder use the same palette as the live UI. */
function FolderArtwork({ badges }: { badges: readonly BadgeItem[] }) {
  const id = `folder-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const previews = [
    ...badges.filter((badge) => badge.unlockedAt),
    ...badges.filter((badge) => !badge.unlockedAt),
  ].slice(0, 3);
  return (
    <View
      style={styles.artwork}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.groundShadow} />
      <View style={styles.folderBack} />
      {previews.map((badge, index) => (
        <View
          key={badge.id}
          style={[
            styles.preview,
            {
              left: 15 + index * 25,
              top: index === 1 ? 4 : 15,
              transform: [{ rotate: `${(index - 1) * 13}deg` }],
            },
          ]}
        >
          <BadgeGlyph
            category={badge.category}
            size={23}
            color={badge.unlockedAt ? palette.lime : palette.mist}
          />
          <View style={styles.previewLine} />
        </View>
      ))}
      <Svg style={styles.folderFront} width="132" height="104" viewBox="0 0 132 104">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop stopColor="#B9E8DA" stopOpacity="0.84" />
            <Stop offset="0.48" stopColor="#72B6A5" stopOpacity="0.78" />
            <Stop offset="1" stopColor="#304F50" stopOpacity="0.97" />
          </LinearGradient>
        </Defs>
        <Path
          d="M7 20 Q6 10 17 12 L116 29 Q126 31 125 42 L119 88 Q118 99 107 97 L25 83 Q15 81 14 71Z"
          fill={`url(#${id})`}
          stroke="#D9F2E8"
          strokeOpacity="0.64"
          strokeWidth="1.2"
        />
        <Path
          d="M17 17 L115 34 Q120 35 120 42"
          fill="none"
          stroke="#E5F5E9"
          strokeOpacity="0.6"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.folderSeal}>
        <Trophy size={13} color={palette.limeLight} />
        <Text style={styles.sealText}>stride</Text>
      </View>
    </View>
  );
}

export function AchievementsFolder({
  badges,
  onPress,
}: {
  badges: readonly BadgeItem[];
  onPress: () => void;
}) {
  const earned = badges.filter((badge) => badge.unlockedAt).length;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open achievements. ${earned} of ${badges.length} badges earned.`}
      accessibilityHint="Opens your badge collection"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <GlassSheen />
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>YOUR COLLECTION</Text>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          Achievements
        </Text>
        <Text style={styles.subtitle}>
          {earned} of {badges.length} badges earned
        </Text>
        <View style={styles.open}>
          <Text style={styles.openText}>Open collection</Text>
          <ArrowUpRight size={14} color={palette.lime} />
        </View>
      </View>
      <FolderArtwork badges={badges} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 28,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(185,232,218,0.075)',
    borderWidth: 1,
    borderColor: 'rgba(185,232,218,0.21)',
    borderTopColor: 'rgba(229,245,233,0.37)',
    overflow: 'hidden',
  },
  pressed: { opacity: 0.84, transform: [{ scale: 0.98 }] },
  copy: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontSize: 8,
    lineHeight: 13,
    letterSpacing: 1.7,
    color: palette.mist,
    marginBottom: 7,
  },
  title: {
    fontSize: 20,
    lineHeight: 27,
    letterSpacing: -0.6,
    color: palette.pearl,
    fontWeight: '500',
  },
  subtitle: { fontSize: 11, lineHeight: 17, color: palette.mist, marginTop: 3 },
  open: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 13 },
  openText: { fontSize: 11, lineHeight: 16, color: palette.lime },
  artwork: { width: 132, height: 126 },
  groundShadow: {
    position: 'absolute',
    left: 22,
    right: 10,
    bottom: 0,
    height: 12,
    borderRadius: 50,
    backgroundColor: 'rgba(5,17,22,0.3)',
  },
  folderBack: {
    position: 'absolute',
    left: 11,
    right: 6,
    top: 27,
    bottom: 14,
    backgroundColor: '#3B655E',
    borderRadius: 16,
    transform: [{ rotate: '-7deg' }],
    borderWidth: 1,
    borderColor: 'rgba(185,232,218,0.35)',
  },
  preview: {
    position: 'absolute',
    width: 52,
    height: 77,
    paddingTop: 12,
    shadowColor: '#07151B',
    shadowOpacity: 0.24,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    borderRadius: 10,
    backgroundColor: '#192D34',
    borderWidth: 1,
    borderColor: 'rgba(185,232,218,0.35)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  previewLine: { width: 21, height: 2, borderRadius: 2, backgroundColor: 'rgba(185,232,218,0.36)' },
  folderFront: { position: 'absolute', left: 0, bottom: 0 },
  folderSeal: {
    position: 'absolute',
    left: 26,
    bottom: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    transform: [{ rotate: '9deg' }],
  },
  sealText: { fontSize: 10, color: palette.limeLight, fontWeight: '600', letterSpacing: -0.3 },
});
