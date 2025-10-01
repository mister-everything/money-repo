import { useItem } from "@workspace/swr";
import { SWRConfiguration } from "swr";
import { ProbBlock } from "@/type";

export function useProblem(id?: string, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useItem<ProbBlock>(
    "/api/problems",
    id,
    {
      revalidateOnFocus: false,
      ...config,
    },
  );

  return {
    problem: (data as { success: boolean; data?: ProbBlock } | undefined)?.data,
    isLoading,
    isError: Boolean(error),
    error,
    mutate,
  };
}
