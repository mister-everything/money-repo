import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProbGenerationFormData } from "@/lib/prob/schemas";

export type ProbCreateFormData = ProbGenerationFormData;

interface ProbCreateStore {
  formData: ProbCreateFormData | null;
  setFormData: (data: ProbCreateFormData) => void;
  clearFormData: () => void;
}

export const useProbCreateStore = create<ProbCreateStore>()(
  persist(
    (set) => ({
      formData: null,
      setFormData: (data) => set({ formData: data }),
      clearFormData: () => set({ formData: null }),
    }),
    {
      name: "prob-create-storage",
    },
  ),
);
