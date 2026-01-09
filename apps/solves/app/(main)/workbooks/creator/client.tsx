"use client";
import {
  MAX_INPROGRESS_WORKBOOK_CREATE_COUNT,
  WorkBookWithoutBlocks,
} from "@service/solves/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  copyWorkbookAction,
  deleteWorkbookAction,
  softDeleteWorkbookAction,
  toggleWorkBookPublicAction,
} from "@/actions/workbook";
import { notify } from "@/components/ui/notify";
import { WorkbookCard } from "@/components/workbook/workbook-card";
import { useSafeAction } from "@/lib/protocol/use-safe-action";

interface WorkbooksCreatorClientProps {
  initialInProgressWorkbooks: WorkBookWithoutBlocks[];
  initialPublishedWorkbooks: WorkBookWithoutBlocks[];
}

export function WorkbooksCreatorClient({
  initialInProgressWorkbooks,
  initialPublishedWorkbooks,
}: WorkbooksCreatorClientProps) {
  const router = useRouter();
  const [inProgressWorkbooks, setInProgressWorkbooks] = useState<
    WorkBookWithoutBlocks[]
  >([]);
  const [publishedWorkbooks, setPublishedWorkbooks] = useState<
    WorkBookWithoutBlocks[]
  >([]);

  const [, deleteWorkbook, isPendingDeleteWorkbook] = useSafeAction(
    deleteWorkbookAction,
    {
      onSuccess: (result) => {
        setInProgressWorkbooks((prev) =>
          prev.filter((book) => book.id !== result.deletedWorkBookId),
        );
      },
    },
  );

  const [, softDeleteWorkbook, isPendingSoftDeleteWorkbook] = useSafeAction(
    softDeleteWorkbookAction,
    {
      onSuccess: (result) => {
        setPublishedWorkbooks((prev) =>
          prev.filter((book) => book.id !== result.softDeletedWorkBookId),
        );
      },
    },
  );
  const [, toggleWorkBookPublic, isPendingToggleWorkBookPublic] = useSafeAction(
    toggleWorkBookPublicAction,
    {
      onSuccess: (result) => {
        const { isPublic, workBookId } = result;
        setInProgressWorkbooks((prev) =>
          prev.map((book) =>
            book.id === workBookId ? { ...book, isPublic } : book,
          ),
        );
        setPublishedWorkbooks((prev) =>
          prev.map((book) =>
            book.id === workBookId ? { ...book, isPublic } : book,
          ),
        );
      },
    },
  );

  const [, copyWorkbook, isPendingCopyWorkbook] = useSafeAction(
    copyWorkbookAction,
    {
      failMessage: "문제집 복사에 실패했습니다.",
      successMessage: "문제집 복사가 완료되었어요. 화면 이동중...",
      onSuccess: (result) => {
        router.push(`/workbooks/${result.copiedWorkBookId}/edit`);
      },
    },
  );
  const handleDeleteWorkbook = async (workBookId: string) => {
    const confirm = await notify.confirm({
      title: "문제집을 정말 삭제할까요?",
      description: "삭제한 문제집은 다시 복구할 수 없어요",
      okText: "삭제하기",
      cancelText: "취소",
    });
    if (!confirm) {
      return;
    }
    await deleteWorkbook({ workBookId });
  };
  const handleSoftDeleteWorkbook = async (workBookId: string) => {
    const confirm = await notify.confirm({
      title: "문제집을 정말 삭제할까요?",
      description: "이미 푼 사용자들에게는 영향을 주지 않습니다.",
      okText: "삭제하기",
      cancelText: "취소",
    });
    if (!confirm) {
      return;
    }
    await softDeleteWorkbook({ workBookId, reason: "owner_request" });
  };

  const isMaxInProgressWorkbookCreateCount = useMemo(() => {
    return inProgressWorkbooks.length >= MAX_INPROGRESS_WORKBOOK_CREATE_COUNT;
  }, [inProgressWorkbooks]);

  const handleCopyWorkbook = async (workBookId: string) => {
    if (isMaxInProgressWorkbookCreateCount) {
      notify.alert({
        title: `아직 완성되지 않은 문제집이 있어요.`,
        description: `완성되지 않은 문제집은 최대 ${MAX_INPROGRESS_WORKBOOK_CREATE_COUNT}개까지 진행할 수 있어요. `,
      });
      return;
    }
    const confirm = await notify.confirm({
      title: "문제집을 복사할까요?",
      description: "복사한 문제집은 수정 가능합니다.",
      okText: "복사하기",
      cancelText: "취소",
    });
    if (!confirm) {
      return;
    }
    await copyWorkbook({ workBookId });
  };

  useEffect(() => {
    setInProgressWorkbooks(initialInProgressWorkbooks);
    setPublishedWorkbooks(initialPublishedWorkbooks);
  }, [initialInProgressWorkbooks, initialPublishedWorkbooks]);

  return (
    <div className="p-6 w-full">
      {inProgressWorkbooks.length > 0 && (
        <div className="flex flex-col gap-3 mb-12">
          <label className="text-sm font-bold text-foreground">
            작업 중인 문집집
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressWorkbooks.map((book) => (
              <Link href={`/workbooks/${book.id}/edit`} key={book.id}>
                <WorkbookCard
                  workBook={book}
                  onDelete={() => handleDeleteWorkbook(book.id)}
                  isPendingDelete={isPendingDeleteWorkbook}
                  onCopy={
                    isMaxInProgressWorkbookCreateCount
                      ? undefined
                      : () => handleCopyWorkbook(book.id)
                  }
                  isPendingCopy={isPendingCopyWorkbook}
                />
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3 mb-6">
        <label className="text-sm font-bold text-foreground">
          완성된 문제집
        </label>
        {publishedWorkbooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publishedWorkbooks.map((book) => (
              <Link href={`/workbooks/${book.id}/report`} key={book.id}>
                <WorkbookCard
                  workBook={book}
                  onCopy={
                    isMaxInProgressWorkbookCreateCount
                      ? undefined
                      : () => handleCopyWorkbook(book.id)
                  }
                  isPendingCopy={isPendingCopyWorkbook}
                  onDelete={() => handleSoftDeleteWorkbook(book.id)}
                  isPendingDelete={isPendingSoftDeleteWorkbook}
                  onTogglePublic={() =>
                    toggleWorkBookPublic({
                      workBookId: book.id,
                      isPublic: !book.isPublic,
                    })
                  }
                  isPendingTogglePublic={isPendingToggleWorkBookPublic}
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-18 w-full h-full flex items-center justify-center">
            <p>아직 배포된 문제집이 없어요</p>
          </div>
        )}
      </div>
    </div>
  );
}
