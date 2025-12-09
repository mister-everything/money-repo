import { ChatModel } from "@service/solves/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AiStore {
  chatModel?: ChatModel;
  setChatModel: (model: ChatModel) => void;
}

export const useAiStore = create<AiStore>()(
  persist(
    (set) => ({
      chatModel: undefined,
      setChatModel: (model) => set({ chatModel: model }),
    }),
    {
      name: "ai-store",
    },
  ),
);
