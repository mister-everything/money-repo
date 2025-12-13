"use client";

import {
  isPublished,
  SessionInProgress,
  SessionSubmitted,
  WorkBookWithoutBlocks,
} from "@service/solves/shared";
import { format } from "date-fns";
import { LoaderIcon, MoreVerticalIcon } from "lucide-react";
import { useMemo } from "react";

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

interface WorkbookCardProps {
  workBook: WorkBookWithoutBlocks;
  session?: SessionInProgress | SessionSubmitted;
  onDelete?: () => void;
  onTogglePublic?: () => void;
  isPendingDelete?: boolean;
  isPendingTogglePublic?: boolean;
}

export function WorkbookCard({
  workBook,
  session,
  onDelete,
  onTogglePublic,
  isPendingDelete,
  isPendingTogglePublic,
}: WorkbookCardProps) {
  const isPending = useMemo(
    () => isPendingTogglePublic || isPendingDelete,
    [isPendingDelete, isPendingTogglePublic],
  );

  const published = useMemo(() => {
    return isPublished(workBook);
  }, [workBook.publishedAt]);

  return (
    <Card className="w-full min-h-72 hover:border-primary cursor-pointer hover:shadow-lg transition-shadow shadow-none rounded-md h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between min-w-0 ">
          <CardTitle className="text-xl font-bold truncate">
            {workBook.title || "제목이 없습니다."}
          </CardTitle>
          {Boolean(onDelete || onTogglePublic) && (
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
              className="w-fit bg-blue-50 text-blue-500 rounded-full py-1"
            >
              풀이 중
            </Badge>
          ) : session ? (
            <Badge variant="secondary">풀지 않음</Badge>
          ) : !published ? (
            <Badge
              variant="secondary"
              className="w-fit bg-blue-50 text-blue-500 rounded-full py-1"
            >
              제작중
            </Badge>
          ) : null}
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
              발행 일자: {format(new Date(workBook.publishedAt!), "yyyy.MM.dd")}
            </span>
          )}
          <div className="text-xs text-muted-foreground mt-auto ml-auto flex items-center gap-1">
            <Avatar className="size-3.5">
              <AvatarImage
                alt={workBook.ownerName}
                src={workBook.ownerProfile ?? ""}
              />
              <AvatarFallback className="text-3xs">
                {workBook.ownerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {workBook.ownerName}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
