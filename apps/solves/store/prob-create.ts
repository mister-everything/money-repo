import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WorkbookOptionsData {
  topic: string;
  ageGroup: string;
  situation: string;
  format: string[];
  difficulty: string;
}

interface WorkbookStore {
  Workbooks: Record<string, WorkbookOptionsData>;
  setWorkbooks: (id: string, options: WorkbookOptionsData) => void;
  clearWorkbooks: () => void;
}

export const useWorkbookStore = create<WorkbookStore>()(
  persist(
    (set) => ({
      Workbooks: {},
      setWorkbooks: (id, options) =>
        set((state) => ({ Workbooks: { ...state.Workbooks, [id]: options } })),
      clearWorkbooks: () => set({ Workbooks: {} }),
    }),
    {
      name: "prob-create-storage",
    },
  ),
);
