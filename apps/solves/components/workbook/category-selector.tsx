"use client";

import { CategoryTree } from "@service/solves/shared";
import { isNull } from "@workspace/util";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ButtonSelect } from "../ui/button-select";
import { CategoryIcon } from "../ui/category-icon";
import { Skeleton } from "../ui/skeleton";

interface CategoryMultipleSelectorProps {
  /** 현재 선택된 카테고리 ID */
  value?: number[];
  /** 루트 카테고리 목록 (tree 구조) */
  categories?: CategoryTree[];
  isLoading?: boolean;
  /** 카테고리 선택 시 호출 */
  onCategoryChange?: (categoryId: number[]) => void;
  maxSelectedCount?: number;
}

export function CategoryMultipleSelector({
  value = [],
  categories = [],
  isLoading = false,
  onCategoryChange,
  maxSelectedCount = 5,
}: CategoryMultipleSelectorProps) {
  const [visibleCategoryId, setVisibleCategoryId] = useState<number | null>(
    null,
  );

  // 현재 펼쳐진 루트 카테고리
  const visibleCategory = useMemo(() => {
    return categories?.find((category) => category.id === visibleCategoryId);
  }, [visibleCategoryId, categories]);

  // 현재 펼쳐진 루트 카테고리의 자식 카테고리들
  const visibleChildren = useMemo(() => {
    if (!visibleCategory) return [];
    return visibleCategory.children ?? [];
  }, [visibleCategory]);

  const handleRootClick = () => {
    if (isNull(visibleCategoryId)) return;
    const isSelected = value.includes(visibleCategoryId!);
    const childrenIds = visibleChildren.map((v) => v.id);
    const excludeChildrenIds = value.filter((c) => !childrenIds.includes(c));
    const next = isSelected
      ? excludeChildrenIds.filter((v) => v != visibleCategoryId)
      : [...excludeChildrenIds, visibleCategoryId!];
    onCategoryChange?.(next);
  };

  const handleChildClick = (id: number) => {
    if (isNull(visibleCategoryId)) return;
    const isRootChecked = value.includes(visibleCategoryId);
    if (isRootChecked)
      return onCategoryChange?.([
        ...value.filter((v) => v != visibleCategoryId),
        id,
      ]);
    const isChecked = value.includes(id);
    if (isChecked) return onCategoryChange?.(value.filter((v) => v != id));
    const next = [...value, id];
    const childrenIds = visibleChildren.map((v) => v.id);
    const isAllCheck = childrenIds.every((v) => next.includes(v));
    if (isAllCheck)
      return onCategoryChange?.([
        visibleCategoryId,
        ...value.filter((v) => !childrenIds.includes(v)),
      ]);
    if (next.length > maxSelectedCount) return;

    onCategoryChange?.(next);
  };

  return (
    <div className="mb-4">
      <div className="flex overflow-x-auto gap-0.5 py-2">
        {isLoading ? (
          <Skeleton className="w-full h-26" />
        ) : categories?.length ? (
          categories.map((category) => {
            return (
              <div
                key={category.id}
                onClick={() => setVisibleCategoryId(category.id)}
                className={cn(
                  "flex flex-col items-center gap-2 py-3.5 justify-center min-w-28 cursor-pointer group",
                )}
              >
                <Button
                  className={cn(
                    "size-12! bg-primary/5 group-hover:bg-primary transition-all text-primary group-hover:text-primary-foreground",
                    visibleCategoryId === category.id &&
                      "bg-primary text-primary-foreground",
                  )}
                >
                  <CategoryIcon categoryName={category.name} />
                </Button>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    visibleCategoryId === category.id && "font-bold",
                  )}
                >
                  {category.name}
                </span>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center gap-2 justify-center w-full h-26">
            <span className="text-sm font-bold">카테고리가 없습니다</span>
          </div>
        )}
      </div>

      {visibleCategory && (
        <div className="flex flex-wrap items-center gap-2 w-full">
          <Badge
            variant="secondary"
            onClick={handleRootClick}
            className={cn(
              "cursor-pointer rounded-full py-1.5  hover:bg-primary/10 transition-all",
              value.includes(visibleCategory.id) &&
                "bg-primary text-primary-foreground hover:text-primary-foreground hover:bg-primary",
            )}
          >
            {visibleCategory.name} 전체
          </Badge>
          {visibleChildren.map((child) => {
            const isChecked = value.includes(child.id);
            return (
              <Badge
                key={child.id}
                variant="secondary"
                onClick={() => handleChildClick(child.id)}
                className={cn(
                  "rounded-full cursor-pointer py-1.5 hover:bg-primary/5 hover:border-primary transition-all",
                  isChecked &&
                    "bg-primary/5 hover:bg-primary/10 border-primary",
                )}
              >
                {child.name}
              </Badge>
            );
          })}
        </div>
      )}
      {value.length >= maxSelectedCount && (
        <p className="px-2 fade-300 text-muted-foreground text-xs mt-2">
          최대 {maxSelectedCount}개를 선택 할 수 있어요.
        </p>
      )}
    </div>
  );
}

interface CategorySelectorProps {
  /** 현재 선택된 카테고리 ID */
  value?: number;
  /** 루트 카테고리 목록 (tree 구조) */
  categories?: CategoryTree[];
  isLoading?: boolean;
  /** 카테고리 선택 시 호출 */
  onCategoryChange?: (categoryId: number | undefined) => void;
  className?: string;
}

export function CategorySelector({
  value,
  categories = [],
  isLoading = false,
  onCategoryChange,
  className,
}: CategorySelectorProps) {
  const flatedCategories = useMemo(
    () => categories.flatMap((c) => [c, ...c.children]),
    [categories],
  );

  const selectedCategory = useMemo(() => {
    return flatedCategories.find((v) => v.id == value);
  }, [flatedCategories, value]);

  const oneDepthCategory = useMemo(() => {
    if (!selectedCategory) return;
    if (isNull(selectedCategory.parentId)) return selectedCategory;
    return flatedCategories.find((c) => c.id == selectedCategory.parentId);
  }, [flatedCategories, selectedCategory]);

  const oneDepthCategories = useMemo(() => {
    return categories;
  }, [categories]);

  const twoDepthCategories = useMemo(() => {
    return oneDepthCategory?.children ?? [];
  }, [oneDepthCategory]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {isLoading ? (
        <Skeleton className="w-full h-16" />
      ) : (
        <ButtonSelect
          value={oneDepthCategory?.id?.toString()}
          onChange={(value) =>
            onCategoryChange?.(value ? Number(value) : undefined)
          }
          options={oneDepthCategories.map((category) => ({
            label: category.name,
            value: category.id.toString(),
          }))}
        />
      )}

      {twoDepthCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 fade-300">
          <Button
            variant="secondary"
            size={"sm"}
            onClick={() => onCategoryChange?.(oneDepthCategory?.id)}
            className={cn(
              "cursor-pointer rounded-full hover:bg-primary/10 transition-all",
              value === oneDepthCategory?.id &&
                "bg-primary text-primary-foreground hover:text-primary-foreground hover:bg-primary",
            )}
          >
            {oneDepthCategory?.name} 전체
          </Button>
          {twoDepthCategories.map((category) => (
            <Button
              key={category.id}
              size={"sm"}
              variant="outline"
              onClick={() => onCategoryChange?.(category.id)}
              className={cn(
                "cursor-pointer rounded-full hover:bg-primary/10 transition-all shadow-none",
                value === category.id &&
                  "bg-primary/5 hover:bg-primary/10 ring-primary ring",
              )}
            >
              {category.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
