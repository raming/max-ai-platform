"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OnboardingStep = "client" | "templates" | "customize" | "plan";

export type OnboardingState = {
  // progress flags
  clientComplete: boolean;
  templateSelected: boolean;
  customizeComplete: boolean;
  planReady: boolean;
  // data placeholders (extend as needed)
  clientData?: Record<string, unknown>;
  templateData?: Record<string, unknown>;
  customizeData?: Record<string, unknown>;
  planData?: Record<string, unknown>;
  // actions
  setClientComplete: (complete: boolean, data?: Record<string, unknown>) => void;
  setTemplateSelected: (selected: boolean, data?: Record<string, unknown>) => void;
  setCustomizeComplete: (complete: boolean, data?: Record<string, unknown>) => void;
  setPlanReady: (ready: boolean, data?: Record<string, unknown>) => void;
  reset: () => void;
};

export const stepOrder: OnboardingStep[] = [
  "client",
  "templates",
  "customize",
  "plan",
];

export function getFirstIncompleteStep(state: OnboardingState): OnboardingStep {
  if (!state.clientComplete) return "client";
  if (!state.templateSelected) return "templates";
  if (!state.customizeComplete) return "customize";
  if (!state.planReady) return "plan";
  return "plan"; // all complete -> plan is the terminal step
}

const initialState = {
  clientComplete: false,
  templateSelected: false,
  customizeComplete: false,
  planReady: false,
} satisfies Partial<OnboardingState>;

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialState,
      setClientComplete: (complete, data) =>
        set((prev) => ({ clientComplete: complete, clientData: data ?? prev.clientData })),
      setTemplateSelected: (selected, data) =>
        set((prev) => ({ templateSelected: selected, templateData: data ?? prev.templateData })),
      setCustomizeComplete: (complete, data) =>
        set((prev) => ({ customizeComplete: complete, customizeData: data ?? prev.customizeData })),
      setPlanReady: (ready, data) =>
        set((prev) => ({ planReady: ready, planData: data ?? prev.planData })),
      reset: () => set(() => ({ ...initialState })),
    }),
    {
      name: "onboarding-store",
      version: 1,
      partialize: (s) => ({
        clientComplete: s.clientComplete,
        templateSelected: s.templateSelected,
        customizeComplete: s.customizeComplete,
        planReady: s.planReady,
        clientData: s.clientData,
        templateData: s.templateData,
        customizeData: s.customizeData,
        planData: s.planData,
      }),
    }
  )
);