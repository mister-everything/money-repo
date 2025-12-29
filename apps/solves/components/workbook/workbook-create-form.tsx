"use client";

import {
  BlockType,
  blockDisplayNames,
  MAX_INPROGRESS_WORKBOOK_CREATE_COUNT,
} from "@service/solves/shared";
import { errorToString, isNull } from "@workspace/util";
import { Loader, TriangleAlertIcon } from "lucide-react";
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

export function WorkbookCreateForm({
  isMaxInprogressWorkbookCreateCount = false,
  initialFormData = {
    situation: "",
    ageGroup: "",
    categoryId: undefined,
    blockTypes: Object.keys(blockDisplayNames) as BlockType[],
  },
}: {
  isMaxInprogressWorkbookCreateCount?: boolean;
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
          어떤 문제집을 만들고 싶나요?
        </h1>
        {!isMaxInprogressWorkbookCreateCount && (
          <p className="text-xs text-point">
            (* 한 문제집은 총 {MAX_BLOCK_COUNT}개의 문제로 구성돼요)
          </p>
        )}
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

        {!valid && !isMaxInprogressWorkbookCreateCount && (
          <p className="w-full text-xs text-muted-foreground px-2 text-center">
            소재를 선택해주세요.
          </p>
        )}

        <Button
          onClick={handleCreateWorkbook}
          variant={isMaxInprogressWorkbookCreateCount ? "secondary" : "default"}
          disabled={isPending || isMaxInprogressWorkbookCreateCount || !valid}
          className={cn(
            "w-full rounded-lg py-6 text-base mt-2",
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
      </div>
    </div>
  );
}
