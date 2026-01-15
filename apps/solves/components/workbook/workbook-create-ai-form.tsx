"use client";

import { BlockType, blockDisplayNames } from "@service/solves/shared";
import { errorToString, isNull } from "@workspace/util";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createWorkbookAction } from "@/actions/workbook";
import { Button } from "@/components/ui/button";
import { ButtonSelect } from "@/components/ui/button-select";
import { useCategories } from "@/hooks/query/use-categories";
import {
  MAX_BLOCK_COUNT,
  WorkBookAgeGroup,
  WorkBookSituation,
} from "@/lib/const";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { cn } from "@/lib/utils";
import { WorkbookOptions } from "@/store/types";
import { useWorkbookEditStore } from "@/store/workbook-edit-store";
import { notify } from "../ui/notify";
import { CategorySelector } from "./category-selector";

export function WorkbookCreateAiForm({
  initialFormData = {
    situation: "",
    ageGroup: "",
    categoryId: undefined,
    blockTypes: Object.keys(blockDisplayNames) as BlockType[],
  },
}: {
  initialFormData?: WorkbookOptions;
}) {
  const router = useRouter();
  const { setWorkbookOption } = useWorkbookEditStore();

  const [formData, setFormData] = useState(initialFormData);
  const { data: categories = [], isLoading } = useCategories({
    onSuccess: (data) => {
      if (data.length > 0) {
        const flatCategories = data.flatMap((category) => [
          category,
          ...category.children,
        ]);
        const categortId = formData.categoryId;
        const category = flatCategories.find(
          (category) => category.id === categortId,
        );
        if (category) {
          setFormData((prev) => ({ ...prev, categoryId: category?.id }));
        }
      }
    },
  });

  const [, createWorkbook, isPending] = useSafeAction(createWorkbookAction, {
    onSuccess: (result) => {
      setWorkbookOption(result.id, formData);
      router.push(`/workbooks/${result.id}/edit`);
    },
    failMessage: errorToString,
    successMessage: "문제집 페이지로 이동합니다.",
  });

  const handleCreateWorkbook = async () => {
    if (!formData.categoryId) {
      return;
    }
    const confirm = await notify.confirm({
      title: "문제집을 생성해볼까요?",
      okText: "이대로 진행하기",
      cancelText: "다시 선택하기",
    });
    if (!confirm) {
      return;
    }
    createWorkbook({
      title: "",
      categoryId: formData.categoryId,
    });
  };

  const valid = useMemo(() => {
    return !isNull(formData.categoryId);
  }, [formData.categoryId]);

  return (
    <div className="w-full">
      <div className="flex justify-start items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-foreground">
          어떤 문제집을 빠르게 풀어보고 싶나요?
        </h1>

        <p className="text-xs text-point">
          (* 한 문제집은 총 {MAX_BLOCK_COUNT}개의 문제로 구성돼요)
        </p>
      </div>

      <div className="space-y-4 w-full">
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            <label className="text-sm font-bold text-foreground">소재</label>
          </div>
          <CategorySelector
            categories={categories}
            isLoading={isLoading}
            onCategoryChange={(ct) =>
              setFormData((prev) => ({ ...prev, categoryId: ct }))
            }
            value={formData.categoryId}
          />
        </div>
        <div className="space-y-3">
          <div className="flex flex-cols gap-1">
            <label className="text-sm font-bold text-foreground">상황</label>
          </div>
          <ButtonSelect
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
            value={formData.ageGroup || ""}
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

        {!valid && (
          <p className="w-full text-xs text-muted-foreground px-2 text-center">
            소재를 선택해주세요.
          </p>
        )}

        <Button
          onClick={handleCreateWorkbook}
          variant={"default"}
          disabled={isPending || !valid}
          className={cn("w-full rounded-lg py-6 text-base mt-2")}
        >
          {isPending && <Loader className="size-4 animate-spin" />}
          AI로 문제집 만들기
        </Button>
      </div>
    </div>
  );
}
