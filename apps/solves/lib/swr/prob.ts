import type { ProbBook } from "@service/solves/types";
import { useItem } from "@workspace/swr";
import { SWRConfiguration } from "swr";

export function useBook(id?: string, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useItem<ProbBook>(
    "/api/prob",
    id,
    {
      revalidateOnFocus: false,
      ...config,
    },
  );

  return {
    book: data as ProbBook | undefined,
    isLoading,
    isError: Boolean(error),
    error,
    mutate,
  };
}
