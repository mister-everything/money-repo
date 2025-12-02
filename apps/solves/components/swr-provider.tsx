"use client";

import { SWRConfig, SWRConfiguration } from "swr";
import { handleErrorToast } from "@/lib/handle-toast";
import { fetcher } from "@/lib/protocol/fetcher";

const defaultSWRConfig: SWRConfiguration = {
  fetcher: (url: string) => fetcher(url),
  dedupingInterval: 1000,
  errorRetryCount: 1,
  onError: handleErrorToast,
};

export function SwrProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={defaultSWRConfig}>{children}</SWRConfig>;
}
