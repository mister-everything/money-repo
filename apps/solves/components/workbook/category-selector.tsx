"use client";

import { Category, CategoryTree } from "@service/solves/shared";
import { LightbulbIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

interface CategorySelectorProps {
  /** 현재 선택된 카테고리 ID */
  value?: number;
  /** 루트 카테고리 목록 (tree 구조) */
  categories?: CategoryTree[];
  isLoading?: boolean;
  /** 카테고리 선택 시 호출 */
  onCategoryChange?: (categoryId: number | undefined) => void;
}

export function CategorySelector({
  value,
  categories = [],
  isLoading = false,
  onCategoryChange,
}: CategorySelectorProps) {
  // 현재 펼쳐진 루트 카테고리 ID
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

  // 선택된 카테고리가 현재 펼쳐진 루트 카테고리인지 확인
  const isRootSelected = useMemo(() => {
    if (!visibleCategory) return false;
    return value === visibleCategory.id;
  }, [value, visibleCategory]);

  // 선택된 카테고리가 현재 펼쳐진 루트 카테고리의 자식인지 확인
  const isChildSelected = (childId: number) => {
    return value === childId;
  };

  // 루트 카테고리 선택/해제 핸들러
  const handleRootClick = () => {
    if (!visibleCategory) return;
    if (isRootSelected) {
      onCategoryChange?.(undefined);
    } else {
      onCategoryChange?.(visibleCategory.id);
    }
  };

  // 자식 카테고리 선택/해제 핸들러
  const handleChildClick = (childId: number) => {
    if (value === childId) {
      onCategoryChange?.(undefined);
    } else {
      onCategoryChange?.(childId);
    }
  };

  // 선택된 카테고리 정보를 찾아서 표시
  const findSelectedCategoryInfo = ():
    | { root: Category; child?: Category }
    | undefined => {
    if (!value) return undefined;

    for (const root of categories) {
      if (root.id === value) {
        return { root };
      }
      for (const child of root.children ?? []) {
        if (child.id === value) {
          return { root, child };
        }
      }
    }
    return undefined;
  };

  const selectedInfo = findSelectedCategoryInfo();

  return (
    <div>
      <div className="flex overflow-x-auto gap-0.5 py-2">
        {isLoading ? (
          <Skeleton className="w-full h-26" />
        ) : categories?.length ? (
          categories.map((category) => {
            // 이 루트 카테고리나 그 자식이 선택되었는지 확인
            const hasSelection =
              value === category.id ||
              category.children?.some((child) => child.id === value);

            return (
              <div
                key={category.id}
                onClick={() => setVisibleCategoryId(category.id)}
                className={cn(
                  "flex flex-col items-center gap-2 py-3.5 justify-center min-w-28 cursor-pointer",
                  "hover:bg-secondary/50 rounded-md",
                  visibleCategoryId === category.id && "bg-secondary",
                )}
              >
                <Button
                  className={cn(
                    "size-12!",
                    hasSelection && "ring-2 ring-primary",
                  )}
                >
                  <LightbulbIcon />
                </Button>
                <span className="text-sm font-bold">{category.name}</span>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center gap-2 justify-center w-full h-26">
            <span className="text-sm font-bold">카테고리가 없습니다</span>
          </div>
        )}
      </div>

      {/* 선택된 카테고리 표시 */}
      {selectedInfo && (
        <div className="text-sm text-muted-foreground mb-2">
          선택:{" "}
          <span className="text-foreground font-medium">
            {selectedInfo.root.name}
            {selectedInfo.child && ` > ${selectedInfo.child.name}`}
          </span>
        </div>
      )}

      {visibleCategory && (
        <div className="flex flex-wrap items-center gap-2 w-full mb-4">
          <Badge
            variant="secondary"
            onClick={handleRootClick}
            className={cn(
              "rounded-full cursor-pointer py-1.5 hover:bg-primary/5 hover:border-primary transition-all",
              isRootSelected &&
                "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {visibleCategory.name} 전체
          </Badge>
          {visibleChildren.map((child) => {
            const isChecked = isChildSelected(child.id);
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
    </div>
  );
}
