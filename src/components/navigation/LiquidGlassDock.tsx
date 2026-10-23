import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface LiquidGlassTab {
  id: string;
  label: string;
  /** Supply a filled glyph when selected is true. Any React Native icon library works. */
  icon: (props: { color: string; size: number; selected: boolean }) => React.ReactNode;
}
export interface LiquidGlassDockProps {
  tabs: readonly LiquidGlassTab[];
  activeId: string;
  onChange: (id: string) => void;
  /** Android's BlurTargetView ref; omit to use the solid frosted fallback. */
  blurTarget?: React.RefObject<View | null>;
  appearance?: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
}

// TWEAK: physics, optical treatment, and colors are centralized here.
const SPRING = { stiffness: 300, damping: 25, mass: 1 };
const HEIGHT = 64;
const CONTENT_INSET = 6;
// Extra end space keeps the wider capsule centered on the first and last icons.
const HORIZONTAL_INSET = 14;
const LENS_HEIGHT = 52;
const BLUR = 55; // Native blur strength. Web blur and saturation are in the scoped CSS below.
const clamp = (value: number, min: number, max: number) => {
  'worklet';
  return Math.min(max, Math.max(min, value));
};

/** Exported for geometry regression tests; no platform modules are needed by the calculations. */
export function dockGeometry(width: number, count: number, index: number, labelWidth: number) {
  if (width <= 8 || count <= 0) return { center: 0, width: 0, cell: 0 };
  const cell = width / Math.max(1, count);
  const lensWidth = Math.min(width, cell * 1.25, cell + 16, Math.max(68, labelWidth + 30));
  const center = cell * (clamp(index, 0, count - 1) + 0.5);
  return { center, width: lensWidth, cell };
}
export function nearestDockTab(center: number, width: number, count: number) {
  if (width <= 0 || count <= 0) return 0;
  return clamp(Math.floor(center / (width / Math.max(count, 1))), 0, Math.max(0, count - 1));
}

export function dockCoverage(center: number, cell: number, index: number) {
  'worklet';
  if (cell <= 0) return 0;
  return clamp(1 - Math.abs(center - cell * (index + 0.5)) / (cell * 0.85), 0, 1);
}

export function sameDockTarget(
  previous: { center: number; width: number; reduced: boolean },
  next: { center: number; width: number },
  reduced: boolean,
) {
  return (
    previous.reduced === reduced &&
    Math.abs(previous.center - next.center) < 0.1 &&
    Math.abs(previous.width - next.width) < 0.1
  );
}

function useMotionPreference() {
  const initial = useReducedMotion();
  const [reduced, setReduced] = useState(initial);
  useEffect(() => {
    if (Platform.OS === 'web') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      const change = () => setReduced(media.matches);
      change();
      media.addEventListener('change', change);
      return () => media.removeEventListener('change', change);
    }
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}

type DockColors = { inactive: string; active: string; dark: boolean };
const DARK: DockColors = { inactive: '#E4EEF4', active: '#71C5FF', dark: true };
const LIGHT: DockColors = { inactive: '#25313D', active: '#006BE6', dark: false };

/** Gloss only affects the glass surface. Text and glyphs stay in the stationary foreground. */
function Gloss({ lens = false }: { lens?: boolean }) {
  const id = `glass-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View
      pointerEvents="none"
      aria-hidden
      accessibilityElementsHidden
      style={StyleSheet.absoluteFill}
    >
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 76">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0.8" y2="1">
            <Stop stopColor="#FFFFFF" stopOpacity={lens ? 0.24 : 0.16} />
            <Stop offset="0.38" stopColor="#FFFFFF" stopOpacity="0.015" />
            <Stop offset="0.7" stopColor="#D7EDFF" stopOpacity={lens ? 0.05 : 0.02} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={lens ? 0.12 : 0.07} />
          </LinearGradient>
        </Defs>
        <Rect x="0.5" y="0.5" width="399" height="75" rx="38" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

function DockCell({
  tab,
  index,
  cell,
  center,
  reduced,
  colors,
  active,
  focused,
  onSelect,
  onFocus,
  onMeasure,
  buttonRef,
}: {
  tab: LiquidGlassTab;
  index: number;
  cell: number;
  center: SharedValue<number>;
  reduced: boolean;
  colors: DockColors;
  active: boolean;
  focused: boolean;
  onSelect: () => void;
  onFocus: () => void;
  onMeasure: (width: number) => void;
  buttonRef: (view: View | null) => void;
}) {
  const pressed = useSharedValue(1);
  const scaling = useAnimatedStyle(() => ({
    transform: [
      {
        scale: pressed.value * (reduced ? 1 : 1 + dockCoverage(center.value, cell, index) * 0.035),
      },
    ],
  }));
  const inactiveStyle = useAnimatedStyle(() => ({
    opacity: 1 - dockCoverage(center.value, cell, index),
  }));
  const activeStyle = useAnimatedStyle(() => ({
    opacity: dockCoverage(center.value, cell, index),
  }));
  return (
    <Pressable
      ref={buttonRef}
      onPress={onSelect}
      onFocus={onFocus}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: active }}
      nativeID={`liquid-tab-${tab.id}`}
      tabIndex={focused ? 0 : -1}
      style={[styles.cell, { width: cell }]}
      onPressIn={() => pressed.set(reduced ? 1 : withTiming(0.95, { duration: 80 }))}
      onPressOut={() => pressed.set(withTiming(1, { duration: 120 }))}
    >
      <Animated.View
        pointerEvents="none"
        aria-hidden
        accessibilityElementsHidden
        style={[styles.cellContent, scaling]}
      >
        <Animated.View style={[styles.glyphLayer, inactiveStyle]}>
          {tab.icon({ color: colors.inactive, size: 21, selected: false })}
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}
            onLayout={(event) => onMeasure(event.nativeEvent.layout.width)}
            style={[styles.label, { color: colors.inactive }]}
          >
            {tab.label}
          </Text>
        </Animated.View>
        <Animated.View style={[styles.glyphLayer, activeStyle]}>
          {tab.icon({ color: colors.active, size: 21, selected: true })}
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.3}
            style={[styles.label, { color: colors.active, fontWeight: '600' }]}
          >
            {tab.label}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

/** Controlled floating dock. Surface movement never transforms or clips its tab content. */
export function LiquidGlassDock({
  tabs,
  activeId,
  onChange,
  blurTarget,
  appearance = 'light',
  style,
}: LiquidGlassDockProps) {
  const insets = useSafeAreaInsets();
  const viewport = useWindowDimensions();
  const reduced = useMotionPreference();
  const colors = appearance === 'dark' ? DARK : LIGHT;
  const [width, setWidth] = useState(0);
  const [labels, setLabels] = useState<Record<string, number>>({});
  const [focusId, setFocusId] = useState(activeId);
  const center = useSharedValue(0);
  const lensWidth = useSharedValue(68);
  const stretch = useSharedValue(1);
  const fade = useSharedValue(1);
  const initialized = useRef(false);
  const lastTarget = useRef({ center: -1, width: -1, reduced });
  const dragging = useRef(false);
  const dragStart = useRef(0);
  const dragIndex = useRef(-1);
  const webPointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const cells = useRef<Record<string, View | null>>({});
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === activeId),
  );
  const cell = width / Math.max(1, tabs.length);
  const target = dockGeometry(width, tabs.length, activeIndex, labels[tabs[activeIndex]?.id] ?? 32);

  const animateTo = useCallback(
    (next: { center: number; width: number }, force = false) => {
      if (!width) return;
      // A route render or a new icon callback must not restart an in-flight spring.
      if (!force && initialized.current && sameDockTarget(lastTarget.current, next, reduced))
        return;
      lastTarget.current = { ...next, reduced };
      cancelAnimation(center);
      cancelAnimation(lensWidth);
      cancelAnimation(stretch);
      if (!initialized.current || reduced) {
        center.set(next.center);
        lensWidth.set(next.width);
        stretch.set(1);
        fade.set(
          reduced && initialized.current
            ? withSequence(withTiming(0.65, { duration: 50 }), withTiming(1, { duration: 100 }))
            : 1,
        );
      } else {
        center.set(withSpring(next.center, SPRING));
        lensWidth.set(withSpring(next.width, SPRING));
        // TWEAK: only the glass stretches; all labels and glyphs retain their own centers.
        stretch.set(withSequence(withTiming(1.12, { duration: 75 }), withSpring(1, SPRING)));
      }
      initialized.current = true;
    },
    [width, reduced, center, lensWidth, stretch, fade],
  );

  // Place the initial lens before paint, and animate committed navigation exactly once.
  useLayoutEffect(() => {
    if (!dragging.current) animateTo(target);
  });

  const select = (index: number, fromGesture = false) => {
    const tab = tabs[index];
    if (!tab || (suppressClick.current && !fromGesture)) return;
    setFocusId(tab.id);
    if (tab.id === activeId) {
      if (!fromGesture) animateTo(target);
    } else {
      if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => {});
      onChange(tab.id);
    }
  };
  const beginDrag = () => {
    dragging.current = true;
    dragStart.current = center.get();
    dragIndex.current = activeIndex;
    cancelAnimation(center);
    cancelAnimation(lensWidth);
    cancelAnimation(stretch);
    stretch.set(reduced ? 1 : withTiming(1.08, { duration: 80 }));
  };
  const moveDrag = (dx: number) => {
    const next = clamp(dragStart.current + dx, cell / 2, width - cell / 2);
    center.set(next);
    const index = nearestDockTab(next, width, tabs.length);
    if (index !== dragIndex.current) {
      dragIndex.current = index;
      const nextWidth = dockGeometry(width, tabs.length, index, labels[tabs[index].id] ?? 32).width;
      lensWidth.set(reduced ? nextWidth : withSpring(nextWidth, SPRING));
      if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => {});
    }
  };
  const finishDrag = () => {
    dragging.current = false;
    const index = nearestDockTab(center.get(), width, tabs.length);
    animateTo(dockGeometry(width, tabs.length, index, labels[tabs[index].id] ?? 32), true);
    select(index, true);
    if (Platform.OS === 'web')
      (cells.current[tabs[index].id] as (View & { focus?: () => void }) | null)?.focus?.();
  };
  const cancelDrag = () => {
    dragging.current = false;
    animateTo(target, true);
  };
  const pointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick.current = false;
    webPointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };
  const pointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = webPointer.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    if (!dragging.current && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(event.clientY - start.y)) {
      event.currentTarget.setPointerCapture(event.pointerId);
      suppressClick.current = true;
      beginDrag();
    }
    if (dragging.current) {
      event.preventDefault();
      moveDrag(dx);
    }
  };
  const pointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (webPointer.current?.id !== event.pointerId) return;
    webPointer.current = null;
    if (dragging.current) {
      event.preventDefault();
      finishDrag();
    }
  };
  // PanResponder registers callbacks; refs are only read by touch events.
  // eslint-disable-next-line react-hooks/refs
  const pan = PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) =>
      Math.abs(gesture.dx) > 6 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderGrant: beginDrag,
    onPanResponderMove: (_, gesture) => moveDrag(gesture.dx),
    onPanResponderRelease: finishDrag,
    onPanResponderTerminate: cancelDrag,
    onPanResponderTerminationRequest: () => true,
  });
  const keyDown = (event: React.KeyboardEvent) => {
    const focused = Math.max(
      0,
      tabs.findIndex((tab) => tab.id === focusId),
    );
    let next = focused;
    if (event.key === 'ArrowRight') next = (focused + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (focused - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      suppressClick.current = false;
      select(focused);
      return;
    } else return;
    event.preventDefault();
    setFocusId(tabs[next].id);
    (cells.current[tabs[next].id] as (View & { focus?: () => void }) | null)?.focus?.();
  };
  const lensStyle = useAnimatedStyle(() => ({
    left: HORIZONTAL_INSET - 1 + center.value - lensWidth.value / 2,
    width: lensWidth.value,
    opacity: fade.value,
    transform: [
      { scaleX: stretch.value },
      { scaleY: interpolate(stretch.value, [1, 1.12], [1, 0.95]) },
    ],
  }));
  const measure = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const canBlur =
    Platform.OS === 'ios' ||
    (Platform.OS === 'android' && !!blurTarget && Number(Platform.Version) >= 31);
  if (!tabs.length) return null;
  const content = (
    <View
      style={[
        styles.surface,
        !canBlur &&
          Platform.OS !== 'web' && {
            backgroundColor: colors.dark ? 'rgba(24,42,52,0.94)' : 'rgba(250,252,255,0.94)',
          },
      ]}
      {...(Platform.OS === 'web' ? {} : pan.panHandlers)}
    >
      {canBlur && (
        <BlurView
          pointerEvents="none"
          tint={colors.dark ? 'dark' : 'light'}
          intensity={BLUR}
          blurTarget={blurTarget}
          blurMethod={blurTarget ? 'dimezisBlurViewSdk31Plus' : 'none'}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Gloss />
      <View pointerEvents="none" style={styles.topRim} />
      {!!width && (
        <Animated.View
          pointerEvents="none"
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.lens,
            { backgroundColor: colors.dark ? 'rgba(225,244,255,0.075)' : 'rgba(255,255,255,0.22)' },
            lensStyle,
          ]}
        >
          <Gloss lens />
        </Animated.View>
      )}
      <View onLayout={measure} style={styles.row}>
        {!!width &&
          tabs.map((tab, index) => (
            <DockCell
              key={tab.id}
              tab={tab}
              index={index}
              cell={cell}
              center={center}
              reduced={reduced}
              colors={colors}
              active={index === activeIndex}
              focused={
                tab.id === focusId || (!tabs.some((t) => t.id === focusId) && index === activeIndex)
              }
              buttonRef={(view) => {
                cells.current[tab.id] = view;
              }}
              onSelect={() => select(index)}
              onFocus={() => setFocusId(tab.id)}
              onMeasure={(measured) =>
                setLabels((previous) =>
                  previous[tab.id] === measured ? previous : { ...previous, [tab.id]: measured },
                )
              }
            />
          ))}
      </View>
    </View>
  );
  const dockWidth = Math.min(viewport.width - 40, 440);
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.floating,
        { bottom: insets.bottom + 14, width: dockWidth, left: (viewport.width - dockWidth) / 2 },
        style,
      ]}
    >
      {Platform.OS === 'web' ? (
        <>
          {React.createElement(
            'style',
            null,
            `
        .liquid-glass-dock {border-radius:9999px;backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);touch-action:pan-y;user-select:none;-webkit-user-select:none;}
        .liquid-glass-dock[data-appearance=dark] {background:rgba(22,40,50,.16);}
        .liquid-glass-dock[data-appearance=light] {background:rgba(255,255,255,.16);}
        .liquid-glass-dock [role=tab]:focus-visible {outline:2px solid ${colors.active};outline-offset:-5px;border-radius:9999px;}
        @supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))) {.liquid-glass-dock[data-appearance=light]{background:rgba(250,252,255,.94);}.liquid-glass-dock[data-appearance=dark]{background:rgba(24,42,52,.94);}}
      `,
          )}
          <div
            role="tablist"
            aria-label="Main navigation"
            className="liquid-glass-dock"
            data-appearance={appearance}
            onKeyDown={keyDown}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerCancel={() => {
              webPointer.current = null;
              cancelDrag();
            }}
            onLostPointerCapture={() => {
              if (dragging.current) {
                webPointer.current = null;
                cancelDrag();
              }
            }}
            onClickCapture={(event) => {
              if (suppressClick.current) {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
          >
            {content}
          </div>
        </>
      ) : (
        <View accessibilityRole="tablist">{content}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  floating: {
    position: 'absolute',
    zIndex: 100,
    shadowColor: '#000000',
    shadowOpacity: 0.17,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
  },
  surface: {
    height: HEIGHT,
    paddingVertical: CONTENT_INSET - 1,
    paddingHorizontal: HORIZONTAL_INSET - 1,
    borderRadius: 9999,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(232,246,255,0.24)',
    borderTopColor: 'rgba(255,255,255,0.48)',
    overflow: 'hidden',
  },
  topRim: {
    position: 'absolute',
    left: 22,
    right: 22,
    top: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  row: { height: LENS_HEIGHT, flexDirection: 'row', alignSelf: 'stretch', zIndex: 2 },
  cell: { height: LENS_HEIGHT, alignItems: 'center', justifyContent: 'center', minWidth: 0 },
  cellContent: { width: '100%', height: 44 },
  glyphLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: { fontSize: 11, lineHeight: 14, letterSpacing: -0.1, fontWeight: '500' },
  lens: {
    position: 'absolute',
    top: CONTENT_INSET - 1,
    height: LENS_HEIGHT,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(243,250,255,0.6)',
    borderBottomColor: 'rgba(220,240,255,0.24)',
    overflow: 'hidden',
    zIndex: 1,
  },
});
