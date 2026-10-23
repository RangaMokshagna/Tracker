/**
 * STRIDE — Theme Zustand Store
 *
 * Manages color scheme preference and persists to AsyncStorage.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ColorSchemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeState {
  /** User preference: explicit light/dark or follow system */
  colorScheme: ColorSchemePreference;
  /** The actual resolved theme after considering system preference */
  resolvedTheme: ResolvedTheme;
  /** Set the color scheme preference */
  setColorScheme: (scheme: ColorSchemePreference) => void;
  /** Toggle between light and dark (skips system) */
  toggle: () => void;
  /** Sync resolved theme with current system appearance */
  syncSystem: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveTheme(preference: ColorSchemePreference): ResolvedTheme {
  if (preference === "system") {
    return (Appearance.getColorScheme() as ResolvedTheme) ?? "dark";
  }
  return preference;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      colorScheme: "light",
      resolvedTheme: "light",

      setColorScheme: (scheme: ColorSchemePreference) => {
        set({
          colorScheme: scheme,
          resolvedTheme: resolveTheme(scheme),
        });
      },

      toggle: () => {
        const current = get().resolvedTheme;
        const next: ResolvedTheme = current === "dark" ? "light" : "dark";
        set({
          colorScheme: next,
          resolvedTheme: next,
        });
      },

      syncSystem: () => {
        const { colorScheme } = get();
        if (colorScheme === "system") {
          set({ resolvedTheme: resolveTheme("system") });
        }
      },
    }),
    {
      name: "stride-theme",
      version: 1,
      migrate: (state) => state as ThemeState,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        colorScheme: state.colorScheme,
        resolvedTheme: state.resolvedTheme,
      }),
    },
  ),
);

// Listen for system appearance changes
Appearance.addChangeListener(() => {
  useThemeStore.getState().syncSystem();
});
