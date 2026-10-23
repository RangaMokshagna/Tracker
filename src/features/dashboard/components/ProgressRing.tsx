/**
 * STRIDE — Hero Animated Progress Ring
 *
 * Uses react-native-svg + react-native-reanimated for a 60fps
 * Apple Watch / Nike Run Club style glowing progress ring.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Text } from '../../../components/ui';
import { palette } from '../../../theme/tokens';
import { formatDistance } from '../../../utils/distance';
import type { UnitPreference } from '../../../types/user';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  currentMeters: number;
  goalMeters: number;
  unit: UnitPreference;
  size?: number;
  strokeWidth?: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  currentMeters,
  goalMeters,
  unit,
  size = 260,
  strokeWidth = 20,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = Math.min(1.0, goalMeters > 0 ? currentMeters / goalMeters : 0);
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - animatedProgress.value);
    return {
      strokeDashoffset,
    };
  });

  const percent = Math.round(progress * 100);
  const formattedCurrent = formatDistance(currentMeters, unit);
  const formattedGoal = formatDistance(goalMeters, unit);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="limeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#E5F5E9" />
            <Stop offset="100%" stopColor="#B9E8DA" />
          </LinearGradient>
        </Defs>

        {/* Background track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Animated Neon Lime Progress Ring */}
        {Platform.OS === 'web' ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#limeGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#limeGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          fill="none"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />}
      </Svg>

      {/* Center Metrics Display */}
      <View style={styles.centerContent} pointerEvents="none">
        <Text variant="caption" color="dark300" style={styles.todayLabel}>
          TODAY'S STRIDE
        </Text>
        <Text variant="display" color="white" style={styles.distanceValue}>
          {formattedCurrent}
        </Text>
        <Text variant="bodySmall" color="lime" style={styles.percentText}>
          {percent}% of {formattedGoal}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 12,
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayLabel: {
    letterSpacing: 2,
    fontSize: 11,
    marginBottom: 4,
  },
  distanceValue: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  percentText: {
    fontWeight: '700',
    marginTop: 4,
  },
});
