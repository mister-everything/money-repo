"use client";

import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/query/use-categories";
import { CategorySelector } from "../category-selector";

export function WorkbookInstantCategoryStep({
  onCategoryChange,
  categoryId,
  onNextStep,
}: {
  onCategoryChange: (ct?: number) => void;
  categoryId?: number;
  onNextStep: () => void;
}) {
  const { data: categories = [], isLoading } = useCategories({
    onSuccess: (data) => {
      if (data.length > 0) {
        const flatCategories = data.flatMap((category) => [
          category,
          ...category.children,
        ]);
        const category = flatCategories.find(
          (category) => category.id === categoryId,
        );
        if (category) {
          onCategoryChange(category?.id);
        }
      }
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span>풀고 싶은 소재를 골라주세요</span>
      </div>
      <CategorySelector
        categories={categories}
        isLoading={isLoading}
        onCategoryChange={onCategoryChange}
        value={categoryId}
      />

      <div className="w-full flex">
        <Button
          className="ml-auto"
          onClick={onNextStep}
          disabled={!categoryId || isLoading}
        >
          다음
        </Button>
      </div>
    </div>
  );
}
