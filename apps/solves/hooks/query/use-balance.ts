import useSWR, { SWRConfiguration, SWRResponse } from "swr";
import { handleErrorToast } from "@/lib/handle-toast";
import { fetcher } from "@/lib/protocol/fetcher";

export const useBalance = (
  options?: SWRConfiguration<number>,
): SWRResponse<number> => {
  return useSWR<number>("/api/payment/balance", fetcher, {
    onError: handleErrorToast,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateOnMount: false,
    ...options,
  });
};
