import { AIPrice } from "@service/solves/shared";
import { TIME } from "@workspace/util";
import useSWR, { SWRConfiguration, SWRResponse } from "swr";

type Data = Pick<AIPrice, "provider" | "model" | "displayName">;

export const useChatModelList = (
  options?: SWRConfiguration<Data[]>,
): SWRResponse<Data[]> => {
  return useSWR<Data[]>("/api/ai/chat/models", {
    fallbackData: [],
    revalidateOnFocus: false,
    dedupingInterval: TIME.MINUTES(10),
    ...options,
  });
};
