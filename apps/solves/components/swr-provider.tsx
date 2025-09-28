"use client";

import { fetchJSON } from "@workspace/swr";
import { SWRConfig } from "swr";

export function SwrProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => fetchJSON(url),
        revalidateOnFocus: false,
        dedupingInterval: 1000,
        errorRetryCount: 2,
      }}
    >
      {children}
    </SWRConfig>
  );
}
