"use client";

import { displayCost } from "@service/solves/shared";
import { isNull, wait } from "@workspace/util";
import {
  ChevronUpIcon,
  LoaderIcon,
  LogOutIcon,
  MoonIcon,
  Settings2Icon,
  SparkleIcon,
  SunIcon,
  WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { memo, useCallback, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useBalance } from "@/hooks/query/use-balance";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { SettingsPopup } from "../settings/settings-popup";

export const NavUser = memo(function NavUser() {
  const { data, isPending, isRefetching } = authClient.useSession();
  const { state } = useSidebar();

  const handleSignOut = useCallback(() => {
    authClient.signOut().finally(() => {
      window.location.href = "/";
    });
  }, []);

  const { resolvedTheme, setTheme } = useTheme();

  const [canFetchBalance, setCanFetchBalance] = useState(true);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const {
    data: balance,
    mutate,
    isValidating: isLoadingBalance,
  } = useBalance();

  const fetchBalance = useCallback(() => {
    if (!canFetchBalance) return;
    setCanFetchBalance(false);
    mutate().then(() => {
      wait(3000).then(() => setCanFetchBalance(true));
    });
  }, [canFetchBalance]);

  const isAnonymous = useMemo(() => {
    return !isPending && !data && !isRefetching;
  }, [data, isPending, isRefetching]);

  const displayName = useMemo(() => {
    if (!data?.user) return "";
    return (data.user as any).nickname ?? data.user.name ?? "";
  }, [data]);

  const trigger = useMemo(() => {
    if (state == "expanded") {
      return (
        <div
          data-testid="sidebar-user-button"
          className="pointer-events-auto data-[state=open]:bg-primary/5! hover:bg-primary/5! flex items-center gap-2 p-2 rounded-lg text-sm"
        >
          {isPending ? (
            <Skeleton className="rounded-full size-6" />
          ) : (
            <Avatar className="rounded-full size-6 border mr-1">
              <AvatarImage
                className="object-cover"
                src={data?.user.image ?? ""}
                alt={`${displayName} 프로필 사진`}
              />
              <AvatarFallback>{displayName.at(0)}</AvatarFallback>
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
                  {displayName}
                </span>
                <span className="text-xs text-muted-foreground">Free</span>
              </>
            )}
          </div>
          {!isPending && (
            <ChevronUpIcon className="ml-auto size-4! text-muted-foreground" />
          )}
        </div>
      );
    }
    if (isPending) {
      return <Skeleton className="rounded-full size-6" />;
    }
    return (
      <Button
        size="icon"
        variant="ghost"
        className="flex items-center justify-center"
      >
        <Avatar className="rounded-full size-6 border mr-1">
          <AvatarImage
            className="object-cover"
            src={data?.user.image ?? ""}
            alt={`${displayName} 프로필 사진`}
          />
          <AvatarFallback>{displayName.at(0)}</AvatarFallback>
        </Avatar>
      </Button>
    );
  }, [state, isPending, data, displayName]);

  if (isAnonymous) return null;

  return (
    <>
      <SettingsPopup open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>

        <DropdownMenuContent
          className={cn(
            "rounded-lg",
            state == "expanded"
              ? "w-(--radix-dropdown-menu-trigger-width)"
              : "w-72",
          )}
          side={state == "expanded" ? "top" : "right"}
          align={state == "expanded" ? "center" : "end"}
        >
          <div className="p-4 flex flex-col justify-center items-center gap-2 relative">
            <Avatar className="rounded-full size-14 border mr-1 ">
              <AvatarImage
                className="object-cover"
                src={data?.user.image ?? ""}
                alt={`${displayName} 프로필 사진`}
              />
              <AvatarFallback>{displayName.at(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{displayName}</span>
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
          <DropdownMenuItem
            disabled={!canFetchBalance || isLoadingBalance}
            onClick={(e) => {
              fetchBalance();
              e.preventDefault();
            }}
          >
            {isLoadingBalance ? (
              <LoaderIcon className="animate-spin" />
            ) : (
              <WalletIcon />
            )}
            {isLoadingBalance
              ? "  크레딧 조회중..."
              : isNull(balance)
                ? "크레딧 조회하기"
                : `크레딧 ${Math.round(displayCost(balance)).toLocaleString()}`}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SparkleIcon />
            <Link href={"/pricing"}>플랜 업그레이드</Link>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
            <Settings2Icon />
            설정
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
    </>
  );
});
