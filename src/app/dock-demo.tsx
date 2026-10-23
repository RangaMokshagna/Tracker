import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurTargetView } from 'expo-blur';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { ArrowLeft, ArrowUpRight, Star } from 'lucide-react-native';
import { LiquidGlassDock, type LiquidGlassTab } from '../components/navigation/LiquidGlassDock';

const TABS: readonly LiquidGlassTab[] = [
  {
    id: 'today',
    label: 'Today',
    icon: ({ color, size, selected }) => (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect
          x="5"
          y="2.5"
          width="14"
          height="19"
          rx="2"
          fill={selected ? color : 'none'}
          stroke={color}
          strokeWidth="1.8"
        />
        <Path
          d="M9 7h6M9 11h6M9 15h4"
          stroke={selected ? 'white' : color}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </Svg>
    ),
  },
  {
    id: 'games',
    label: 'Games',
    icon: ({ color, size, selected }) => (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d="M9 15 6 18l-1-5 3-4c3-5 8-7 13-7 0 5-2 10-7 13l-4 3-5-1 3-3M6 18l-3 3"
          fill={selected ? color : 'none'}
          stroke={color}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <Circle cx="15.5" cy="7.5" r="2" fill={selected ? 'white' : color} />
      </Svg>
    ),
  },
  {
    id: 'apps',
    label: 'Apps',
    icon: ({ color, size, selected }) => (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d="m12 2 10 5-10 5L2 7Z"
          fill={selected ? color : 'none'}
          stroke={color}
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <Path
          d="m2 12 10 5 10-5M2 17l10 5 10-5"
          fill="none"
          stroke={color}
          strokeWidth={selected ? 2.5 : 1.7}
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  {
    id: 'arcade',
    label: 'Arcade',
    icon: ({ color, size, selected }) => (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d="m12 11 10 6-10 5-10-5Z"
          fill={selected ? color : 'none'}
          stroke={color}
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <Path d="M12 6v9" stroke={selected ? 'white' : color} strokeWidth="2.2" />
        <Circle cx="12" cy="4" r="2.5" fill={color} />
        <Circle cx="17" cy="16.5" r="1.3" fill={selected ? 'white' : color} />
      </Svg>
    ),
  },
  {
    id: 'search',
    label: 'Search',
    icon: ({ color, size, selected }) => (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="10" cy="10" r="7" fill="none" stroke={color} strokeWidth={selected ? 3 : 1.8} />
        <Path
          d="m15.5 15.5 6 6"
          stroke={color}
          strokeWidth={selected ? 3.5 : 2}
          strokeLinecap="round"
        />
      </Svg>
    ),
  },
];
const STORIES: Record<
  string,
  { eyebrow: string; title: string; detail: string; color: string; mark: string }
> = {
  today: {
    eyebrow: 'THE DAILY EDIT',
    title: 'Small discoveries.\nExtraordinary days.',
    detail: 'A fresh perspective, every day.',
    color: '#D9E8F5',
    mark: '✳',
  },
  games: {
    eyebrow: 'PRESS PLAY',
    title: 'A whole world\nof possibility.',
    detail: 'Make a little room for adventure.',
    color: '#E4DDF8',
    mark: '✦',
  },
  apps: {
    eyebrow: 'MAKE IT YOURS',
    title: 'Good ideas.\nBeautifully made.',
    detail: 'Find your next everyday essential.',
    color: '#DBECE2',
    mark: '◎',
  },
  arcade: {
    eyebrow: 'PLAY WITHOUT LIMITS',
    title: 'Your next\ngreat escape.',
    detail: 'A little wonder goes a long way.',
    color: '#F4DCCF',
    mark: '◈',
  },
  search: {
    eyebrow: 'FOLLOW YOUR CURIOSITY',
    title: 'Something new\nis waiting for you.',
    detail: 'Discover what moves you.',
    color: '#DCE5FA',
    mark: '⌕',
  },
};

/** Standalone interaction demo: /dock-demo. The dock itself has no demo dependencies. */
export default function DockDemo() {
  const [activeId, setActiveId] = useState('today');
  const target = useRef<React.ComponentRef<typeof View>>(null);
  const story = STORIES[activeId];
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <BlurTargetView ref={target} style={StyleSheet.absoluteFill}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Pressable
                onPress={() => router.replace('/(tabs)')}
                accessibilityRole="button"
                accessibilityLabel="Back to STRIDE"
                style={styles.back}
              >
                <ArrowLeft size={21} color="#28374B" />
              </Pressable>
              <Text style={styles.brand}>GLASS / PLAYGROUND</Text>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>A</Text>
              </View>
            </View>
            <View
              nativeID={`dock-panel-${activeId}`}
              role="tabpanel"
              aria-labelledby={`liquid-tab-${activeId}`}
            >
              <Text style={styles.eyebrow}>{story.eyebrow}</Text>
              <Text style={styles.title}>{story.title}</Text>
              <Text style={styles.subtitle}>{story.detail}</Text>
              <View style={[styles.feature, { backgroundColor: story.color }]}>
                <View style={styles.orbitOne} />
                <View style={styles.orbitTwo} />
                <Text style={styles.symbol}>{story.mark}</Text>
                <View style={styles.featureBottom}>
                  <View>
                    <Text style={styles.cardEyebrow}>CURATED FOR YOU</Text>
                    <Text style={styles.cardTitle}>A sense of possibility.</Text>
                  </View>
                  <ArrowUpRight size={24} color="#344663" />
                </View>
              </View>
              <View style={styles.note}>
                <View style={styles.star}>
                  <Star size={20} color="#69799F" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.noteTitle}>Find your next favorite</Text>
                  <Text style={styles.noteBody}>Tap a tab, or slide the glass lens.</Text>
                </View>
              </View>
              {[0, 1, 2].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.previewCard,
                    { backgroundColor: ['#E4E5F4', '#E0ECE7', '#F2E3DB'][index] },
                  ]}
                >
                  <Text style={styles.previewTitle}>
                    {
                      ['Made for your everyday.', 'A new way to play.', 'Explore a little more.'][
                        index
                      ]
                    }
                  </Text>
                  <ArrowUpRight color="#68778F" size={20} />
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </BlurTargetView>
      <LiquidGlassDock tabs={TABS} activeId={activeId} onChange={setActiveId} blurTarget={target} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F7FB' },
  content: { padding: 24, paddingBottom: 135, width: '100%', maxWidth: 560, alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 24,
    backgroundColor: '#E9EDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { color: '#6F7A91', fontSize: 10, letterSpacing: 2 },
  avatar: {
    width: 36,
    height: 36,
    backgroundColor: '#DEE4F3',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#637593', fontSize: 14, fontWeight: '600' },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    color: '#647692',
    marginBottom: 12,
  },
  title: { fontSize: 35, lineHeight: 40, letterSpacing: -1.6, color: '#24334A', fontWeight: '500' },
  subtitle: { fontSize: 15, lineHeight: 23, color: '#738097', marginTop: 14, marginBottom: 26 },
  feature: {
    height: 300,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  orbitOne: {
    width: 290,
    height: 290,
    borderRadius: 160,
    borderWidth: 35,
    borderColor: 'rgba(255,255,255,0.3)',
    position: 'absolute',
    right: -80,
    top: -100,
  },
  orbitTwo: {
    width: 270,
    height: 270,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    position: 'absolute',
    left: -100,
    top: 65,
  },
  symbol: { fontSize: 120, lineHeight: 165, color: '#FFFFFF', textAlign: 'center', marginTop: 10 },
  featureBottom: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardEyebrow: { fontSize: 9, color: '#667893', letterSpacing: 2, marginBottom: 6 },
  cardTitle: { fontSize: 21, color: '#344663', fontWeight: '500', letterSpacing: -0.6 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 25 },
  star: {
    width: 46,
    height: 46,
    backgroundColor: '#E9EDF6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteTitle: { fontSize: 15, color: '#344663', fontWeight: '500' },
  noteBody: { fontSize: 12, color: '#768299', marginTop: 5 },
  previewCard: {
    borderRadius: 24,
    height: 100,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewTitle: { fontSize: 18, color: '#52617A', fontWeight: '500', letterSpacing: -0.5 },
});
