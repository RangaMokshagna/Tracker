/**
 * STRIDE — Bottom Tab Bar Navigation Layout
 *
 * Dark glassmorphic tab bar with Apple HIG large titles, haptics,
 * and neon lime active highlights.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSheen } from '../../components/ui/LiquidBackdrop';
import { palette } from '../../theme/tokens';
import { useHaptics } from '../../hooks/useHaptics';
import { LayoutDashboard, Play, History, Sparkles, User } from 'lucide-react-native';

export default function TabLayout(): React.JSX.Element {
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: palette.lime,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.45)',
        tabBarHideOnKeyboard: true,
        tabBarBackground: () => <GlassSheen />,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Math.max(insets.bottom, 12),
          backgroundColor: 'rgba(31, 47, 55, 0.97)',
          borderColor: 'rgba(220, 240, 230, 0.2)',
          borderTopColor: 'rgba(220, 240, 230, 0.4)',
          borderWidth: 1,
          borderTopWidth: 1,
          borderRadius: 34,
          height: 72,
          paddingTop: 9,
          paddingBottom: 9,
          paddingHorizontal: 5,
          shadowColor: '#000000',
          shadowOpacity: 0.3,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 12 },
          elevation: 12,
          overflow: 'hidden',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          letterSpacing: 0,
          marginTop: 2,
        },
      }}
      screenListeners={{
        tabPress: () => {
          haptics.selection();
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <LayoutDashboard size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="run"
        options={{
          title: 'Run',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.runTabIcon, focused && styles.runTabIconFocused]}>
              <Play
                size={22}
                color={focused ? '#000000' : palette.lime}
                fill={focused ? '#000000' : 'none'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <History size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
          tabBarIcon: ({ color, focused }) => (
            <Sparkles size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  runTabIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(185, 232, 218, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(185, 232, 218, 0.3)',
  },
  runTabIconFocused: {
    backgroundColor: palette.lime,
  },
});
