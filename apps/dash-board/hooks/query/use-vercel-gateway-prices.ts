import { GatewayLanguageModelEntry } from "@ai-sdk/gateway";
import { TIME } from "@workspace/util";
import useSWR from "swr";
import { fetcher } from "@/lib/protocol/fetcher";

export const useVercelGatewayPrices = () => {
  return useSWR<GatewayLanguageModelEntry[]>("/api/prices/gateway", fetcher, {
    dedupingInterval: TIME.SECONDS(10),
    fallbackData: [],
  });
};
