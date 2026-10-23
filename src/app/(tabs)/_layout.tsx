import React, { createRef, useEffect, useMemo, useState } from "react";
import { Tabs } from "expo-router";
import { useRunStore } from "../../store/run";
import { RunStatus } from "../../types/run";
import { useTheme } from "../../theme/tokens";
import { NaturalScene } from "../../components/ui/GlassSurface";
import { Keyboard, View } from "react-native";
import { BlurTargetView } from "expo-blur";
import type { BottomTabBarProps } from "expo-router/tabs";
import {
  LayoutDashboard,
  Play,
  History,
  Sparkles,
  User,
} from "lucide-react-native";
import {
  LiquidGlassDock,
  type LiquidGlassTab,
} from "../../components/navigation/LiquidGlassDock";

const GLYPHS = {
  index: LayoutDashboard,
  run: Play,
  history: History,
  coach: Sparkles,
  profile: User,
};
const LABELS: Record<string, string> = {
  index: "Today",
  run: "Run",
  history: "History",
  coach: "Coach",
  profile: "Profile",
};

function StrideDock({
  state,
  emitter,
  navigateToTab,
  blurTarget,
}: BottomTabBarProps & {
  blurTarget?: React.RefObject<React.ComponentRef<typeof View> | null>;
}) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const { isDark } = useTheme();
  const runStatus = useRunStore((state) => state.status);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const tabs = useMemo<LiquidGlassTab[]>(
    () =>
      state.routes.map((route) => {
        const Icon =
          GLYPHS[route.name as keyof typeof GLYPHS] || LayoutDashboard;
        return {
          id: route.key,
          label: LABELS[route.name] || route.name,
          icon: ({ color, size, selected }) => (
            <Icon
              color={color}
              size={size}
              strokeWidth={selected ? 2.5 : 1.8}
              fill={selected && route.name === "run" ? color : "none"}
            />
          ),
        };
      }),
    [state.routes],
  );
  if (
    keyboardVisible ||
    (state.routes[state.index]?.name === "run" && runStatus !== RunStatus.Idle)
  )
    return null;
  return (
    <LiquidGlassDock
      appearance={isDark ? "dark" : "light"}
      blurTarget={blurTarget}
      tabs={tabs}
      activeId={state.routes[state.index].key}
      onChange={(key) => {
        const route = state.routes.find((item) => item.key === key);
        if (!route) return;
        const event = emitter.emit({
          type: "tabPress",
          target: key,
          canPreventDefault: true,
        });
        if (!event.defaultPrevented) navigateToTab(key);
      }}
    />
  );
}

export default function TabLayout() {
  const targets = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(LABELS).map((name) => [
          name,
          createRef<React.ComponentRef<typeof View>>(),
        ]),
      ),
    [],
  );
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      screenLayout={({ children, route }) => (
        <NaturalScene>
          <BlurTargetView ref={targets[route.name]} style={{ flex: 1 }}>
            {children}
          </BlurTargetView>
        </NaturalScene>
      )}
      tabBar={(props) => (
        <StrideDock
          {...props}
          blurTarget={targets[props.state.routes[props.state.index].name]}
        />
      )}
    >
      <Tabs.Screen name="index" options={{ title: "Today" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="run" options={{ title: "Run" }} />
      <Tabs.Screen name="coach" options={{ title: "Coach" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
