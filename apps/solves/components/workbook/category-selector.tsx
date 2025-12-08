"use client";

import { CategorySub, CategoryWithSubs } from "@service/solves/shared";
import { LightbulbIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

export interface CategorySelection {
  mainCategories?: CategoryWithSubs[];
  subCategories?: CategorySub[];
  categories?: CategoryWithSubs[];
  isLoading?: boolean;
}

interface CategorySelectorProps {
  value?: CategorySelection;
  categories?: CategoryWithSubs[];
  isLoading?: boolean;
  onCategoryChange?: (selection: CategorySelection) => void;
}

export function CategorySelector({
  value = { mainCategories: [], subCategories: [] },
  categories = [],
  isLoading = false,
  onCategoryChange,
}: CategorySelectorProps) {
  const [visibleCategoryId, setVisibleCategoryId] = useState<number | null>(
    null,
  );

  const selectedMainCategoryIds = useMemo(() => {
    return value.mainCategories?.map((category) => category.id) ?? [];
  }, [value.mainCategories]);

  const selectedSubCategoryIds = useMemo(() => {
    return value.subCategories?.map((category) => category.id) ?? [];
  }, [value.subCategories]);

  const visibleCategory = useMemo(() => {
    return categories?.find((category) => category.id === visibleCategoryId);
  }, [visibleCategoryId, categories]);

  const visibleSubCategories = useMemo(() => {
    if (!visibleCategory) return null;
    return visibleCategory?.subs;
  }, [visibleCategory]);

  const visibleSubCategoryIds = useMemo(() => {
    return visibleSubCategories?.map((category) => category.id) ?? [];
  }, [visibleSubCategories]);

  const isAllSelected = useMemo(() => {
    if (!visibleCategory) return false;
    return selectedMainCategoryIds.includes(visibleCategory.id);
  }, [value.mainCategories, visibleCategory]);

  const handleAllClick = () => {
    if (!visibleCategory) return;
    const isInclude = selectedMainCategoryIds.includes(visibleCategory.id);
    const nextMainCategories = isInclude
      ? value.mainCategories?.filter(
          (category) => category.id !== visibleCategory.id,
        )
      : [...(value.mainCategories ?? []), visibleCategory];

    onCategoryChange?.({
      mainCategories: nextMainCategories,
      subCategories:
        value.subCategories?.filter(
          (category) => !visibleSubCategoryIds.includes(category.id),
        ) ?? [],
    });
  };
  const handleSubCategoryClick = (subCategoryId: number) => {
    const subCategory = visibleSubCategories?.find(
      (v) => v.id === subCategoryId,
    )!;
    const prevSubCategories = value.subCategories ?? [];
    const prevMainCategories = (value.mainCategories ?? []).filter(
      (v) => v.id !== visibleCategory?.id,
    );

    const nextSubCategories = prevSubCategories.some(
      (v) => v.id === subCategoryId,
    )
      ? prevSubCategories.filter((v) => v.id !== subCategoryId)
      : [...prevSubCategories, subCategory];

    const isAllSelected = visibleSubCategoryIds.every((id) =>
      nextSubCategories.some((v) => v.id === id),
    );

    onCategoryChange?.({
      mainCategories: isAllSelected
        ? [...prevMainCategories, visibleCategory!]
        : prevMainCategories,
      subCategories: isAllSelected
        ? nextSubCategories.filter((v) => !visibleSubCategoryIds.includes(v.id))
        : nextSubCategories,
    });
  };

  return (
    <div>
      <div className="flex overflow-x-auto gap-0.5 py-2">
        {isLoading ? (
          <Skeleton className="w-full h-26" />
        ) : categories?.length ? (
          categories.map((category) => (
            <div
              key={category.id}
              onClick={() => setVisibleCategoryId(category.id)}
              className={cn(
                "flex flex-col items-center gap-2 py-3.5 justify-center min-w-28 cursor-pointer",
                "hover:bg-secondary/50 rounded-md",
                visibleCategoryId === category.id && "bg-secondary",
              )}
            >
              <Button className="size-12!">
                <LightbulbIcon />
              </Button>
              <span className="text-sm font-bold">{category.name}</span>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 justify-center w-full h-26">
            <span className="text-sm font-bold">카테고리가 없습니다</span>
          </div>
        )}
      </div>
      {visibleCategory && (
        <div className="flex flex-wrap items-center gap-2 w-full mb-4">
          <Badge
            variant="secondary"
            onClick={handleAllClick}
            className={cn(
              "rounded-full cursor-pointer py-1.5 hover:bg-primary/5 hover:border-primary transition-all",
              isAllSelected &&
                "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            전체
          </Badge>
          {visibleSubCategories?.map((subCategory) => {
            const isChecked = selectedSubCategoryIds.includes(subCategory.id);
            return (
              <Badge
                key={subCategory.id}
                variant="secondary"
                onClick={() => handleSubCategoryClick(subCategory.id)}
                className={cn(
                  "rounded-full cursor-pointer py-1.5 hover:bg-primary/5 hover:border-primary transition-all",
                  isChecked &&
                    "bg-primary/5 hover:bg-primary/10 border-primary",
                )}
              >
                {subCategory.name}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
