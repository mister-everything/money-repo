import { AIPrice } from "@service/solves/shared";
import { TIME } from "@workspace/util";
import useSWR, { SWRConfiguration, SWRResponse } from "swr";
import { useAiStore } from "@/store/ai-store";

type Data = Pick<
  AIPrice,
  "provider" | "model" | "displayName" | "isDefaultModel"
>;

export const useChatModelList = (
  options?: SWRConfiguration<Data[]>,
): SWRResponse<Data[]> => {
  return useSWR<Data[]>("/api/ai/chat/models", {
    fallbackData: [],
    revalidateOnFocus: false,
    dedupingInterval: TIME.MINUTES(10),
    onSuccess: (data) => {
      const initialChatModel = useAiStore.getState().chatModel;
      if (
        !initialChatModel ||
        !data.some(
          (v) =>
            `${v.provider}/${v.model}` ===
            `${initialChatModel?.provider}/${initialChatModel?.model}`,
        )
      ) {
        const defaultModel = data.find((m) => m.isDefaultModel) || data.at(0);
        useAiStore.getState().setChatModel(defaultModel!);
      }
    },
    ...options,
  });
};
