"use client";

import {
  isPublished,
  SessionInProgress,
  SessionSubmitted,
  WorkBookWithoutBlocks,
} from "@service/solves/shared";
import { format } from "date-fns";
import { LoaderIcon, MoreVerticalIcon, Siren } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { WorkbookDifficulty } from "./workbook-difficulty";
import { WorkbookReportDialog } from "./workbook-report-dialog";

interface WorkbookCardProps {
  workBook: WorkBookWithoutBlocks;
  session?: SessionInProgress | SessionSubmitted;
  onDelete?: () => void;
  onTogglePublic?: () => void;
  onCopy?: () => void;
  onReport?: () => void;
  isOwner?: boolean;
  isPendingDelete?: boolean;
  isPendingTogglePublic?: boolean;
  isPendingCopy?: boolean;
  // 신고하기 기능 표시 여부 (기본값: true, 공개된 문제집에서만 표시)
  showReport?: boolean;
}

export function WorkbookCard({
  workBook,
  session,
  onDelete,
  onTogglePublic,
  onCopy,
  onReport,
  isOwner,
  isPendingCopy,
  isPendingDelete,
  isPendingTogglePublic,
  showReport = true,
}: WorkbookCardProps) {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const published = useMemo(() => {
    return isPublished(workBook);
  }, [workBook.publishedAt]);

  const isPending = useMemo(
    () => isPendingTogglePublic || isPendingDelete,
    [isPendingDelete, isPendingTogglePublic]
  );

  const hasAction = useMemo(() => {
    return Boolean(
      onDelete ||
        onTogglePublic ||
        onCopy ||
        onReport ||
        (showReport && published)
    );
  }, [onDelete, onTogglePublic, onCopy, onReport, showReport, published]);

  return (
    <Card className="w-full min-h-72 hover:border-primary cursor-pointer hover:shadow-lg transition-shadow shadow-none rounded-md h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between min-w-0 ">
          <CardTitle className="text-xl font-bold truncate">
            {workBook.title || "제목이 없습니다."}
          </CardTitle>
          {hasAction && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size={"sm"}
                  className="p-2! data-[state=open]:bg-accent"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVerticalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="bottom"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {showReport && published && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      if (onReport) {
                        onReport();
                      } else {
                        setReportDialogOpen(true);
                      }
                    }}
                  >
                    <Siren className="size-4" />
                    신고하기
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem disabled={isPending} onClick={onDelete}>
                    {isPendingDelete ? (
                      <>
                        삭제중...
                        <LoaderIcon className="size-3 animate-spin" />
                      </>
                    ) : (
                      "삭제하기"
                    )}
                  </DropdownMenuItem>
                )}
                {onCopy && (
                  <DropdownMenuItem disabled={isPendingCopy} onClick={onCopy}>
                    {isPendingCopy ? (
                      <>
                        복사중...
                        <LoaderIcon className="size-3 animate-spin" />
                      </>
                    ) : (
                      "복사하여 새로 생성"
                    )}
                  </DropdownMenuItem>
                )}
                {onTogglePublic && (
                  <>
                    <DropdownMenuItem
                      disabled={workBook.isPublic || isPending}
                      onClick={(e) => {
                        e.preventDefault();
                        onTogglePublic?.();
                      }}
                    >
                      {isPendingTogglePublic && !workBook.isPublic ? (
                        <>
                          공개로 전환중...
                          <LoaderIcon className="size-3 animate-spin" />
                        </>
                      ) : (
                        "공개하기"
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!workBook.isPublic || isPending}
                      onClick={(e) => {
                        e.preventDefault();
                        onTogglePublic?.();
                      }}
                    >
                      {isPendingTogglePublic && workBook.isPublic ? (
                        <>
                          비공개로 전환중...
                          <LoaderIcon className="size-3 animate-spin" />
                        </>
                      ) : (
                        "비공개로 전환"
                      )}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <p className="text-muted-foreground line-clamp-2 text-sm text-ellipsis ">
          {workBook.description || "설명이 없습니다."}
        </p>

        <div className="flex items-center gap-2">
          {session?.status === "submitted" ? (
            <>
              <Badge
                variant="secondary"
                className="w-fit text-primary rounded-full bg-primary/10 py-1"
              >
                완료
              </Badge>
              <Badge
                variant="secondary"
                className="w-fit text-primary rounded-full bg-primary/10 py-1"
              >
                정답 {session.correctBlocks}/{session.totalBlocks}
              </Badge>
            </>
          ) : session?.status === "in-progress" ? (
            <Badge
              variant="secondary"
              className="w-fit bg-blue-50 dark:bg-blue-950 text-blue-500 dark:text-blue-100 rounded-full py-1"
            >
              풀이 중
            </Badge>
          ) : session ? (
            <Badge variant="secondary">풀지 않음</Badge>
          ) : !published ? (
            <Badge
              variant="secondary"
              className="w-fit  bg-blue-50 dark:bg-blue-950 text-blue-500 :dark:text-blue-100 rounded-full py-1"
            >
              제작중
            </Badge>
          ) : null}
          {isOwner && (
            <Badge
              variant="secondary"
              className="w-fit bg-point/10 text-point rounded-full py-1"
            >
              내가 만든 문제집
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="flex flex-wrap gap-2 mb-4">
          {workBook.tags?.slice(0, 8).map((tag) => (
            <span
              key={tag.id}
              className="bg-secondary text-secondary-foreground text-xs px-2 py-1.5 rounded-md font-medium"
            >
              # {tag.name}
            </span>
          ))}
          {workBook.tags && workBook.tags.length > 4 && (
            <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1.5 rounded-md font-medium">
              +{workBook.tags.length - 4}
            </span>
          )}
        </div>
        {published && (
          <WorkbookDifficulty
            count={workBook.firstSolverCount ?? 0}
            sum={workBook.firstScoreSum ?? 0}
          />
        )}
        <div className="flex items-center gap-2 mt-auto">
          {workBook.publishedAt && (
            <span className="text-xs text-muted-foreground shrink-0">
              {format(new Date(workBook.publishedAt!), "yyyy.MM.dd")}
            </span>
          )}
          <div className="text-xs text-muted-foreground mt-auto ml-auto flex items-center gap-1">
            <Avatar className="size-3.5">
              <AvatarImage
                alt={workBook.ownerName ?? "-"}
                src={workBook.ownerProfile ?? ""}
              />
              <AvatarFallback className="text-3xs">
                {workBook.ownerName?.charAt(0) ?? "?"}
              </AvatarFallback>
            </Avatar>
            {workBook.ownerName ?? "-"}
          </div>
        </div>
      </CardContent>

      {/* 신고하기 다이얼로그 */}
      <WorkbookReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        workbookId={workBook.id}
      />
    </Card>
  );
}
