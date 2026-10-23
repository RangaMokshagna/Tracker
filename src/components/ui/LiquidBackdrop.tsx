import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Ellipse } from 'react-native-svg';

/** A lightweight, cross-platform ambient surface. No native blur module required. */
export function LiquidBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 900">
        <Defs>
          <RadialGradient id="sea">
            <Stop stopColor="#557F7A" stopOpacity="0.5" />
            <Stop offset="1" stopColor="#101B21" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="peach">
            <Stop stopColor="#B5816C" stopOpacity="0.25" />
            <Stop offset="1" stopColor="#101B21" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="400" height="900" fill="#101B21" />
        <Ellipse cx="345" cy="140" rx="330" ry="360" fill="url(#sea)" />
        <Ellipse cx="-50" cy="540" rx="300" ry="300" fill="url(#peach)" />
      </Svg>
    </View>
  );
}

export function GlassSheen() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 240">
        <Defs>
          <RadialGradient id="sheen" cx="0" cy="0" r="1">
            <Stop stopColor="#E5F5E9" stopOpacity="0.13" />
            <Stop offset="1" stopColor="#E5F5E9" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="400" height="240" fill="url(#sheen)" />
      </Svg>
    </View>
  );
}
