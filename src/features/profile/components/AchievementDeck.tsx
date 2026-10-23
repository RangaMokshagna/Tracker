import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  BackHandler,
  PanResponder,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Info,
  ListFilter,
  Lock,
  Share2,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { create } from 'zustand';
import { Text } from '../../../components/ui';
import { BadgeGlyph } from './BadgeGlyph';
import type { BadgeItem } from '../../../store/goals';
import { deckDestination, deckSwipeDirection } from '../deckNavigation';

export interface DeckBadge {
  id: string;
  title: string;
  image?: ImageSourcePropType;
  earned: boolean;
  progress: number;
  earnedAt?: string | null;
  description: string;
  color?: string;
  category?: BadgeItem['category'];
  stats?: string;
}
export type FolderOrigin = { x: number; y: number; width: number; height: number };
export const useFolderTransition = create<{
  origin: FolderOrigin | null;
  setOrigin: (origin: FolderOrigin) => void;
}>((set) => ({ origin: null, setOrigin: (origin) => set({ origin }) }));
const physics = { stiffness: 240, damping: 25, mass: 1 };
const tick = () => {
  void Haptics.selectionAsync().catch(() => {});
};

export function DeckHeader({
  earned,
  total,
  filtered,
  onBack,
  onFilter,
}: {
  earned: number;
  total: number;
  filtered: boolean;
  onBack: () => void;
  onFilter: () => void;
}) {
  return (
    <View style={s.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close collection"
        onPress={onBack}
        style={s.circle}
      >
        <ArrowLeft color="#F3F2EC" size={20} />
      </Pressable>
      <View style={s.headerCopy}>
        <Text style={s.overTitle}>Your</Text>
        <Text accessibilityRole="header" style={s.headerTitle}>
          achievements.
        </Text>
        <Text style={s.counter}>
          {earned} of {total} earned
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={filtered ? 'Show all badges' : 'Show earned badges only'}
        accessibilityState={{ selected: filtered }}
        onPress={onFilter}
        style={[s.circle, filtered && s.filterActive]}
      >
        <ListFilter color="#F3F2EC" size={20} />
      </Pressable>
    </View>
  );
}

function CardSurface({ color, id }: { color: string; id: string }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 320 560" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0.7" y2="1">
            <Stop stopColor={color} stopOpacity="0.65" />
            <Stop offset="0.5" stopColor="#1B292D" />
            <Stop offset="1" stopColor="#10181D" />
          </LinearGradient>
        </Defs>
        <Rect width="320" height="560" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

export function BadgeCard({
  badge,
  active = false,
  order = 0,
}: {
  badge: DeckBadge;
  active?: boolean;
  order?: number;
}) {
  const reduced = useReducedMotion();
  const flip = useSharedValue(0);
  const shine = useSharedValue(-1);
  const [details, setDetails] = useState(false);
  const [shareError, setShareError] = useState('');
  const color = badge.earned ? badge.color || '#B9E8DA' : '#6E7C80';
  useEffect(() => {
    if (active && badge.earned && !reduced) {
      shine.set(-1);
      shine.set(withTiming(1.6, { duration: 1100 }));
    }
    return () => cancelAnimation(shine);
  }, [active, badge.earned, reduced, shine]);
  const front = useAnimatedStyle(() => ({
    opacity: reduced ? 1 - flip.value : 1,
    transform: reduced ? [] : [{ perspective: 1000 }, { rotateY: `${flip.value * 180}deg` }],
  }));
  const back = useAnimatedStyle(() => ({
    opacity: reduced ? flip.value : 1,
    transform: reduced ? [] : [{ perspective: 1000 }, { rotateY: `${180 + flip.value * 180}deg` }],
  }));
  const glint = useAnimatedStyle(() => ({
    opacity: interpolate(shine.value, [-1, 0, 1, 1.6], [0, 0.2, 0.2, 0]),
    transform: [{ translateX: shine.value * 400 }, { rotate: '20deg' }],
  }));
  const toggle = () => {
    setDetails(!details);
    flip.set(
      reduced
        ? withTiming(details ? 0 : 1, { duration: 150 })
        : withSpring(details ? 0 : 1, physics),
    );
  };
  const date = badge.earnedAt
    ? new Date(badge.earnedAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';
  const share = async () => {
    try {
      setShareError('');
      await Share.share({
        title: badge.title,
        message: `${badge.title} — ${badge.description}${date ? `\nEarned ${date}` : ''}\nSTRIDE / A little further.`,
      });
    } catch {
      setShareError('Sharing is unavailable. Please try again.');
    }
  };
  return (
    <View style={s.cardShell}>
      <Animated.View
        pointerEvents={details || !active ? 'none' : 'auto'}
        accessibilityElementsHidden={details || !active}
        importantForAccessibility={details || !active ? 'no-hide-descendants' : 'auto'}
        style={[s.cardFace, front]}
      >
        <CardSurface color={color} id={`face-${badge.id}`} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${badge.title}. ${badge.earned ? 'Earned' : 'Locked'}. Show details.`}
          onPress={toggle}
          disabled={!active}
          style={s.cardTap}
        >
          <View style={s.cardTop}>
            <Text style={s.cardEyebrow}>STRIDE / {String(order + 1).padStart(2, '0')}</Text>
            <View style={s.smallCircle}>
              {badge.earned ? (
                <Info color="#EDF7F1" size={18} />
              ) : (
                <Lock color="#CFD7D5" size={18} />
              )}
            </View>
          </View>
          <Text style={s.badgeTitle}>{badge.title.toUpperCase()}</Text>
          <View style={[s.hero, { borderColor: `${color}55` }]}>
            {
              <Image
                blurRadius={badge.earned ? 0 : 16}
                tintColor={badge.earned ? undefined : '#A3AEAA'}
                source={badge.image || require('../../../../assets/movement-mountains.png')}
                resizeMode="cover"
                style={[StyleSheet.absoluteFill, { opacity: badge.earned ? 0.5 : 0.12 }]}
              />
            }
            <View style={[s.halo, { borderColor: `${color}44`, backgroundColor: `${color}15` }]}>
              <View
                style={[
                  s.medallion,
                  { borderColor: color, backgroundColor: badge.earned ? '#243F40' : '#30383C' },
                ]}
              >
                <BadgeGlyph category={badge.category || 'milestone'} size={80} color={color} />
                {!badge.earned && (
                  <View style={s.lockSeal}>
                    <Lock size={18} color="#E2E7E5" />
                  </View>
                )}
              </View>
            </View>
            <Text style={[s.heroWord, { color }]}>
              {badge.earned ? 'EARNED, NOT GIVEN.' : 'YOUR NEXT CHAPTER.'}
            </Text>
          </View>
          <View style={s.captionPill}>
            <Text style={s.caption}>
              {badge.earned
                ? `Earned ${date || 'with STRIDE'}${badge.stats ? ` · ${badge.stats}` : ''}`
                : badge.stats || 'Keep moving to unlock'}
            </Text>
          </View>
          {!badge.earned && (
            <View
              accessibilityRole="progressbar"
              accessibilityLabel={`${badge.title} progress`}
              accessibilityValue={{ min: 0, max: 100, now: Math.round(badge.progress * 100) }}
              style={s.progress}
            >
              <View
                style={[
                  s.progressFill,
                  { width: `${Math.max(0, Math.min(1, badge.progress)) * 100}%` },
                ]}
              />
            </View>
          )}
          <Text style={s.tapHint}>Tap to discover your story</Text>
        </Pressable>
        {active && badge.earned && <Animated.View pointerEvents="none" style={[s.glint, glint]} />}
      </Animated.View>
      <Animated.View
        pointerEvents={details && active ? 'auto' : 'none'}
        accessibilityElementsHidden={!details || !active}
        importantForAccessibility={!details || !active ? 'no-hide-descendants' : 'auto'}
        style={[s.cardFace, back]}
      >
        <CardSurface color={color} id={`back-${badge.id}`} />
        <ScrollView contentContainerStyle={s.details} showsVerticalScrollIndicator={false}>
          <View style={s.cardTop}>
            <BadgeGlyph category={badge.category || 'milestone'} color={color} size={32} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Return to badge front"
              onPress={toggle}
              style={s.circle}
            >
              <X color="#fff" size={19} />
            </Pressable>
          </View>
          <Text style={[s.badgeTitle, { marginTop: 25 }]}>{badge.title}</Text>
          <Text style={s.description}>{badge.description}</Text>
          <View style={s.rule} />
          <Text style={s.cardEyebrow}>{badge.earned ? 'YOUR MILESTONE' : 'THE JOURNEY AHEAD'}</Text>
          <Text style={s.detailValue}>
            {badge.earned ? date || 'Earned' : `${Math.round(badge.progress * 100)}% complete`}
          </Text>
          {badge.stats && <Text style={s.description}>{badge.stats}</Text>}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Share ${badge.title}`}
            onPress={share}
            style={s.share}
          >
            <Share2 size={18} color="#13242A" />
            <Text style={s.shareLabel}>Share {badge.earned ? 'achievement' : 'my goal'}</Text>
          </Pressable>
          {!!shareError && (
            <Text accessibilityRole="alert" style={s.caption}>
              {shareError}
            </Text>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

export function AchievementDeck({
  badges,
  axis = 'vertical',
  onClose,
}: {
  badges: readonly DeckBadge[];
  axis?: 'vertical' | 'horizontal';
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const origin = useFolderTransition((state) => state.origin);
  const [index, setIndex] = useState(0);
  const [filtered, setFiltered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState(true);
  const visible = filtered ? badges.filter((badge) => badge.earned) : badges;
  const safeIndex = Math.min(index, Math.max(0, visible.length - 1));
  const active = visible[safeIndex];
  const cardWidth = Math.min(width - 44, 380);
  const cardHeight = Math.max(
    320,
    Math.min(height * 0.68, height - insets.top - insets.bottom - 250),
  );
  const travel = useSharedValue(0);
  const openingProgress = useSharedValue(0);
  const [backgrounds, setBackgrounds] = useState({ previous: '#203C37', next: '#203C37' });
  const backgroundMix = useSharedValue(1);
  const lockedColor = '#3D4548';
  const activeColor = active?.earned ? active.color || '#B9E8DA' : lockedColor;
  if (backgrounds.next !== activeColor) setBackgrounds({ previous: backgrounds.next, next: activeColor });
  useEffect(() => {
    backgroundMix.set(0);
    backgroundMix.set(withTiming(1, { duration: reduced ? 150 : 500 }));
  }, [activeColor, backgroundMix, reduced]);
  useEffect(() => {
    if (reduced) {
      openingProgress.set(
        withTiming(1, { duration: 150 }, (finished) => {
          if (finished) runOnJS(setOpening)(false);
        }),
      );
      return;
    }
    openingProgress.set(
      withSpring(1, physics, (finished) => {
        if (finished) runOnJS(setOpening)(false);
      }),
    );
  }, [openingProgress, reduced]);
  const change = useCallback(
    (next: number) => {
      setIndex(next);
      travel.set(0);
      setBusy(false);
      tick();
    },
    [travel],
  );
  const move = (direction: number, velocity = 0) => {
    if (busy || opening) return;
    const next = deckDestination(safeIndex, direction, visible.length);
    if (next === safeIndex || !visible.length) {
      travel.set(reduced ? 0 : withSpring(0, physics));
      return;
    }
    setBusy(true);
    travel.set(
      withTiming(
        direction * -Math.max(cardHeight, cardWidth) * 1.4,
        { duration: reduced ? 100 : Math.max(160, 300 - Math.abs(velocity) * 35) },
        (finished) => {
          if (finished) runOnJS(change)(next);
        },
      ),
    );
  };
  const pan = PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) =>
      !busy &&
      !opening &&
      Math.abs(axis === 'vertical' ? gesture.dy : gesture.dx) > 10 &&
      Math.abs(axis === 'vertical' ? gesture.dy : gesture.dx) >
        Math.abs(axis === 'vertical' ? gesture.dx : gesture.dy),
    onPanResponderMove: (_, gesture) => {
      const delta = axis === 'vertical' ? gesture.dy : gesture.dx;
      const edge =
        (delta > 0 && safeIndex === 0) || (delta < 0 && safeIndex === visible.length - 1);
      travel.set(delta * (edge ? 0.22 : 0.85));
    },
    onPanResponderRelease: (_, gesture) => {
      const delta = axis === 'vertical' ? gesture.dy : gesture.dx;
      const velocity = axis === 'vertical' ? gesture.vy : gesture.vx;
      const direction = deckSwipeDirection(delta, velocity);
      if (direction) move(direction, velocity);
      else travel.set(reduced ? 0 : withSpring(0, physics));
    },
    onPanResponderTerminate: () => travel.set(reduced ? 0 : withSpring(0, physics)),
  });
  const ambient = useAnimatedStyle(() => ({
    opacity: openingProgress.value * backgroundMix.value,
  }));
  const previousAmbient = useAnimatedStyle(() => ({
    opacity: openingProgress.value * (1 - backgroundMix.value),
  }));
  const deckEntry = useAnimatedStyle(() => ({
    opacity: reduced
      ? openingProgress.value
      : interpolate(openingProgress.value, [0, 0.45, 1], [0, 0, 1]),
    transform: reduced
      ? []
      : [
          { translateY: (1 - openingProgress.value) * 100 },
          { scale: 0.75 + openingProgress.value * 0.25 },
        ],
  }));
  const frontMotion = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(travel.value), [0, cardHeight], [1, 0]),
    transform: reduced
      ? []
      : [
          { translateX: axis === 'horizontal' ? travel.value : 0 },
          { translateY: axis === 'vertical' ? travel.value : 0 },
          { rotate: `${travel.value / 25}deg` },
        ],
  }));
  const clone = useAnimatedStyle(() => {
    const p = openingProgress.value;
    const start = origin || { x: width / 2 - 70, y: height / 2 - 60, width: 140, height: 120 };
    return {
      opacity: reduced ? 0 : interpolate(p, [0, 0.6, 1], [1, 1, 0]),
      transform: [
        { translateX: (1 - p) * (start.x + start.width / 2 - width / 2) },
        { translateY: (1 - p) * (start.y + start.height / 2 - height / 2) },
        { scale: interpolate(p, [0, 1], [start.width / cardWidth, 1.1]) },
        { perspective: 900 },
        { rotateX: `${p * -20}deg` },
      ],
    };
  });
  const close = () => {
    if (busy) return;
    setBusy(true);
    setOpening(true);
    openingProgress.set(
      withTiming(0, { duration: reduced ? 150 : 450 }, (finished) => {
        if (finished) runOnJS(onClose)();
      }),
    );
  };
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => listener.remove();
  });
  return (
    <View style={s.screen}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: backgrounds.previous },
          previousAmbient,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: backgrounds.next }, ambient]}
      />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" viewBox="0 0 400 900" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id="deck-ambient" cx="0.75" cy="0.3" r="0.9">
              <Stop stopColor="#10181A" stopOpacity="0.36" />
              <Stop offset="1" stopColor="#10181A" stopOpacity="0.97" />
            </RadialGradient>
          </Defs>
          <Rect width="400" height="900" fill="url(#deck-ambient)" />
        </Svg>
      </View>
      <SafeAreaView style={s.safe}>
        <DeckHeader
          earned={badges.filter((badge) => badge.earned).length}
          total={badges.length}
          filtered={filtered}
          onBack={close}
          onFilter={() => {
            if (busy || opening) return;
            setIndex(0);
            setFiltered(!filtered);
            travel.set(0);
            tick();
          }}
        />
        <View style={s.deckArea}>
          <Animated.View
            style={[{ width: cardWidth, height: cardHeight }, deckEntry]}
            {...pan.panHandlers}
          >
            {[3, 2, 1].map(
              (depth) =>
                visible[safeIndex + depth] && (
                  <View
                    key={`peek-${depth}`}
                    pointerEvents="none"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={[
                      s.peek,
                      {
                        transform: [
                          { perspective: 1000 },
                          { translateY: -28 * depth },
                          { scale: 1 - depth * 0.08 },
                          { rotateX: '4deg' },
                        ],
                        backgroundColor: visible[safeIndex + depth].earned
                          ? visible[safeIndex + depth].color || '#567E72'
                          : lockedColor,
                      },
                    ]}
                  >
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: `rgba(0,0,0,${depth * 0.2})` },
                      ]}
                    />
                    <Text style={s.peekLabel}>
                      {visible[safeIndex + depth].title.toUpperCase()}
                    </Text>
                  </View>
                ),
            )}
            {active ? (
              <Animated.View
                key={active.id}
                entering={
                  reduced
                    ? FadeIn.duration(150)
                    : ZoomIn.springify()
                        .damping(25)
                        .withInitialValues({ transform: [{ scale: 0.92 }] })
                }
                style={[StyleSheet.absoluteFill, frontMotion]}
              >
                <BadgeCard badge={active} active={!opening && !busy} order={safeIndex} />
              </Animated.View>
            ) : (
              <View style={s.empty}>
                <Text style={s.headerTitle}>Your next win is ahead.</Text>
                <Text style={s.description}>Keep running to earn your first badge.</Text>
              </View>
            )}
          </Animated.View>
        </View>
        <View style={s.footer}>
          <Pressable
            disabled={busy || safeIndex === 0}
            accessibilityRole="button"
            accessibilityLabel="Previous achievement"
            onPress={() => move(-1)}
            style={[s.circle, safeIndex === 0 && s.disabled]}
          >
            <ChevronLeft color="#fff" size={20} />
          </Pressable>
          <View
            accessible
            accessibilityLabel={`Achievement ${visible.length ? safeIndex + 1 : 0} of ${visible.length}`}
          >
            <Text style={s.page}>
              {visible.length ? safeIndex + 1 : 0} / {visible.length}
            </Text>
            <Text style={s.swipeHint}>Swipe {axis === 'vertical' ? 'up' : 'left'} to explore</Text>
          </View>
          <Pressable
            disabled={busy || safeIndex >= visible.length - 1}
            accessibilityRole="button"
            accessibilityLabel="Next achievement"
            onPress={() => move(1)}
            style={[s.circle, safeIndex >= visible.length - 1 && s.disabled]}
          >
            <ChevronRight color="#fff" size={20} />
          </Pressable>
        </View>
      </SafeAreaView>
      {opening && (
        <View pointerEvents="none" style={s.transitionLayer}>
          <Animated.Image
            source={require('../../../../assets/achievements-folder-exact.png')}
            resizeMode="contain"
            style={[{ width: cardWidth, height: cardWidth }, clone]}
          />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  safe: { flex: 1 },
  darken: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(12,17,20,0.7)' },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerCopy: { alignItems: 'center' },
  overTitle: { fontSize: 20, lineHeight: 25, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
  headerTitle: { fontSize: 20, lineHeight: 26, color: '#fff', fontWeight: '600' },
  counter: { marginTop: 7, fontSize: 10, lineHeight: 15, color: '#CBD6D0' },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterActive: { backgroundColor: 'rgba(185,232,218,0.25)' },
  deckArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 64 },
  peek: {
    ...StyleSheet.absoluteFill,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  peekLabel: { color: '#FFF', fontSize: 9, letterSpacing: 2, padding: 14 },
  cardShell: { flex: 1 },
  cardFace: {
    ...StyleSheet.absoluteFill,
    borderRadius: 28,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: '#152329',
  },
  cardTap: { flex: 1, padding: 20 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardEyebrow: { fontSize: 9, lineHeight: 14, letterSpacing: 2, color: '#E1EBE4' },
  smallCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeTitle: {
    fontSize: 29,
    lineHeight: 35,
    letterSpacing: 0.8,
    color: '#F8F3E9',
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 16,
  },
  hero: {
    flex: 1,
    minHeight: 90,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#263638',
  },
  halo: {
    width: 190,
    height: 190,
    maxHeight: '85%',
    aspectRatio: 1,
    borderRadius: 110,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallion: {
    width: 142,
    height: 142,
    maxHeight: '90%',
    borderRadius: 80,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 15 },
    shadowRadius: 20,
  },
  lockSeal: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#192328',
  },
  heroWord: { position: 'absolute', bottom: 16, fontSize: 8, letterSpacing: 1.7 },
  captionPill: {
    marginTop: 16,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignSelf: 'center',
  },
  caption: { color: '#E0E8E1', fontSize: 10, lineHeight: 16, textAlign: 'center' },
  tapHint: { color: '#92A59E', fontSize: 9, textAlign: 'center', marginTop: 12 },
  progress: {
    height: 4,
    borderRadius: 4,
    backgroundColor: '#475356',
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#B4BFBB' },
  glint: {
    position: 'absolute',
    width: 65,
    top: -100,
    bottom: -100,
    left: 0,
    backgroundColor: '#fff',
  },
  details: { padding: 22, flexGrow: 1 },
  description: { color: '#B9C9C2', fontSize: 14, lineHeight: 23, marginTop: 12 },
  rule: { height: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginVertical: 28 },
  detailValue: { color: '#F3F2EC', fontSize: 24, marginTop: 12 },
  share: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
    padding: 15,
    minHeight: 48,
    borderRadius: 30,
    backgroundColor: '#B9E8DA',
    marginTop: 30,
  },
  shareLabel: { color: '#13242A', fontSize: 13, fontWeight: '600' },
  footer: {
    paddingHorizontal: 30,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  page: { color: '#fff', fontSize: 14, textAlign: 'center', fontVariant: ['tabular-nums'] },
  swipeHint: { color: '#B9C8C1', fontSize: 9, marginTop: 4, textAlign: 'center' },
  disabled: { opacity: 0.25 },
  transitionLayer: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, justifyContent: 'center', padding: 24 },
});
