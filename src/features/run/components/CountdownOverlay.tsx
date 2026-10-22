/**
 * STRIDE — 3-2-1 Pre-Run Countdown Overlay
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Text } from '../../../components/ui';
import { palette } from '../../../theme/tokens';
import { useHaptics } from '../../../hooks/useHaptics';

interface CountdownOverlayProps {
  count: number;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ count }) => {
  const haptics = useHaptics();
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);

  useEffect(() => {
    haptics.heavy();
    scale.value = 0.4;
    opacity.value = 0;

    scale.value = withSpring(1.2, { damping: 10, stiffness: 140 });
    opacity.value = withTiming(1, { duration: 200 });
  }, [count]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.numberCircle, animatedStyle]}>
        <Text style={styles.countText}>{count > 0 ? count : 'GO!'}</Text>
      </Animated.View>
      <Text variant="caption" color="dark300" style={styles.tipText}>
        GET READY TO STRIDE
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0A0A0A',
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: palette.lime,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(191, 255, 0, 0.08)',
    shadowColor: palette.lime,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 12,
  },
  countText: {
    fontSize: 72,
    fontWeight: '900',
    color: palette.lime,
    letterSpacing: -1,
  },
  tipText: {
    letterSpacing: 2,
    marginTop: 32,
    fontWeight: '700',
  },
});
