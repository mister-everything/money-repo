"use client";

import { TIME } from "@workspace/util";
import { usePathname, useRouter } from "next/navigation";
import { useLayoutEffect } from "react";
import useSWR from "swr";

export const AuthCheck = ({ children }: { children: React.ReactNode }) => {
  const { data, isLoading } = useSWR("/api/auth/check", {
    refreshInterval: TIME.MINUTES(10),
  });
  const pathname = usePathname();
  const router = useRouter();

  useLayoutEffect(() => {
    if (!data) return;
    if (data.success) return;
    if (pathname == "/") return;
    if (pathname == "/sign-in") return;
    if (pathname.startsWith("/auth")) return;
    router.push("/sign-in");
  }, [data, pathname]);

  if (isLoading) return null;
  return children;
};
