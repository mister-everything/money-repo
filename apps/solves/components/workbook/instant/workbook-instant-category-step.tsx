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
  const { data: categories = [], isLoading } = useCategories();

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2 font-semibold">
          <span>풀고 싶은 소재를 골라주세요</span>
        </div>
        <CategorySelector
          categories={categories}
          isLoading={isLoading}
          onCategoryChange={onCategoryChange}
          showIcon
          value={categoryId}
        />
      </div>

      <div className="w-full flex mt-4">
        <Button
          className="ml-auto shadow-none w-full"
          onClick={onNextStep}
          size={"lg"}
          disabled={!categoryId || isLoading}
        >
          다음
        </Button>
      </div>
    </div>
  );
}
