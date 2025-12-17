"use client";
import { isNull } from "@workspace/util";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonSelect } from "@/components/ui/button-select";
import { useCategories } from "@/hooks/query/use-categories";
import { WorkBookSituation } from "@/lib/const";

import { CategorySelector } from "./category-selector";

export function QuickWorkbookCreator() {
  const router = useRouter();
  const { data: categories = [], isLoading } = useCategories();
  const [situation, setSituation] = useState<string>("");

  const [selectedCategoryId, setSelectedCategoryId] = useState<
    number | undefined
  >(undefined);

  const handleNavigate = () => {
    const params = new URLSearchParams();

    if (situation) {
      params.set("situation", situation);
    }

    if (!isNull(selectedCategoryId)) {
      params.set("categoryId", selectedCategoryId.toString());
    }

    const queryString = params.toString();

    router.push(
      `/workbooks/creator/new${queryString ? `?${queryString}` : ""}`,
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-foreground">
        어떤 문제집을 만들고 싶나요?
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column: 상황, 유형, 연령대 */}
        <div className="space-y-4">
          {/* 상황 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">상황</label>
            <ButtonSelect
              value={situation}
              onChange={(value) => {
                setSituation(value as string);
              }}
              options={WorkBookSituation.map((value) => ({
                label: value.label,
                value: value.value,
              }))}
            />
          </div>
        </div>

        <CategorySelector
          categories={categories}
          isLoading={isLoading}
          onCategoryChange={setSelectedCategoryId}
          value={selectedCategoryId}
        />
      </div>

      <Button size="lg" className="w-full py-6" onClick={handleNavigate}>
        빠르게 문제집 만들기
      </Button>
    </div>
  );
}
