import { WorkBookBlock, WorkBookWithoutBlocks } from "@service/solves/shared";
import { isFunction } from "@workspace/util";
import { SetStateAction } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SolvesMentionItem } from "@/components/mention/types";
import { WorkbookOptions } from "./types";

interface WorkbookEditStoreState {
  workbookOptions: Record<string, WorkbookOptions & { updatedAt: Date }>;
  workBook?: WorkBookWithoutBlocks;
  focusBlockId?: string;
  scrollTrigger: number;
  blocks: WorkBookBlock[];
  mentions: SolvesMentionItem[];
}

interface WorkbookEditStoreDispatch {
  setWorkbookOption: (id: string, options: WorkbookOptions) => void;
  setMentions: (mentions: SolvesMentionItem[]) => void;
  setWorkBook: (workBook: SetStateAction<WorkBookWithoutBlocks>) => void;
  setBlocks: (blocks: SetStateAction<WorkBookBlock[]>) => void;
  setFocusBlockId: (id: string) => void;
  triggerScrollToTop: () => void;
  appendBlock: (block: WorkBookBlock) => void;
}

const MAX_WORKBOOKS = 20;

const initialState: WorkbookEditStoreState = {
  workbookOptions: {},
  blocks: [],
  workBook: undefined,
  mentions: [],
  scrollTrigger: 0,
};

export const useWorkbookEditStore = create<
  WorkbookEditStoreState & WorkbookEditStoreDispatch
>()(
  persist(
    (set) => ({
      ...initialState,

      setFocusBlockId: (id) => {
        set({
          focusBlockId: id,
        });
      },
      triggerScrollToTop: () => {
        set((prev) => ({
          scrollTrigger: prev.scrollTrigger + 1,
        }));
      },
      appendBlock: (block) => {
        set((prev) => {
          const maxOrder = Math.max(...prev.blocks.map((b) => b.order), 0);
          return {
            blocks: [
              ...prev.blocks,
              {
                ...block,
                order: maxOrder + 1,
              },
            ],
            focusBlockId: block.id,
          };
        });
      },
      setMentions: (mentions) => {
        set({ mentions });
      },
      setWorkbookOption: (id, options) => {
        set((state) => {
          const updated = {
            ...state.workbookOptions,
            [id]: { ...options, updatedAt: new Date() },
          };
          const entries = Object.entries(updated);
          if (entries.length <= MAX_WORKBOOKS) {
            return { workbookOptions: updated };
          }
          const sorted = entries.sort(
            ([, a], [, b]) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          );
          return {
            workbookOptions: Object.fromEntries(sorted.slice(0, MAX_WORKBOOKS)),
          };
        });
      },
      setWorkBook: (next) => {
        set((prev) => ({
          workBook: isFunction(next) ? next(prev.workBook!) : next,
        }));
      },
      setBlocks: (next) => {
        set((prev) => ({
          blocks: isFunction(next) ? next(prev.blocks) : next,
        }));
      },
    }),
    {
      name: "workbook-create",
      partialize: (state) => {
        return {
          ...initialState,
          ...state,
          mentions: [],
          focusBlockId: undefined,
          scrollTrigger: 0,
          workBook: undefined,
          blocks: [],
        };
      },
    },
  ),
);
