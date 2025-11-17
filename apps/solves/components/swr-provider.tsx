"use client";

import { SWRConfig, SWRConfiguration } from "swr";
import { fetcher } from "@/lib/protocol/fetcher";

const defaultSWRConfig: SWRConfiguration = {
  fetcher: (url: string) => fetcher(url),
  dedupingInterval: 1000,
  errorRetryCount: 2,
};

export function SwrProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={defaultSWRConfig}>{children}</SWRConfig>;
}
