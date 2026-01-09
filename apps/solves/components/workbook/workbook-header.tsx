"use client";

import {
  CategoryTree,
  WORKBOOK_DESCRIPTION_MAX_LENGTH,
  WORKBOOK_TITLE_MAX_LENGTH,
  WorkBookWithoutBlocks,
} from "@service/solves/shared";
import { isNull } from "@workspace/util";
import { ChevronRightIcon, HashIcon, PencilIcon } from "lucide-react";
import { ComponentProps, Fragment, useCallback, useMemo } from "react";
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
import { useCategories } from "@/hooks/query/use-categories";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { BlockEditCheckButton } from "./block/block-edit-check-button";
import { WorkBookComponentMode } from "./block/types";
import { WorkBookCategoryUpdatePopup } from "./workbook-category-update-popup";

type WorkbookHeaderProps = {
  book: WorkBookWithoutBlocks;
  mode: WorkBookComponentMode;
  onModeChange?: (mode: WorkBookComponentMode) => void;
  onChangeTitle?: (title: string) => void;
  onChangeDescription?: (description: string) => void;
  onChangeTags?: (tags: string[]) => void;
  onSavedCategory?: (categoryId: number) => void;
} & ComponentProps<typeof Card>;

export function WorkbookHeader({
  book,
  mode,
  onModeChange,
  onChangeTitle,
  onChangeDescription,
  onChangeTags,
  onSavedCategory,
  className,
  ...cardProps
}: WorkbookHeaderProps) {
  const { data: categories = [], isLoading: isCategoriesLoading } =
    useCategories();

  const placeholder = useMemo(() => {
    if (mode == "preview" || mode == "edit") return "문제집 제목을 작성하세요";
    return "문제집 제목이 비어있습니다.";
  }, [mode]);

  const selectedCategory = useMemo(() => {
    const flatCategories = categories.flatMap((c) => [c, ...c.children]);
    const category = flatCategories.find((c) => c.id === book.categoryId);
    if (!category) return [];
    if (category.parentId === null) return [category];
    return [
      flatCategories.find((c) => c.id === category.parentId),
      category,
    ].filter(Boolean) as CategoryTree[];
  }, [categories, book.categoryId]);

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

  const feedback = useMemo(() => {
    if (mode != "edit") return;
    if (!book.title?.trim?.()) return "문제집 제목을 입력해주세요.";
    if (!book.description?.trim?.()) return "문제집 설명을 입력해주세요.";
  }, [mode, book.title, book.description]);

  return (
    <Card {...cardProps} className={cn("shadow-none", className)}>
      <CardHeader>
        <CardTitle className="min-w-0 text-foreground gap-2 flex items-center flex-wrap">
          {mode != "edit" ? (
            <h2 className="text-xl truncate mr-auto">
              {book.title || placeholder}
            </h2>
          ) : (
            <Input
              placeholder={placeholder}
              autoFocus
              className="text-xl! flex-1 min-w-0 mr-auto"
              maxLength={WORKBOOK_TITLE_MAX_LENGTH}
              value={book.title}
              onChange={handleChangeTitle}
            />
          )}
          {isCategoriesLoading ? (
            <Skeleton className="w-24 h-8 rounded-full" />
          ) : mode === "edit" ? (
            <WorkBookCategoryUpdatePopup
              workBookId={book.id}
              onSavedCategory={(categoryId) => {
                onSavedCategory?.(categoryId);
              }}
            >
              {isNull(book.categoryId) ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                >
                  소재 선택
                </Button>
              ) : (
                selectedCategory.length > 0 && (
                  <Button
                    size="sm"
                    className="rounded-full text-xs"
                    variant={"secondary"}
                  >
                    {selectedCategory.map((c, i) => {
                      if (i == 0) return <Fragment key={i}>{c.name}</Fragment>;
                      return (
                        <Fragment key={i}>
                          <ChevronRightIcon className="size-3.5" />
                          {c.name}
                        </Fragment>
                      );
                    })}
                  </Button>
                )
              )}
            </WorkBookCategoryUpdatePopup>
          ) : (
            selectedCategory.length > 0 && (
              <Button size="sm" className="rounded-full text-xs cursor-default">
                {selectedCategory.map((c, i) => {
                  if (i == 0) return <span key={i}>{c.name}</span>;
                  return (
                    <Fragment key={i}>
                      <ChevronRightIcon className="size-3.5" />
                      <span>{c.name}</span>
                    </Fragment>
                  );
                })}
              </Button>
            )
          )}
          {mode === "preview" && onModeChange ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onModeChange("edit")}
                  variant="ghost"
                  size="icon"
                >
                  <PencilIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>문제집 수정하기</TooltipContent>
            </Tooltip>
          ) : mode === "edit" && onModeChange ? (
            <BlockEditCheckButton
              feedback={feedback}
              onClick={() => onModeChange("preview")}
            />
          ) : null}
        </CardTitle>
        {mode == "edit" ? (
          <Textarea
            placeholder="문제집 한줄 설명을 작성하세요"
            className="resize-none max-h-[100px]"
            maxLength={WORKBOOK_DESCRIPTION_MAX_LENGTH}
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
