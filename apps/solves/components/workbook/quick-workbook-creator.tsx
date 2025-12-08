"use client";

import {
  BlockType,
  blockDisplayNames,
  MAX_CATEGORY_COUNT,
} from "@service/solves/shared";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonSelect } from "@/components/ui/button-select";
import { useCategories } from "@/hooks/query/use-categories";
import {
  WorkBookAgeGroup,
  WorkBookDifficulty,
  WorkBookSituation,
} from "@/lib/const";
import { cn } from "@/lib/utils";
import { WorkbookOptions } from "@/store/types";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";

export function QuickWorkbookCreator() {
  const router = useRouter();

  const [mainCategory, setMainCategory] = useState<number>();

  const { data: categories = [], isLoading } = useCategories({
    onSuccess: (data) => {
      !mainCategory && setMainCategory(data[0].id);
    },
  });

  const [formData, setFormData] = useState<WorkbookOptions>({
    situation: "",
    categories: [],
    blockTypes: Object.keys(blockDisplayNames) as BlockType[],
    ageGroup: "all",
    difficulty: "",
  });

  const handleCategoryClick = (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      categories: (prev.categories.includes(categoryId)
        ? [...prev.categories.filter((id) => id !== categoryId)]
        : [...prev.categories, categoryId]
      ).slice(-MAX_CATEGORY_COUNT),
    }));
  };

  const subCategories = useMemo(() => {
    return (
      categories.find((category) => category.id === mainCategory)?.subs ?? []
    );
  }, [mainCategory, categories]);

  const handleNavigate = () => {
    const params = new URLSearchParams();

    if (formData.situation) {
      params.set("situation", formData.situation);
    }
    if (formData.ageGroup) {
      params.set("ageGroup", formData.ageGroup);
    }
    if (formData.difficulty) {
      params.set("difficulty", formData.difficulty);
    }
    if (formData.blockTypes.length > 0) {
      formData.blockTypes.forEach((type) => {
        params.append("blockTypes", type);
      });
    }
    if (formData.categories.length > 0) {
      formData.categories.forEach((categoryId) => {
        params.append("categories", categoryId.toString());
      });
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
              value={formData.situation}
              onChange={(value) => {
                setFormData({ ...formData, situation: value as string });
              }}
              options={WorkBookSituation.map((value) => ({
                label: value.label,
                value: value.value,
              }))}
            />
          </div>

          {/* 유형 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">유형</label>
            <ButtonSelect
              value={formData.blockTypes}
              multiple={true}
              onChange={(value) => {
                setFormData({ ...formData, blockTypes: value as BlockType[] });
              }}
              options={Object.entries(blockDisplayNames).map(
                ([value, label]) => ({
                  label,
                  value,
                }),
              )}
            />
          </div>

          {/* 연령대 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">연령대</label>
            <ButtonSelect
              value={formData.ageGroup}
              onChange={(value) => {
                setFormData({ ...formData, ageGroup: value as string });
              }}
              options={WorkBookAgeGroup.map((value) => ({
                label: value.label,
                value: value.value,
              }))}
            />
          </div>
        </div>

        {/* Right Column: 소재, 난이도 */}
        <div className="space-y-4">
          {/* 소재 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">소재</label>
            {isLoading ? (
              <Skeleton className="w-full h-16" />
            ) : (
              <ButtonSelect
                value={mainCategory?.toString()}
                onChange={(value) => setMainCategory(Number(value))}
                options={categories.map((value) => {
                  const allSubCategories = categories.flatMap(
                    (category) => category.subs,
                  );
                  const selectedSubCategories = formData.categories.map(
                    (categoryId) =>
                      allSubCategories.find(
                        (category) => category.id === categoryId,
                      ),
                  );
                  const selectedMainCategorySubCount =
                    selectedSubCategories.filter(
                      (s) => s?.mainId === value.id,
                    ).length;
                  return {
                    label: selectedMainCategorySubCount ? (
                      <div className="flex items-center gap-1.5">
                        {value.name}{" "}
                        <div className="text-xs text-primary size-4 rounded-full bg-primary/5 flex items-center justify-center">
                          {selectedMainCategorySubCount}
                        </div>
                      </div>
                    ) : (
                      value.name
                    ),
                    value: value.id.toString(),
                  };
                })}
              />
            )}

            {subCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {subCategories.map((subCategory) => (
                  <Badge
                    key={subCategory.id}
                    variant="secondary"
                    onClick={() => handleCategoryClick(subCategory.id)}
                    className={cn(
                      "cursor-pointer rounded-full hover:bg-primary/5 hover:border-primary transition-all",
                      formData.categories.includes(subCategory.id) &&
                        "bg-primary/5 hover:bg-primary/10 border-primary",
                    )}
                  >
                    {subCategory.name}
                  </Badge>
                ))}
                {formData.categories.length >= MAX_CATEGORY_COUNT && (
                  <p className="w-full text-xs text-muted-foreground px-2">
                    최대 {MAX_CATEGORY_COUNT}개까지 선택할 수 있어요.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 난이도 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">난이도</label>
            <ButtonSelect
              value={formData.difficulty}
              onChange={(value) => {
                setFormData({ ...formData, difficulty: value as string });
              }}
              options={WorkBookDifficulty.map((value) => ({
                label: value.label,
                value: value.value,
              }))}
            />
          </div>
        </div>
      </div>

      <Button size="lg" className="w-full py-6" onClick={handleNavigate}>
        빠르게 문제집 만들기
      </Button>
    </div>
  );
}
