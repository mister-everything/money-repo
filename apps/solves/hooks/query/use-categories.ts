import { CategoryWithSubs } from "@service/solves/shared";
import { TIME } from "@workspace/util";
import useSWR, { SWRConfiguration, SWRResponse } from "swr";

export const useCategories = (
  options?: SWRConfiguration<CategoryWithSubs[]>,
): SWRResponse<CategoryWithSubs[]> => {
  return useSWR<CategoryWithSubs[]>("/api/categories", {
    fallbackData: [],
    revalidateOnFocus: false,
    dedupingInterval: TIME.MINUTES(10),
    ...options,
  });
};
