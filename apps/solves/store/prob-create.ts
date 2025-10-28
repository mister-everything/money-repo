import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ProbCreateFormData {
  people: string;
  situation: string;
  format: string;
  platform: string;
  ageGroup: string;
  topic: string[];
  difficulty: string;
  description: string;
}

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
