"use client";

import { WorkBookWithoutBlocks } from "@service/solves/shared";
import { CheckIcon, HashIcon, PencilIcon } from "lucide-react";
import { ComponentProps, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkBookComponentMode } from "./types";

type WorkbookHeaderProps = {
  book: WorkBookWithoutBlocks;
  mode: WorkBookComponentMode;
  onModeChange?: (mode: WorkBookComponentMode) => void;
  onChangeTitle?: (title: string) => void;
  onChangeDescription?: (description: string) => void;
  onChangeTags?: (tags: string[]) => void;
} & ComponentProps<typeof Card>;

export function WorkbookHeader({
  book,
  mode,
  onModeChange,
  onChangeTitle,
  onChangeDescription,
  onChangeTags,
  ...cardProps
}: WorkbookHeaderProps) {
  const placeholder = useMemo(() => {
    if (mode == "preview" || mode == "edit") return "문제집 제목을 작성하세요";
    return "문제집 제목이 비어있습니다.";
  }, [mode]);

  const handleChangeTitle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChangeTitle?.(e.currentTarget.value);
    },
    [],
  );

  const handleChangeDescription = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChangeDescription?.(e.currentTarget.value);
    },
    [],
  );

  return (
    <Card {...cardProps}>
      <CardHeader>
        <CardTitle className="min-w-0 text-foreground gap-2 flex items-center">
          {mode != "edit" ? (
            <h2 className="text-xl truncate">{book.title || placeholder}</h2>
          ) : (
            <Input
              placeholder={placeholder}
              autoFocus
              className="text-xl!"
              value={book.title}
              onChange={handleChangeTitle}
            />
          )}
          {mode === "preview" && onModeChange ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onModeChange("edit")}
                  className="ml-auto"
                  variant="ghost"
                  size="icon"
                >
                  <PencilIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>문제집 수정하기</TooltipContent>
            </Tooltip>
          ) : mode === "edit" && onModeChange ? (
            <Button
              onClick={() => onModeChange("preview")}
              className="ml-auto"
              variant="ghost"
              size="icon"
            >
              <CheckIcon />
            </Button>
          ) : null}
        </CardTitle>
        {mode == "edit" ? (
          <Textarea
            placeholder="문제집 한줄 설명을 작성하세요"
            className="resize-none max-h-[100px]"
            value={book.description || ""}
            onChange={handleChangeDescription}
          />
        ) : (
          book.description && (
            <CardDescription>{book.description}</CardDescription>
          )
        )}
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 flex-wrap justify-end">
          {book.tags.map((tag) => (
            <Badge variant={"secondary"} key={tag.id} className="rounded-xs">
              <HashIcon className="size-2.5" />
              {tag.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
