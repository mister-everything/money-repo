import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WorkbookOptions } from "./types";

interface WorkbookStore {
  workbooks: Record<string, WorkbookOptions & { updatedAt: Date }>;
  setWorkbooks: (id: string, options: WorkbookOptions) => void;
  clearWorkbooks: () => void;
}

const MAX_WORKBOOKS = 20;

export const useWorkbookStore = create<WorkbookStore>()(
  persist(
    (set) => ({
      workbooks: {},
      setWorkbooks: (id, options) =>
        set((state) => {
          const updated = {
            ...state.workbooks,
            [id]: { ...options, updatedAt: new Date() },
          };

          const entries = Object.entries(updated);
          if (entries.length <= MAX_WORKBOOKS) {
            return { workbooks: updated };
          }

          const sorted = entries.sort(
            ([, a], [, b]) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          );

          return {
            workbooks: Object.fromEntries(sorted.slice(0, MAX_WORKBOOKS)),
          };
        }),
      clearWorkbooks: () => set({ workbooks: {} }),
    }),
    {
      name: "workbook-create",
    },
  ),
);
