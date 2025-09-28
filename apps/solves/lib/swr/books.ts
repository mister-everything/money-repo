import { useItem, useList } from "@workspace/swr";
import { SWRConfiguration } from "swr";
import { ProbBook, ProbBookListResponse, ProbBookResponse } from "@/type";

export function useBooks(
  params?: {
    page?: number;
    limit?: number;
    tag?: string | string[];
    sort?: string;
  },
  config?: SWRConfiguration,
) {
  const { data, error, isLoading, mutate } = useList<ProbBook>(
    "/api/books",
    params,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      ...config,
    },
  );

  return {
    books: (data as ProbBookListResponse | undefined)?.data ?? [],
    total: (data as ProbBookListResponse | undefined)?.total ?? 0,
    page: (data as ProbBookListResponse | undefined)?.page ?? params?.page ?? 1,
    limit:
      (data as ProbBookListResponse | undefined)?.limit ?? params?.limit ?? 20,
    isLoading,
    isError: Boolean(error),
    error,
    mutate,
  };
}

export function useBook(id?: string, config?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useItem<ProbBook>(
    "/api/books",
    id,
    {
      revalidateOnFocus: false,
      ...config,
    },
  );

  return {
    book: (data as ProbBookResponse | undefined)?.data,
    isLoading,
    isError: Boolean(error),
    error,
    mutate,
  };
}
