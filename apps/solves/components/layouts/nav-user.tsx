"use client";

import { displayCost } from "@service/solves/shared";
import { isNull, wait } from "@workspace/util";
import {
  LoaderIcon,
  LogOutIcon,
  Settings2Icon,
  SparkleIcon,
  WalletIcon,
} from "lucide-react";
import Link from "next/link";

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

import { Skeleton } from "@/components/ui/skeleton";
import { useBalance } from "@/hooks/query/use-balance";
import { authClient } from "@/lib/auth/client";

import { SettingsPopup } from "../settings/settings-popup";
import { ThemeToggle } from "../theme-toggle";

export const NavUser = memo(function NavUser() {
  const { data, isPending, isRefetching } = authClient.useSession();

  const handleSignOut = useCallback(() => {
    authClient.signOut().finally(() => {
      window.location.href = "/";
    });
  }, []);

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
    return (
      <Button
        data-testid="sidebar-user-button"
        variant="ghost"
        className="data-[state=open]:bg-accent! flex items-center gap-2 p-2 rounded-full text-sm"
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

        {isPending ? (
          <Skeleton className="w-24 h-4" />
        ) : (
          <>
            <span className="text-xs text-foreground">FREE</span>
            <span className="text-xs text-muted-foreground">Plan</span>
          </>
        )}
      </Button>
    );
  }, [isPending, data, displayName, isAnonymous]);

  return (
    <>
      <div className="flex items-center justify-between">
        {isAnonymous ? (
          <Link
            href={"/sign-in?callbackUrl=/workbooks"}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Button className="rounded-full" variant="ghost">
              로그인
            </Button>
          </Link>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-lg w-72">
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
        )}
        <ThemeToggle className="rounded-full" />
      </div>
      <SettingsPopup open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  );
});
