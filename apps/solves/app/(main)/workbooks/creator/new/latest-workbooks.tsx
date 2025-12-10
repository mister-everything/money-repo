"use client";

import { isPublished, WorkBookWithoutBlocks } from "@service/solves/shared";
import Link from "next/link";
import { useState } from "react";
import {
  deleteWorkbookAction,
  softDeleteWorkbookAction,
  toggleWorkBookPublicAction,
} from "@/actions/workbook";
import { notify } from "@/components/ui/notify";
import { WorkbookCard } from "@/components/workbook/workbook-card";
import { useSafeAction } from "@/lib/protocol/use-safe-action";

interface LatestWorkbooksProps {
  initialWorkBooks: WorkBookWithoutBlocks[];
}

export function LatestWorkbooks({ initialWorkBooks }: LatestWorkbooksProps) {
  const [workbooks, setWorkbooks] =
    useState<WorkBookWithoutBlocks[]>(initialWorkBooks);

  const [, deleteWorkbook, isPendingDeleteWorkbook] = useSafeAction(
    deleteWorkbookAction,
    {
      onSuccess: (result) => {
        setWorkbooks((prev) =>
          prev.filter((book) => book.id !== result.deletedWorkBookId),
        );
      },
    },
  );

  const [, softDeleteWorkbook, isPendingSoftDeleteWorkbook] = useSafeAction(
    softDeleteWorkbookAction,
    {
      onSuccess: (result) => {
        setWorkbooks((prev) =>
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
        setWorkbooks((prev) =>
          prev.map((book) =>
            book.id === workBookId ? { ...book, isPublic } : book,
          ),
        );
      },
    },
  );

  const handleDeleteWorkbook = async (
    workBookId: string,
    isSoftDelete: boolean,
  ) => {
    const confirm = await notify.confirm({
      title: "문제집을 정말 삭제할까요?",
      description: isSoftDelete
        ? "이미 푼 사용자들에게는 영향을 주지 않습니다."
        : "삭제한 문제집은 다시 복구할 수 없어요",
      okText: "삭제하기",
      cancelText: "취소",
    });
    if (!confirm) {
      return;
    }
    if (isSoftDelete) {
      await softDeleteWorkbook({ workBookId, reason: "owner_request" });
    } else {
      await deleteWorkbook({ workBookId });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {workbooks.map((book) => {
        const published = isPublished(book);
        const href = `/workbooks/${book.id}/${published ? "report" : "edit"}`;
        const onTogglePublic = published
          ? () =>
              toggleWorkBookPublic({
                workBookId: book.id,
                isPublic: !book.isPublic,
              })
          : undefined;

        return (
          <Link href={href} key={book.id}>
            <WorkbookCard
              key={book.id}
              workBook={book}
              onTogglePublic={onTogglePublic}
              isPendingTogglePublic={isPendingToggleWorkBookPublic}
              onDelete={() => handleDeleteWorkbook(book.id, published)}
              isPendingDelete={
                isPendingDeleteWorkbook || isPendingSoftDeleteWorkbook
              }
            />
          </Link>
        );
      })}
    </div>
  );
}
