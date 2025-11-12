"use client";

import { TIME } from "@workspace/util";
import { usePathname, useRouter } from "next/navigation";
import { useLayoutEffect, useMemo } from "react";
import useSWR from "swr";

export const AuthCheck = ({ children }: { children: React.ReactNode }) => {
  const { data, isLoading } = useSWR<{ success: boolean }>("/api/auth/check", {
    refreshInterval: TIME.MINUTES(10),
  });
  const pathname = usePathname();
  const router = useRouter();

  const notAllowed = useMemo(() => {
    if (data?.success) return false;
    if (pathname == "/") return false;
    if (pathname == "/sign-in") return false;
    if (pathname.startsWith("/auth")) return false;
    return true;
  }, [pathname, data]);

  useLayoutEffect(() => {
    if (notAllowed && !isLoading) router.push("/sign-in");
  }, [notAllowed, isLoading]);

  if (isLoading || notAllowed) return null;
  return children;
};
