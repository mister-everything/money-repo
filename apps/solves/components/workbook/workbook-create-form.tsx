"use client";

import {
  BlockType,
  blockDisplayNames,
  MAX_CATEGORY_COUNT,
  MAX_INPROGRESS_WORKBOOK_CREATE_COUNT,
} from "@service/solves/shared";
import { errorToString } from "@workspace/util";
import { Loader, TriangleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createWorkbookAction } from "@/actions/workbook";
import { Button } from "@/components/ui/button";
import { ButtonSelect } from "@/components/ui/button-select";
import { useCategories } from "@/hooks/query/use-categories";
import {
  WorkBookAgeGroup,
  WorkBookDifficulty,
  WorkBookSituation,
} from "@/lib/const";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";
import { WorkbookOptions } from "@/store/types";
import { useWorkbookStore } from "@/store/workbook-create";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";

export function WorkbookCreateForm({
  isMaxInprogressWorkbookCreateCount = false,
  initialFormData = {
    situation: "",
    categories: [],
    blockTypes: Object.keys(blockDisplayNames) as BlockType[],
    ageGroup: "all",
    difficulty: "",
  },
}: {
  isMaxInprogressWorkbookCreateCount?: boolean;
  initialFormData?: WorkbookOptions;
}) {
  const router = useRouter();
  const { setWorkbooks } = useWorkbookStore();

  const [mainCategory, setMainCategory] = useState<number>();

  const [formData, setFormData] = useState(initialFormData);
  const { data: categories = [], isLoading } = useCategories({
    onSuccess: (data) => {
      if (!mainCategory) {
        if (!formData.categories.length) setMainCategory(data[0].id);
        else {
          const sub = data
            .flatMap((category) => category.subs)
            .find((sub) => formData.categories.includes(sub.id));
          setMainCategory(sub?.mainId ?? formData.categories[0]);
        }
      }
    },
  });

  const [, formAction, isPending] = useSafeAction(createWorkbookAction, {
    onSuccess: (result) => {
      setWorkbooks(result.id, formData);
      router.push(`/workbooks/${result.id}/edit`);
    },
    failMessage: errorToString,
    successMessage: "문제집 페이지로 이동합니다.",
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

  const valid = useMemo(() => {
    return formData.categories.length > 0;
  }, [formData]);

  return (
    <div className="w-full">
      <div className="flex justify-start items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-foreground">
          어떤 문제집을 만들고 싶나요?
        </h1>
        {!isMaxInprogressWorkbookCreateCount && (
          <p className="text-xs text-point">
            (* 한 문제집은 총 10개의 문제로 구성돼요)
          </p>
        )}
      </div>

      <form className="space-y-3 w-full">
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            <label className="text-sm font-bold text-foreground">소재</label>
            {!isMaxInprogressWorkbookCreateCount && (
              <>
                <TriangleAlertIcon className="size-2.5 text-background fill-point ml-2" />
                <span className="text-point text-xs">
                  소재는 문제집 생성 후 변경할 수 없으니 신중하게 선택해주세요
                </span>
              </>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="w-full h-16" />
          ) : (
            <ButtonSelect
              disabled={isMaxInprogressWorkbookCreateCount}
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
        <div className="space-y-3">
          <div className="flex flex-cols gap-1">
            <label className="text-sm font-bold text-foreground">상황</label>
          </div>
          <ButtonSelect
            disabled={isMaxInprogressWorkbookCreateCount}
            value={formData.situation}
            onChange={(value) => {
              setFormData({ ...formData, situation: value as string });
            }}
            name="situation"
            options={WorkBookSituation.map((value) => ({
              label: value.label,
              value: value.value,
            }))}
          />
        </div>

        <div className="space-y-3">
          <div className="flex flex-cols gap-1">
            <label className="text-sm font-bold text-foreground">유형</label>
          </div>
          <ButtonSelect
            disabled={isMaxInprogressWorkbookCreateCount}
            value={formData.blockTypes}
            multiple={true}
            onChange={(value) => {
              setFormData({ ...formData, blockTypes: value as BlockType[] });
            }}
            name="format"
            options={Object.entries(blockDisplayNames).map(
              ([value, label]) => ({
                label,
                value,
              }),
            )}
          />
        </div>
        <div className="space-y-3">
          <div className="flex flex-cols gap-1">
            <label className="text-sm font-bold text-foreground">연령대</label>
          </div>
          <ButtonSelect
            disabled={isMaxInprogressWorkbookCreateCount}
            value={formData.ageGroup}
            onChange={(value) => {
              setFormData({ ...formData, ageGroup: value as string });
            }}
            name="ageGroup"
            options={WorkBookAgeGroup.map((value) => ({
              label: value.label,
              value: value.value,
            }))}
          />
        </div>
        <div className="space-y-3">
          <div className="flex flex-cols gap-1">
            <label className="text-sm font-bold text-foreground">난이도</label>
          </div>
          <ButtonSelect
            disabled={isMaxInprogressWorkbookCreateCount}
            value={formData.difficulty}
            onChange={(value) => {
              setFormData({ ...formData, difficulty: value as string });
            }}
            name="difficulty"
            options={WorkBookDifficulty.map((value) => ({
              label: value.label,
              value: value.value,
            }))}
          />
        </div>
        {!valid && !isMaxInprogressWorkbookCreateCount && (
          <p className="w-full text-xs text-muted-foreground px-2 text-center">
            소재는 최소 1개 이상 선택해주세요.
          </p>
        )}

        <Button
          onClick={() => {
            if (!valid) {
              return;
            }
            formAction({
              title: "",
              categories: formData.categories,
            });
          }}
          variant={isMaxInprogressWorkbookCreateCount ? "secondary" : "default"}
          disabled={isPending || isMaxInprogressWorkbookCreateCount || !valid}
          className={cn(
            "w-full rounded-lg py-6 text-base",
            isMaxInprogressWorkbookCreateCount &&
              "border-dashed shadow-none py-8",
          )}
        >
          {isPending && <Loader className="size-4 animate-spin" />}
          {isMaxInprogressWorkbookCreateCount ? (
            <div className="space-y-2">
              <p className="text-center text-muted-foreground text-sm">
                아직 완성되지 않은 문제집이 있어요. 완성되지 않은 문제집은 최대{" "}
                {MAX_INPROGRESS_WORKBOOK_CREATE_COUNT}개까지 생성할 수 있어요.
              </p>
              <p className="text-center text-muted-foreground text-sm">
                아래 문제집을 <span className="text-point ">완성</span>하거나{" "}
                <span className="text-point ">삭제</span>하면 문제집을{" "}
                <span className="text-point font-semibold">생성</span>할 수
                있어요.
              </p>
            </div>
          ) : (
            "문제 만들기"
          )}
        </Button>
      </form>
    </div>
  );
}
