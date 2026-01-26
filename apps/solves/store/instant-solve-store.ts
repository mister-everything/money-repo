"use client";

import { BlockAnswerSubmit, WorkBookBlock } from "@service/solves/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WorkbookPlan } from "@/lib/ai/tools/workbook/workbook-plan";

type InstantSolveSession = {
  planKey: string;
  categoryId: number;
  currentIndex: number;
  blocks: WorkBookBlock[];
  submits: Record<string, BlockAnswerSubmit>;
  completedAt?: string;
  updatedAt: string;
};

type InstantSolveStoreState = {
  sessions: Record<string, InstantSolveSession>;
  hasHydrated: boolean;
};

type InstantSolveStoreActions = {
  saveSession: (session: InstantSolveSession) => void;
  clearSession: (planKey: string) => void;
  setHasHydrated: (value: boolean) => void;
};

const MAX_SESSIONS = 10;

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

export const getInstantSolvePlanKey = (
  plan: WorkbookPlan,
  categoryId: number,
) => {
  return hashString(
    JSON.stringify({
      categoryId,
      overview: plan.overview,
      constraints: plan.constraints ?? [],
      guidelines: plan.guidelines ?? [],
      blockPlans: plan.blockPlans,
    }),
  );
};

const pruneSessions = (sessions: Record<string, InstantSolveSession>) => {
  const entries = Object.entries(sessions);
  if (entries.length <= MAX_SESSIONS) return sessions;
  const sorted = entries.sort(
    ([, a], [, b]) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  return Object.fromEntries(sorted.slice(0, MAX_SESSIONS));
};

export const useInstantSolveStore = create<
  InstantSolveStoreState & InstantSolveStoreActions
>()(
  persist(
    (set) => ({
      sessions: {},
      hasHydrated: false,
      saveSession: (session) => {
        set((state) => ({
          sessions: pruneSessions({
            ...state.sessions,
            [session.planKey]: session,
          }),
        }));
      },
      clearSession: (planKey) => {
        set((state) => {
          if (!state.sessions[planKey]) return state;
          const next = { ...state.sessions };
          delete next[planKey];
          return { sessions: next };
        });
      },
      setHasHydrated: (value) => {
        set({ hasHydrated: value });
      },
    }),
    {
      name: "instant-solve",
      partialize: (state) => ({
        sessions: state.sessions,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
