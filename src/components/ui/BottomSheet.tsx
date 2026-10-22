/**
 * STRIDE — BottomSheet Component
 *
 * Gesture-driven bottom sheet with snap points, glass background,
 * handle bar indicator, and backdrop overlay.
 */

import React, { useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useTheme, borderRadius, animations, shadows, spacing } from '../../theme';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BottomSheetRef {
  /** Open the sheet to the given snap index (0 = first snap point) */
  snapTo: (index: number) => void;
  /** Close the sheet */
  close: () => void;
}

export interface BottomSheetProps {
  /** Snap point heights in pixels from the bottom */
  snapPoints: number[];
  /** Called when the sheet is fully closed */
  onClose?: () => void;
  /** Called when snap index changes */
  onSnap?: (index: number) => void;
  /** Whether the sheet is initially open */
  initialSnap?: number;
  /** Show backdrop overlay */
  showBackdrop?: boolean;
  /** Allow closing by tapping backdrop */
  closeOnBackdrop?: boolean;
  /** Content */
  children: React.ReactNode;
  /** Container style for the sheet content */
  style?: StyleProp<ViewStyle>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SCREEN_HEIGHT = Dimensions.get('window').height;
const HANDLE_HEIGHT = 24;
const OVERDRAG = 40;

// ─── Component ───────────────────────────────────────────────────────────────

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  function BottomSheet(
    {
      snapPoints,
      onClose,
      onSnap,
      initialSnap = -1,
      showBackdrop = true,
      closeOnBackdrop = true,
      children,
      style,
    },
    ref,
  ) {
    const { colors } = useTheme();

    // translateY: 0 = fully open (at largest snap), SCREEN_HEIGHT = fully closed
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const context = useSharedValue({ y: 0 });
    const activeSnap = useSharedValue(-1);

    // Sort snap points ascending (smallest first)
    const sortedSnaps = [...snapPoints].sort((a, b) => a - b);

    const snapToIndex = useCallback(
      (index: number) => {
        'worklet';
        if (index < 0 || index >= sortedSnaps.length) {
          // Close
          translateY.value = withSpring(SCREEN_HEIGHT, animations.sheet);
          activeSnap.value = -1;
          if (onClose) runOnJS(onClose)();
          return;
        }
        const snapHeight = sortedSnaps[index];
        const target = SCREEN_HEIGHT - snapHeight;
        translateY.value = withSpring(target, animations.sheet);
        activeSnap.value = index;
        if (onSnap) runOnJS(onSnap)(index);
      },
      [sortedSnaps, onClose, onSnap],
    );

    const close = useCallback(() => {
      translateY.value = withSpring(SCREEN_HEIGHT, animations.sheet);
      activeSnap.value = -1;
      onClose?.();
    }, [onClose]);

    useImperativeHandle(ref, () => ({
      snapTo: (index: number) => {
        if (index < 0) {
          close();
        } else {
          const snapHeight = sortedSnaps[index] ?? sortedSnaps[0];
          const target = SCREEN_HEIGHT - snapHeight;
          translateY.value = withSpring(target, animations.sheet);
          activeSnap.value = index;
          onSnap?.(index);
        }
      },
      close,
    }));

    // Open to initial snap if specified
    useEffect(() => {
      if (initialSnap >= 0 && initialSnap < sortedSnaps.length) {
        const target = SCREEN_HEIGHT - sortedSnaps[initialSnap];
        translateY.value = withSpring(target, animations.sheet);
        activeSnap.value = initialSnap;
      }
    }, []);

    // ── Pan Gesture ──

    const panGesture = Gesture.Pan()
      .onStart(() => {
        context.value = { y: translateY.value };
      })
      .onUpdate((event) => {
        const maxOpen = SCREEN_HEIGHT - sortedSnaps[sortedSnaps.length - 1] - OVERDRAG;
        translateY.value = Math.max(
          maxOpen,
          context.value.y + event.translationY,
        );
      })
      .onEnd((event) => {
        // If dragged down fast → close
        if (event.velocityY > 500) {
          translateY.value = withSpring(SCREEN_HEIGHT, animations.sheet);
          activeSnap.value = -1;
          if (onClose) runOnJS(onClose)();
          return;
        }

        // Find the nearest snap point
        const currentPos = SCREEN_HEIGHT - translateY.value;
        let nearestIndex = 0;
        let nearestDist = Math.abs(currentPos - sortedSnaps[0]);

        for (let i = 1; i < sortedSnaps.length; i++) {
          const dist = Math.abs(currentPos - sortedSnaps[i]);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestIndex = i;
          }
        }

        // If below smallest snap and moving down → close
        if (currentPos < sortedSnaps[0] * 0.5) {
          translateY.value = withSpring(SCREEN_HEIGHT, animations.sheet);
          activeSnap.value = -1;
          if (onClose) runOnJS(onClose)();
        } else {
          const target = SCREEN_HEIGHT - sortedSnaps[nearestIndex];
          translateY.value = withSpring(target, animations.sheet);
          activeSnap.value = nearestIndex;
          if (onSnap) runOnJS(onSnap)(nearestIndex);
        }
      });

    // ── Animated Styles ──

    const sheetAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const backdropAnimatedStyle = useAnimatedStyle(() => {
      const maxSnap = sortedSnaps[sortedSnaps.length - 1];
      const openPosition = SCREEN_HEIGHT - maxSnap;

      const opacity = interpolate(
        translateY.value,
        [SCREEN_HEIGHT, openPosition],
        [0, 1],
        Extrapolation.CLAMP,
      );

      return {
        opacity,
        pointerEvents: opacity > 0.01 ? 'auto' as const : 'none' as const,
      };
    });

    return (
      <>
        {/* Backdrop */}
        {showBackdrop && (
          <Animated.View
            style={[styles.backdrop, { backgroundColor: colors.backdrop }, backdropAnimatedStyle]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={closeOnBackdrop ? close : undefined}
              accessibilityLabel="Close sheet"
              accessibilityRole="button"
            />
          </Animated.View>
        )}

        {/* Sheet */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                borderTopLeftRadius: borderRadius.xxl,
                borderTopRightRadius: borderRadius.xxl,
                borderWidth: 1,
                borderBottomWidth: 0,
                borderColor: colors.glassBorder,
                ...shadows.sheet,
              },
              sheetAnimatedStyle,
              style,
            ]}
          >
            {/* Handle */}
            <View style={styles.handleContainer} accessibilityLabel="Drag handle">
              <View
                style={[
                  styles.handle,
                  { backgroundColor: colors.textTertiary },
                ]}
              />
            </View>

            {/* Content */}
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </GestureDetector>
      </>
    );
  },
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: SCREEN_HEIGHT,
    zIndex: 101,
  },
  handleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: HANDLE_HEIGHT,
    paddingTop: spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
});
