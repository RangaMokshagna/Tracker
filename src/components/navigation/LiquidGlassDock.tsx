import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
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
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { SkImage } from '@shopify/react-native-skia';
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
  style?: StyleProp<ViewStyle>;
}

// TWEAK: physics, optical treatment, and colors are centralized here.
const SPRING = { stiffness: 300, damping: 25, mass: 1 };
const BLUE = '#007AFF';
const INK = '#202126';
const HEIGHT = 74;
const LENS_HEIGHT = 64;
const BLUR = 100; // expo-blur web: 100 → 20px blur + 180% saturation.
const clamp = (value: number, min: number, max: number) => {
  'worklet';
  return Math.min(max, Math.max(min, value));
};

/** Exported for geometry regression tests; no platform modules are needed by the calculations. */
export function dockGeometry(width: number, count: number, index: number, labelWidth: number) {
  if (width <= 8 || count <= 0) return { center: 0, width: 0, cell: 0 };
  const cell = width / Math.max(1, count);
  const lensWidth = Math.min(Math.max(0, width - 8), cell * 1.3, Math.max(60, labelWidth + 34));
  const center = clamp(cell * (index + 0.5), lensWidth / 2 + 4, width - lensWidth / 2 - 4);
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

type CellProps = {
  tab: LiquidGlassTab;
  index: number;
  cell: number;
  center: SharedValue<number>;
  blue?: boolean;
  reduced: boolean;
  active: boolean;
  focused: boolean;
  onPress: () => void;
  onFocus: () => void;
  onMeasure?: (width: number) => void;
  buttonRef?: (view: View | null) => void;
};
function DockCell({
  tab,
  index,
  cell,
  center,
  blue = false,
  reduced,
  active,
  focused,
  onPress,
  onFocus,
  onMeasure,
  buttonRef,
}: CellProps) {
  const pressed = useSharedValue(1);
  const animated = useAnimatedStyle(() => {
    const coverage = dockCoverage(center.value, cell, index);
    return {
      opacity: blue ? 1 : 1 - coverage,
      transform: [{ scale: pressed.value * (reduced ? 1 : 1 + coverage * 0.065) }],
    };
  });
  const content = (
    <>
      {tab.icon({ color: blue ? BLUE : INK, size: 24, selected: blue })}
      <Text
        numberOfLines={1}
        onLayout={onMeasure ? (e) => onMeasure(e.nativeEvent.layout.width) : undefined}
        style={[styles.label, { color: blue ? BLUE : INK, fontWeight: blue ? '600' : '500' }]}
      >
        {tab.label}
      </Text>
    </>
  );
  if (blue)
    return (
      <Animated.View style={[styles.cell, { width: cell }, animated]}>{content}</Animated.View>
    );
  return (
    <Pressable
      ref={buttonRef}
      onPress={onPress}
      onFocus={onFocus}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: active }}
      nativeID={`liquid-tab-${tab.id}`}
      tabIndex={focused ? 0 : -1}
      onPressIn={() => pressed.set(reduced ? 1 : withTiming(0.95, { duration: 80 }))}
      onPressOut={() => pressed.set(withTiming(1, { duration: 140 }))}
      style={[styles.cell, { width: cell }]}
    >
      <Animated.View style={[styles.cellContent, animated]}>{content}</Animated.View>
    </Pressable>
  );
}

// Native SkSL: sample the actual tab row, refract it, and separate color channels in motion.
// Native Skia is loaded only on native. Web never loads CanvasKit or its WASM runtime.
const SKSL = `
uniform shader content;
uniform float2 size;
uniform float origin;
uniform float movement;
half4 main(float2 p) {
  float2 n = (p - size * 0.5) / max(size * 0.5, float2(1));
  float bulge = max(0.0, 1.0 - dot(n,n));
  float2 uv = float2(origin + p.x, p.y);
  uv -= n * bulge * (0.45 + 1.8 * movement);
  uv.x += sin(p.y * 0.18) * movement * 1.6;
  half4 c = content.eval(uv);
  half4 a = content.eval(uv + float2(movement * 1.8, 0));
  half4 b = content.eval(uv - float2(movement * 1.8, 0));
  return half4(a.r, c.g, b.b, max(c.a, max(a.a, b.a)));
}`;

function NativeRefraction({
  sourceRef,
  rowWidth,
  center,
  lensWidth,
  motion,
}: {
  sourceRef: React.RefObject<View | null>;
  rowWidth: number;
  center: SharedValue<number>;
  lensWidth: SharedValue<number>;
  motion: SharedValue<number>;
}) {
  const [snapshot, setSnapshot] = useState<SkImage | null>(null);
  // Native-only loading prevents CanvasKit/WASM initialization on web.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const skia = require('@shopify/react-native-skia') as typeof import('@shopify/react-native-skia');
  const [shader] = useState(() => skia.Skia.RuntimeEffect.Make(SKSL));
  useEffect(() => {
    let alive = true;
    // Capture the full, blue row, not a screen image; the enclosing lens clips it on screen.
    const frame = requestAnimationFrame(() => {
      if (!sourceRef.current) return;
      void skia
        .makeImageFromView(sourceRef)
        .then((image) => {
          if (alive) setSnapshot(image);
        })
        .catch(() => {
          /* Live vector row remains as the graceful fallback. */
        });
    });
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
    };
  }, [sourceRef, rowWidth, skia]);
  const uniforms = useDerivedValue(() => ({
    size: [lensWidth.value, LENS_HEIGHT],
    origin: center.value - lensWidth.value / 2,
    movement: motion.value,
  }));
  const opacity = useAnimatedStyle(() => ({ opacity: snapshot ? motion.value : 0 }));
  if (!snapshot || !shader) return null;
  const { Canvas, Fill, Shader, ImageShader } = skia;
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, opacity]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill>
          <Shader source={shader} uniforms={uniforms}>
            <ImageShader
              image={snapshot}
              fit="fill"
              rect={{ x: 0, y: 0, width: rowWidth, height: LENS_HEIGHT }}
              tx="clamp"
              ty="clamp"
            />
          </Shader>
        </Fill>
      </Canvas>
    </Animated.View>
  );
}

// Self-contained browser fallback styles and SVG optical filter definitions.
function WebOptics({ id }: { id: string }) {
  if (Platform.OS !== 'web') return null;
  return (
    <>
      {React.createElement(
        'style',
        null,
        `
      .liquid-glass-dock { background: rgba(255,255,255,.7); backdrop-filter:blur(20px) saturate(180%); -webkit-backdrop-filter:blur(20px) saturate(180%); touch-action:pan-y; user-select:none; -webkit-user-select:none; }
      .liquid-glass-dock [role=tab]:focus-visible { outline:2px solid #007AFF; outline-offset:-5px; border-radius:9999px; }
      @supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))) { .liquid-glass-dock { background:rgba(255,255,255,.94); } }
      @media (prefers-reduced-motion:reduce) { .liquid-glass-dock * { scroll-behavior:auto; } }
    `,
      )}
      {React.createElement(
        'svg',
        { width: 0, height: 0, 'aria-hidden': true, style: { position: 'absolute' } },
        React.createElement(
          'defs',
          null,
          React.createElement(
            'filter',
            {
              id,
              x: '-20%',
              y: '-30%',
              width: '140%',
              height: '160%',
              colorInterpolationFilters: 'sRGB',
            },
            React.createElement('feTurbulence', {
              type: 'fractalNoise',
              baseFrequency: '0.018 0.045',
              numOctaves: 1,
              seed: 4,
              result: 'noise',
            }),
            React.createElement('feDisplacementMap', {
              in: 'SourceGraphic',
              in2: 'noise',
              scale: 7,
              xChannelSelector: 'R',
              yChannelSelector: 'G',
              result: 'bent',
            }),
            React.createElement('feGaussianBlur', {
              in: 'bent',
              stdDeviation: '0.45 0.15',
              result: 'soft',
            }),
            React.createElement('feOffset', { in: 'soft', dx: 1.5, result: 'fringe' }),
            React.createElement('feColorMatrix', {
              in: 'fringe',
              type: 'matrix',
              values: '0.4 0 0 0 0  0 0.8 0 0 0  0 0 1 0 0.05  0 0 0 0.35 0',
              result: 'blue',
            }),
            React.createElement(
              'feMerge',
              null,
              React.createElement('feMergeNode', { in: 'blue' }),
              React.createElement('feMergeNode', { in: 'soft' }),
            ),
          ),
        ),
      )}
    </>
  );
}

/** Controlled floating dock. Place after the screen content inside a positioned parent. */
export function LiquidGlassDock({
  tabs,
  activeId,
  onChange,
  blurTarget,
  style,
}: LiquidGlassDockProps) {
  const insets = useSafeAreaInsets();
  const viewport = useWindowDimensions();
  const reduced = useMotionPreference();
  const [width, setWidth] = useState(0);
  const [labels, setLabels] = useState<Record<string, number>>({});
  const [focusId, setFocusId] = useState(activeId);
  const center = useSharedValue(0);
  const lensWidth = useSharedValue(64);
  const motion = useSharedValue(0);
  const stretch = useSharedValue(1);
  const fade = useSharedValue(1);
  const initialized = useRef(false);
  const dragging = useRef(false);
  const dragStart = useRef(0);
  const dragIndex = useRef(-1);
  const webPointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const cells = useRef<Record<string, View | null>>({});
  const sourceRef = useRef<View>(null);
  const filterId = `dock-optics-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === activeId),
  );
  const cell = width / Math.max(1, tabs.length);
  const target = dockGeometry(width, tabs.length, activeIndex, labels[tabs[activeIndex]?.id] ?? 32);

  const animateTo = useCallback(
    (index: number) => {
      const tab = tabs[index];
      if (!tab || !width) return;
      const next = dockGeometry(width, tabs.length, index, labels[tab.id] ?? 32);
      cancelAnimation(center);
      cancelAnimation(stretch);
      cancelAnimation(motion);
      if (reduced || !initialized.current) {
        center.set(next.center);
        lensWidth.set(next.width);
        motion.set(0);
        stretch.set(1);
        fade.set(
          reduced
            ? withSequence(withTiming(0.55, { duration: 60 }), withTiming(1, { duration: 100 }))
            : 1,
        );
      } else {
        motion.set(1);
        stretch.set(withSequence(withTiming(1.22, { duration: 85 }), withSpring(1, SPRING)));
        center.set(
          withSpring(next.center, SPRING, (finished) => {
            if (finished) motion.set(withTiming(0, { duration: 120 }));
          }),
        );
        lensWidth.set(withSpring(next.width, SPRING));
      }
      initialized.current = true;
    },
    [tabs, width, labels, reduced, center, lensWidth, motion, stretch, fade],
  );
  useEffect(() => {
    if (!dragging.current) animateTo(activeIndex);
  }, [activeIndex, target.center, target.width, animateTo]);

  const select = useCallback(
    (index: number, fromGesture = false) => {
      const tab = tabs[index];
      if (!tab || (suppressClick.current && !fromGesture)) return;
      setFocusId(tab.id);
      animateTo(index);
      if (tab.id !== activeId) {
        if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => {});
        onChange(tab.id);
      }
    },
    [tabs, activeId, onChange, animateTo],
  );

  const beginDrag = () => {
    dragging.current = true;
    dragStart.current = center.get();
    dragIndex.current = activeIndex;
    cancelAnimation(center);
    cancelAnimation(stretch);
    cancelAnimation(motion);
    motion.set(reduced ? 0 : 1);
    stretch.set(reduced ? 1 : withTiming(1.16, { duration: 90 }));
  };
  const moveDrag = (dx: number) => {
    const next = clamp(
      dragStart.current + dx,
      4 + lensWidth.get() / 2,
      width - 4 - lensWidth.get() / 2,
    );
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
    select(index, true);
    if (Platform.OS === 'web') (cells.current[tabs[index].id] as (View & { focus?: () => void }) | null)?.focus?.();
  };
  const cancelDrag = () => {
    dragging.current = false;
    animateTo(activeIndex);
  };
  // DOM pointer capture handles mouse, pen, and touch without selecting label text.
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

  // PanResponder stores these callbacks; ref reads happen on gestures, never during render.
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

  const lensStyle = useAnimatedStyle(() => ({
    left: center.value - lensWidth.value / 2,
    width: lensWidth.value,
    opacity: fade.value,
    transform: [
      { scaleX: stretch.value },
      { scaleY: interpolate(stretch.value, [1, 1.22], [1, 0.92]) },
    ],
  }));
  const counterTranslate = useAnimatedStyle(() => ({
    transform: [{ translateX: -(center.value - lensWidth.value / 2) }],
  }));
  const smear = useAnimatedStyle(() => ({ opacity: reduced ? 0 : motion.value }));
  const blueRow = (capture = false) => (
    <View
      ref={capture ? sourceRef : undefined}
      collapsable={false}
      style={[styles.row, { width, height: LENS_HEIGHT }]}
    >
      {tabs.map((tab, index) => (
        <DockCell
          key={tab.id}
          tab={tab}
          index={index}
          cell={cell}
          center={center}
          blue
          reduced={reduced}
          active={false}
          focused={false}
          onPress={() => {}}
          onFocus={() => {}}
        />
      ))}
    </View>
  );
  const measure = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
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

  if (!tabs.length) return null;
  const content = (
    <View
      onLayout={measure}
      {...(Platform.OS === 'web' ? {} : pan.panHandlers)}
      style={styles.surface}
    >
      {Platform.OS !== 'web' && (
        <BlurView
          pointerEvents="none"
          tint="light"
          intensity={BLUR}
          blurTarget={blurTarget}
          blurMethod={blurTarget ? 'dimezisBlurViewSdk31Plus' : 'none'}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View pointerEvents="none" style={styles.topRim} />
      <View style={styles.row}>
        {tabs.map((tab, index) => (
          <DockCell
            key={tab.id}
            tab={tab}
            index={index}
            cell={cell}
            center={center}
            reduced={reduced}
            active={index === activeIndex}
            focused={
              tab.id === focusId || (!tabs.some((t) => t.id === focusId) && index === activeIndex)
            }
            buttonRef={(view) => {
              cells.current[tab.id] = view;
            }}
            onPress={() => select(index)}
            onFocus={() => setFocusId(tab.id)}
            onMeasure={(measured) =>
              setLabels((previous) =>
                previous[tab.id] === measured ? previous : { ...previous, [tab.id]: measured },
              )
            }
          />
        ))}
      </View>
      {!!width && (
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          aria-hidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.lens, lensStyle]}
        >
          <View style={styles.lensHighlight} />
          <Animated.View style={[styles.counterRow, { width }, counterTranslate]}>
            {blueRow(true)}
          </Animated.View>
          {Platform.OS === 'web' ? (
            <Animated.View
              style={[
                styles.counterRow,
                { width },
                counterTranslate,
                smear,
                { filter: `url(#${filterId})` } as ViewStyle,
              ]}
            >
              {blueRow()}
            </Animated.View>
          ) : (
            !reduced && (
              <NativeRefraction
                key={tabs.map((tab) => `${tab.id}:${tab.label}`).join('|')}
                sourceRef={sourceRef}
                rowWidth={width}
                center={center}
                lensWidth={lensWidth}
                motion={motion}
              />
            )
          )}
        </Animated.View>
      )}
    </View>
  );

  const dockWidth = Math.min(viewport.width - 32, 520);
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.floating,
        { bottom: insets.bottom + 14, width: dockWidth, left: (viewport.width - dockWidth) / 2 },
        style,
      ]}
    >
      <WebOptics id={filterId} />
      {Platform.OS === 'web' ? (
        React.createElement(
          'div',
          {
            role: 'tablist',
            'aria-label': 'Main navigation',
            className: 'liquid-glass-dock',
            onKeyDown: keyDown,
            onPointerDown: pointerDown,
            onPointerMove: pointerMove,
            onPointerUp: pointerUp,
            onPointerCancel: () => {
              webPointer.current = null;
              cancelDrag();
            },
            onLostPointerCapture: () => {
              if (dragging.current) {
                webPointer.current = null;
                cancelDrag();
              }
            },
            onClickCapture: (event: React.MouseEvent) => {
              if (suppressClick.current) {
                event.preventDefault();
                event.stopPropagation();
              }
            },
            style: { borderRadius: 9999 },
          },
          content,
        )
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
    shadowColor: '#283345',
    shadowOpacity: 0.13,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  surface: {
    height: HEIGHT,
    borderRadius: 9999,
    backgroundColor: Platform.OS === 'web' ? 'transparent' : 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(200,206,215,0.65)',
    overflow: 'hidden',
  },
  topRim: {
    position: 'absolute',
    left: 17,
    right: 17,
    top: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  row: { flexDirection: 'row', height: HEIGHT - 2, alignItems: 'center' },
  cell: {
    height: LENS_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minWidth: 0,
  },
  cellContent: { alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 11, lineHeight: 14, letterSpacing: -0.15 },
  lens: {
    position: 'absolute',
    top: 4,
    height: LENS_HEIGHT,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.98)',
    borderBottomColor: 'rgba(185,195,213,0.65)',
    overflow: 'hidden',
    shadowColor: '#758394',
    shadowOpacity: 0.24,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  lensHighlight: {
    position: 'absolute',
    top: 1,
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  counterRow: { position: 'absolute', left: 0, top: 0, height: LENS_HEIGHT },
});
