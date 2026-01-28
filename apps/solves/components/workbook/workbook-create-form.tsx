"use client";

import {
  BlockType,
  blockDisplayNames,
  MAX_INPROGRESS_WORKBOOK_CREATE_COUNT,
} from "@service/solves/shared";
import { errorToString, isNull } from "@workspace/util";
import { Check, ChevronLeft, Loader } from "lucide-react";
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

enum Step {
  CATEGORY = "category",
  OPTIONS = "options",
}

export function WorkbookCreateForm({
  isMaxInprogressWorkbookCreateCount = false,
  hasSession = true,
  initialFormData = {
    situation: "",
    ageGroup: "",
    categoryId: undefined,
    blockTypes: Object.keys(blockDisplayNames) as BlockType[],
  },
}: {
  isMaxInprogressWorkbookCreateCount?: boolean;
  hasSession?: boolean;
  initialFormData?: WorkbookOptions;
}) {
  const router = useRouter();
  const { setWorkbookOption } = useWorkbookEditStore();

  const [step, setStep] = useState<Step>(
    initialFormData.categoryId ? Step.OPTIONS : Step.CATEGORY,
  );
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

  const selectedCategory = useMemo(() => {
    if (!formData.categoryId || !categories.length) return null;
    const flatCategories = categories.flatMap((category) => [
      category,
      ...category.children,
    ]);
    return flatCategories.find((c) => c.id === formData.categoryId);
  }, [formData.categoryId, categories]);

  return (
    <div className="w-full space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex flex-col gap-2 py-2">
        <h1 className="text-lg sm:text-2xl font-bold text-foreground">
          나만의 문제집 만들기
        </h1>
        <p className="text-sm text-muted-foreground">
          소재와 옵션을 선택하면, AI가 맞춤형 문제를 생성해줘요.
          {!isMaxInprogressWorkbookCreateCount && (
            <span className="text-point ml-1">
              (최대 {MAX_BLOCK_COUNT}문제)
            </span>
          )}
        </p>
      </header>

      {/* Step Indicator - Centered */}
      <div className="w-full flex items-center justify-center gap-1 py-3">
        <div
          className={cn(
            "size-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
            step === Step.CATEGORY
              ? "bg-primary text-primary-foreground"
              : "bg-primary text-primary-foreground",
          )}
        >
          {step === Step.OPTIONS ? <Check className="size-4" /> : "1"}
        </div>
        <div className="h-0.5 w-10 bg-input dark:bg-muted relative overflow-hidden rounded-full">
          <div
            className={cn(
              "h-full w-full bg-primary transition-transform duration-300",
              step === Step.OPTIONS ? "translate-x-0" : "-translate-x-full",
            )}
          />
        </div>
        <div
          className={cn(
            "size-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
            step === Step.OPTIONS
              ? "bg-primary text-primary-foreground"
              : "bg-input dark:bg-muted text-muted-foreground",
          )}
        >
          2
        </div>
      </div>

      <div className="space-y-4 w-full">
        {step === Step.CATEGORY ? (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-1">
                <label className="text-sm font-semibold text-foreground">
                  어떤 소재로 문제집을 만들까요?
                </label>
              </div>
              <CategorySelector
                showIcon
                categories={categories}
                isLoading={isLoading}
                onCategoryChange={(ct) =>
                  setFormData((prev) => ({ ...prev, categoryId: ct }))
                }
                value={formData.categoryId}
              />
            </div>

            {hasSession && (
              <Button
                onClick={() => setStep(Step.OPTIONS)}
                disabled={!valid || isLoading}
                className="w-full rounded-lg py-4 text-base mt-2"
              >
                다음
              </Button>
            )}
          </>
        ) : (
          <>
            {/* 선택된 카테고리 & 뒤로가기 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">
                  세부 옵션을 선택해주세요
                </label>
                <button
                  type="button"
                  onClick={() => setStep(Step.CATEGORY)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="size-3" />
                  <span>{selectedCategory?.name ?? "소재"} 변경</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-cols gap-1">
                <label className="text-sm font-medium text-foreground">
                  상황
                </label>
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
                <label className="text-sm font-medium text-foreground">
                  유형
                </label>
              </div>
              <ButtonSelect
                disabled={isMaxInprogressWorkbookCreateCount}
                value={formData.blockTypes}
                multiple={true}
                onChange={(value) => {
                  setFormData({
                    ...formData,
                    blockTypes: value as BlockType[],
                  });
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
                <label className="text-sm font-medium text-foreground">
                  연령대
                </label>
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

            {hasSession && (
              <Button
                onClick={handleCreateWorkbook}
                variant={
                  isMaxInprogressWorkbookCreateCount ? "secondary" : "default"
                }
                disabled={
                  isPending || isMaxInprogressWorkbookCreateCount || !valid
                }
                className={cn(
                  "w-full rounded-lg py-4 text-base mt-2",
                  isMaxInprogressWorkbookCreateCount &&
                    "border-dashed shadow-none py-8",
                )}
              >
                {isPending && <Loader className="size-4 animate-spin" />}
                {isMaxInprogressWorkbookCreateCount ? (
                  <div className="space-y-2">
                    <p className="text-center text-muted-foreground text-sm">
                      아직 완성되지 않은 문제집이 있어요. 완성되지 않은 문제집은
                      최대 {MAX_INPROGRESS_WORKBOOK_CREATE_COUNT}개까지 생성할
                      수 있어요.
                    </p>
                    <p className="text-center text-muted-foreground text-sm">
                      아래 문제집을 <span className="text-point ">완성</span>
                      하거나 <span className="text-point ">삭제</span>하면
                      문제집을{" "}
                      <span className="text-point font-semibold">생성</span>할
                      수 있어요.
                    </p>
                  </div>
                ) : (
                  "문제 만들기"
                )}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
