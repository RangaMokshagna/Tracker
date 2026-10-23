import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
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
function FolderArtwork() {
  return (
    <View
      style={styles.artwork}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image
        source={require('../../../../assets/achievements-folder-glass.png')}
        resizeMode="contain"
        style={styles.folderImage}
        accessible={false}
      />
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
      <FolderArtwork />
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
  artwork: { width: 154, height: 138, marginRight: -5 },
  folderImage: { width: '100%', height: '100%' },
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
