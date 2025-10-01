"use client";

import type { SWRConfiguration, SWRResponse } from "swr";
import useSWR from "swr";
import { fetchJSON } from "./fetcher";

export type CommonListResponse<T> = {
  success: boolean;
  data?: T[];
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
};

export type CommonItemResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export function useList<T>(
  url: string,
  params?: Record<string, unknown>,
  config?: SWRConfiguration,
): SWRResponse<CommonListResponse<T>, Error> {
  const key = params ? [url, params] : url;
  return useSWR<CommonListResponse<T>, Error>(
    key,
    (k) => {
      if (Array.isArray(k)) {
        const [u, p] = k as [string, Record<string, unknown>];
        const qs = new URLSearchParams(p as Record<string, string>).toString();
        return fetchJSON(`${u}${qs ? `?${qs}` : ""}`);
      }
      return fetchJSON(k as string);
    },
    config,
  );
}

export function useItem<T>(
  url: string,
  id?: string | null,
  config?: SWRConfiguration,
): SWRResponse<CommonItemResponse<T>, Error> {
  const key = id ? [url, id] : null;
  return useSWR<CommonItemResponse<T>, Error>(
    key,
    (k) => {
      const [, itemId] = k as [string, string];
      return fetchJSON(`${url}/${itemId}`);
    },
    config,
  );
}
