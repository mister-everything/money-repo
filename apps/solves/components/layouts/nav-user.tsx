"use client";

import {
  ChevronUpIcon,
  LogOutIcon,
  MoonIcon,
  SparkleIcon,
  SunIcon,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { memo, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth/client";

export const NavUser = memo(function NavUser() {
  const { data, isPending, isRefetching } = authClient.useSession();

  const handleSignOut = useCallback(() => {
    authClient.signOut().finally(() => {
      window.location.href = "/";
    });
  }, []);

  const { resolvedTheme, setTheme } = useTheme();

  const isAnonymous = useMemo(() => {
    return !isPending && !data && !isRefetching;
  }, [data, isPending, isRefetching]);

  if (isAnonymous) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          data-testid="sidebar-user-button"
          className="pointer-events-auto data-[state=open]:bg-primary/5! hover:bg-primary/5! flex items-center gap-2 p-2 rounded-lg text-sm"
        >
          {isPending ? (
            <Skeleton className="rounded-full size-7" />
          ) : (
            <Avatar className="rounded-full size-7 border mr-1">
              <AvatarImage
                className="object-cover"
                src={data?.user.image ?? ""}
                alt={`${data?.user.name} 프로필 사진`}
              />
              <AvatarFallback>{data?.user.name.at(0)}</AvatarFallback>
            </Avatar>
          )}
          <div className="flex flex-col items-start">
            {isPending ? (
              <>
                <Skeleton className="w-32 h-4 my-1" />
                <Skeleton className="w-24 h-4" />
              </>
            ) : (
              <>
                <span className="truncate" data-testid="sidebar-user-email">
                  {data?.user.name}
                </span>
                <span className="text-xs text-muted-foreground">Free</span>
              </>
            )}
          </div>
          {!isPending && (
            <ChevronUpIcon className="ml-auto size-4! text-muted-foreground" />
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) rounded-lg"
        side="top"
        align="center"
      >
        <div className="p-4 flex flex-col justify-center items-center gap-2 relative">
          <Avatar className="rounded-full size-14 border mr-1 ">
            <AvatarImage
              className="object-cover"
              src={data?.user.image ?? ""}
              alt={`${data?.user.name} 프로필 사진`}
            />
            <AvatarFallback>{data?.user.name.at(0)}</AvatarFallback>
          </Avatar>
        </div>

        <DropdownMenuItem
          onClick={(e) => {
            setTheme(resolvedTheme === "light" ? "dark" : "light");
            e.preventDefault();
          }}
        >
          {resolvedTheme === "light" ? (
            <MoonIcon className="fill-muted-foreground" />
          ) : (
            <SunIcon />
          )}
          {resolvedTheme === "light"
            ? "다크 모드로 변경"
            : "라이트 모드로 변경"}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <SparkleIcon />
          <Link href={"/pricing"}>플랜 업그레이드</Link>
        </DropdownMenuItem>
        <div className="px-2">
          <DropdownMenuSeparator />
        </div>
        <DropdownMenuItem onClick={handleSignOut} disabled={isPending}>
          <LogOutIcon />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
