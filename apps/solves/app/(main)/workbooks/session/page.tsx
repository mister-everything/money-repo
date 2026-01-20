"use client";
import { WorkBookSession } from "@service/solves/shared";

import { ChevronDownIcon, Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import z from "zod";
import { SearchCompletedWorkbooksRequest } from "@/app/api/workbooks/types";
import { HeaderWithSidebarToggle } from "@/components/layouts/header-with-sidebar-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkbookCard } from "@/components/workbook/workbook-card";
import { WorkbookReportDialog } from "@/components/workbook/workbook-report-dialog";
import { authClient } from "@/lib/auth/client";

const sortOptions = [
  { label: "최신순", value: "latest" },
  { label: "점수높은순", value: "highest" },
  { label: "점수낮은순", value: "lowest" },
] as const;

const FaultyTerminal = dynamic(
  () => import("@/components/ui/faulty-terminal").then((mod) => mod.default),
  {
    loading: () => null,
    ssr: false,
  },
);

export default function Page() {
  const { data: userSession } = authClient.useSession();
  // @TODO 마무리 검색 구현
  const [searchParams, setSearchParams] = useState<
    z.infer<typeof SearchCompletedWorkbooksRequest>
  >({
    page: 1,
    limit: 30,
    sort: "latest",
    search: "",
  });
  const [reportWorkbookId, setReportWorkbookId] = useState<string | null>(null);
  const {
    data: workBookSessions,
    isLoading,
    isValidating,
  } = useSWR<WorkBookSession[]>(
    // `/api/workbooks/completed?${new URLSearchParams(JSON.stringify(searchParams)).toString()}`,
    `/api/workbooks/completed`,
    {
      fallbackData: [],
      revalidateOnFocus: false,
    },
  );

  return (
    <>
      {!isLoading && workBookSessions?.length === 0 && (
        <div className="absolute inset-0 w-full h-full opacity-40">
          <FaultyTerminal mouseReact={false} />
        </div>
      )}
      <div className="relative h-full">
        <HeaderWithSidebarToggle>
          <span className="text-sm font-semibold hover:text-muted-foreground transition-colors">
            내가 푼 문제집
          </span>
        </HeaderWithSidebarToggle>
        <div className="w-full flex flex-col p-6 gap-4 pt-0! h-full">
          <div className="font-bold text-foreground flex items-center justify-between gap-4">
            <h1 className="md:text-xl shrink-0">문제집 검색</h1>
            <Input
              value={searchParams.search}
              onChange={(e) =>
                setSearchParams({
                  ...searchParams,
                  search: e.currentTarget.value,
                })
              }
              placeholder="키워드 검색"
              className="w-full lg:w-md shadow-none bg-background"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm flex items-center gap-1">
              문제집{" "}
              {isValidating ? (
                <Loader2Icon className="size-3 animate-spin" />
              ) : (
                `${workBookSessions?.length ?? 0}개`
              )}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size={"sm"} variant="ghost">
                  {
                    sortOptions.find(
                      (option) => option.value === searchParams.sort,
                    )?.label
                  }
                  <ChevronDownIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() =>
                      setSearchParams({ ...searchParams, sort: option.value })
                    }
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ">
              {Array.from({ length: 9 }).map((_, index) => (
                <Skeleton key={index} className="w-full h-80" />
              ))}
            </div>
          ) : workBookSessions?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ">
              {workBookSessions.map(({ workBook, session }) => (
                <Link
                  href={`/workbooks/${workBook.id}/preview`}
                  key={workBook.id}
                >
                  <WorkbookCard
                    isOwner={
                      userSession?.user?.publicId === workBook.ownerPublicId
                    }
                    workBook={workBook}
                    session={session}
                    onReport={() => setReportWorkbookId(workBook.id)}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex-1 w-full flex flex-col gap-2 items-center justify-center">
              <h2 className="mb-2 text-xl md:text-2xl font-bold">
                아직 풀고 있는 문제집이 없습니다
              </h2>
              <p className="text-muted-foreground ">문제집을 풀어보세요!</p>
              <div className="flex items-center gap-2 mt-6">
                <Link href="/workbooks/creator/new">
                  <Button
                    size={"lg"}
                    variant="secondary"
                    className="rounded-full"
                  >
                    문제집 만들기
                  </Button>
                </Link>
                <Link href="/workbooks">
                  <Button
                    size={"lg"}
                    variant="default"
                    className="rounded-full"
                  >
                    문제집 찾아보기
                  </Button>
                </Link>
              </div>
            </div>
          )}
          <WorkbookReportDialog
            open={reportWorkbookId !== null}
            onOpenChange={(open) => {
              if (!open) setReportWorkbookId(null);
            }}
            workbookId={reportWorkbookId ?? undefined}
          />
        </div>
      </div>
    </>
  );
}
