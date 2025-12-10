"use client";
import { WorkBookWithoutBlocks } from "@service/solves/shared";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  deleteWorkbookAction,
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
        setPublishedWorkbooks((prev) =>
          prev.filter((book) => book.id !== result.deletedWorkBookId),
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

  useEffect(() => {
    setInProgressWorkbooks(initialInProgressWorkbooks);
    setPublishedWorkbooks(initialPublishedWorkbooks);
  }, [initialInProgressWorkbooks, initialPublishedWorkbooks]);

  return (
    <div className="p-6 lg:p-8 w-full">
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
                  onTogglePublic={() =>
                    toggleWorkBookPublic({
                      workBookId: book.id,
                      isPublic: !book.isPublic,
                    })
                  }
                  isPendingDelete={isPendingDeleteWorkbook}
                  isPendingTogglePublic={isPendingToggleWorkBookPublic}
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
