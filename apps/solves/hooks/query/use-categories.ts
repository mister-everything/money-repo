import { CategoryTree } from "@service/solves/shared";
import { TIME } from "@workspace/util";
import useSWR, { SWRConfiguration, SWRResponse } from "swr";
import { handleErrorToast } from "@/lib/handle-toast";
import { fetcher } from "@/lib/protocol/fetcher";

export const useCategories = (
  options?: SWRConfiguration<CategoryTree[]>,
): SWRResponse<CategoryTree[]> => {
  return useSWR<CategoryTree[]>("/api/categories", fetcher, {
    fallbackData: [],
    onError: handleErrorToast,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: TIME.MINUTES(30),
    ...options,
  });
};
