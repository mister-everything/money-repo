import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WorkbookOptions } from "./types";

interface WorkbookStore {
  Workbooks: Record<string, WorkbookOptions>;
  setWorkbooks: (id: string, options: WorkbookOptions) => void;
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
      name: "workbook-create",
    },
  ),
);
