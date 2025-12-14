"use client";

import { SessionStatus } from "@service/solves/shared";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { LoaderIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { resetWorkBookSessionAction } from "@/actions/workbook";
import { Button } from "@/components/ui/button";
import { WorkbookSolveResumePopup } from "@/components/workbook/workbook-solve-resume-popup";
import { authClient } from "@/lib/auth/client";
import { useSafeAction } from "@/lib/protocol/use-safe-action";

export function WorkbookSolveNavigateButton({
  workBookId,
}: {
  workBookId: string;
}) {
  const { data, isRefetching } = authClient.useSession();

  const router = useRouter();

  const isLoggedIn = useMemo(() => {
    return !isRefetching && data?.session;
  }, [data, isRefetching]);

  const { data: status, isLoading } = useSWR<SessionStatus>(
    isLoggedIn ? `/api/workbooks/${workBookId}/session/status` : null,
    {
      revalidateOnFocus: false,
    },
  );

  const solveHref = useMemo(() => {
    return `/workbooks/${workBookId}/solve`;
  }, [workBookId]);

  const reviewHref = useMemo(() => {
    if (status?.status !== "submitted") return "/error";
    return `/workbooks/session/${status.submitId}/review`;
  }, [status]);

  const subText = useMemo(() => {
    if (status?.status == "in-progress")
      return "풀고 있는 문제집이 있습니다. 이어서 풀어보세요";
    if (status?.status == "submitted") {
      const time = formatDistanceToNow(status.endTime, { locale: ko });
      return (
        <>
          <span className="text-muted-foreground font-normal">
            {time}전에 풀이를 완료했습니다.
          </span>
          <span className="text-foreground mx-1">
            {status.totalBlocks}문제 중 {status.correctBlocks}개
          </span>
          <span className="">맞추었네요 ☺️</span>
        </>
      );
    }

    return "전체 문제를 풀려면 시작해보세요";
  }, [status]);

  const [, restartWorkbookSession, isRestarting] = useSafeAction(
    resetWorkBookSessionAction,
    {
      onSuccess: () => {
        router.push(solveHref);
      },
    },
  );

  const handleRestart = useCallback(() => {
    if (status?.status != "in-progress") return;

    restartWorkbookSession({ submitId: status.submitId });
  }, [status, restartWorkbookSession]);

  const [openNavigatePopup, setOpenNavigatePopup] = useState(false);

  const handleSolve = useCallback(() => {
    if (!isLoggedIn || status?.status == "not-started")
      return router.push(solveHref);
    if (status?.status == "in-progress") {
      return setOpenNavigatePopup(true);
    }

    router.push(solveHref);
  }, [isLoggedIn, router, workBookId, status, solveHref]);

  return (
    <div className="w-full py-16 flex flex-col gap-4 items-center justify-center relative">
      {!isLoading && (
        <div className="text-muted-foreground font-medium text-xs md:text-sm">
          {subText}
        </div>
      )}
      {status?.status == "submitted" ? (
        <div className="flex gap-4">
          <Button
            size="lg"
            variant="secondary"
            onClick={() => router.push(reviewHref)}
            className="rounded-full font-semibold md:text-lg px-10 py-6 hover:scale-105 transition-all"
          >
            결과 확인
          </Button>
          <Button
            size="lg"
            onClick={handleSolve}
            className="rounded-full font-bold md:text-lg px-14 py-6 hover:scale-105 transition-all hover:bg-primary/90"
          >
            다시 풀기
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleSolve}
          size="lg"
          className="rounded-full font-bold md:text-lg px-10 py-6 hover:scale-105 transition-all hover:bg-primary/90"
        >
          {status?.status == "in-progress" ? "이어서 풀기" : "시작하기"}
          {isLoading && <LoaderIcon className="size-4 animate-spin" />}
        </Button>
      )}

      <WorkbookSolveResumePopup
        open={openNavigatePopup}
        onOpenChange={setOpenNavigatePopup}
        isRestarting={isRestarting}
        onRestart={handleRestart}
        onContinue={() => router.push(solveHref)}
      />
    </div>
  );
}
