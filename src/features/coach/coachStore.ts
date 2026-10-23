import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { GoalDistance, Level } from "./types";

export interface ActivePlan {
  level: Level;
  goal: GoalDistance;
  days: 2 | 3 | 4;
  startDate: string;
  completed: string[];
  dismissed: string[];
}
interface CoachState {
  accounts: Record<string, ActivePlan>;
  choose: (
    account: string,
    plan: Omit<ActivePlan, "completed" | "dismissed">,
  ) => void;
  check: (account: string, workout: string) => void;
  dismiss: (account: string, insight: string) => void;
}
export const useCoachStore = create<CoachState>()(
  persist(
    (set) => ({
      accounts: {},
      choose: (account, plan) =>
        set((state) => ({
          accounts: {
            ...state.accounts,
            [account]: { ...plan, completed: [], dismissed: [] },
          },
        })),
      check: (account, workout) =>
        set((state) => {
          const plan = state.accounts[account];
          if (!plan) return state;
          return {
            accounts: {
              ...state.accounts,
              [account]: {
                ...plan,
                completed: plan.completed.includes(workout)
                  ? plan.completed.filter((id) => id !== workout)
                  : [...plan.completed, workout],
              },
            },
          };
        }),
      dismiss: (account, insight) =>
        set((state) => {
          const plan = state.accounts[account];
          if (!plan) return state;
          return {
            accounts: {
              ...state.accounts,
              [account]: {
                ...plan,
                dismissed: [...plan.dismissed, insight].slice(-100),
              },
            },
          };
        }),
    }),
    {
      name: "stride-offline-coach-v1",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
