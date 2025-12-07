"use client";

import { WorkBookSubmitStatus } from "@service/solves/shared";
import { LoaderIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { restartWorkbookSessionAction } from "@/actions/workbook";
import { Button } from "@/components/ui/button";
import { WorkbookSolveNavigatePopup } from "@/components/workbook/workbook-solve-navigate-popup";
import { authClient } from "@/lib/auth/client";
import { useSafeAction } from "@/lib/protocol/use-safe-action";

export async function WorkbookSolveNavigateButton({
  workBookId,
}: {
  workBookId: string;
}) {
  const { data, isRefetching } = authClient.useSession();

  const router = useRouter();

  const solveHref = useMemo(() => {
    return `/workbooks/${workBookId}/solve`;
  }, [workBookId]);

  const isLoggedIn = useMemo(() => {
    return !isRefetching && data?.session;
  }, [data, isRefetching]);

  const { data: status, isLoading } = useSWR<WorkBookSubmitStatus>(
    isLoggedIn ? `/api/workbooks/${workBookId}/solve-status` : null,
    {
      revalidateOnFocus: false,
    },
  );

  const [, restartWorkbookSession, isRestarting] = useSafeAction(
    restartWorkbookSessionAction,
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
    <div
      onClick={handleSolve}
      className="group pointer-events-auto w-full py-16 flex flex-col gap-4 items-center justify-center relative"
    >
      <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 absolute inset-0 bg-linear-to-b from-transparent to-primary/10" />
      {!isLoading && (
        <p className="text-muted-foreground font-medium">
          {status?.status == "in-progress"
            ? "풀고 있는 문제집이 있습니다. 이어서 풀까요, 아니면 새로 시작할까요?"
            : "전체 문제를 풀려면 시작해보세요"}
        </p>
      )}
      <Button
        size="lg"
        className="rounded-full font-bold text-lg px-10 py-6 group-hover:scale-105 transition-all group-hover:bg-primary/90"
      >
        문제집 풀러가기
        {isLoading && <LoaderIcon className="size-4 animate-spin" />}
      </Button>
      <WorkbookSolveNavigatePopup
        open={openNavigatePopup}
        onOpenChange={setOpenNavigatePopup}
        isRestarting={isRestarting}
        onRestart={handleRestart}
        onContinue={() => router.push(solveHref)}
      />
    </div>
  );
}
