"use client";

import { BlockType, blockDisplayNames } from "@service/solves/shared";
import { errorToString, isNull } from "@workspace/util";
import { Loader } from "lucide-react";
import { useMemo, useState } from "react";
import { generateWorkbookPlanAction } from "@/actions/workbook-ai";
import { Button } from "@/components/ui/button";
import { ButtonSelect } from "@/components/ui/button-select";
import { Textarea } from "@/components/ui/textarea";
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
import JsonView from "../ui/json-view";
import { notify } from "../ui/notify";
import { CategorySelector } from "./category-selector";

interface WorkbookCreateAiFormData extends WorkbookOptions {
  prompt?: string;
}

export function WorkbookCreateAiForm({
  initialFormData = {
    situation: "",
    ageGroup: "",
    categoryId: undefined,
    blockTypes: Object.keys(blockDisplayNames) as BlockType[],
    prompt: "",
  },
}: {
  initialFormData?: WorkbookCreateAiFormData;
}) {
  const [formData, setFormData] = useState(initialFormData);
  const setWorkbookPlan = useWorkbookEditStore(
    (state) => state.setWorkbookPlan,
  );
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

  const [result, generateAndSave, isGenerating] = useSafeAction(
    generateWorkbookPlanAction,
    {
      onSuccess: (result) => {
        setWorkbookPlan(result.plan);
      },
      failMessage: errorToString,
      successMessage: "생성이 완료되었습니다. 화면 이동중...",
    },
  );

  const handleCreateWorkbook = async () => {
    if (!formData.categoryId) {
      return;
    }
    if (!formData.prompt || formData.prompt.trim().length === 0) {
      await notify.alert({
        title: "프롬프트 필요",
        description: "AI 프롬프트를 입력해주세요.",
      });
      return;
    }
    const confirm = await notify.confirm({
      title: "AI로 문제 생성을 진행할까요?",
      okText: "확인",
      cancelText: "취소",
    });
    if (!confirm) {
      return;
    }
    generateAndSave({
      categoryId: formData.categoryId,
      blockTypes: formData.blockTypes,
      situation: formData.situation,
      ageGroup: formData.ageGroup,
      prompt: formData.prompt,
    });
  };

  const valid = useMemo(() => {
    return (
      !isNull(formData.categoryId) &&
      formData.prompt &&
      formData.prompt.trim().length > 0
    );
  }, [formData.categoryId, formData.prompt]);

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
          <p className="w-full text-xs text-muted-foreground px-4 text-center">
            모두 입력해주세요.
          </p>
        )}

        <div className="space-y-3">
          <div className="flex flex-col items-start gap-1">
            <label className="text-sm font-bold text-foreground">
              AI 프롬프트
            </label>
            <p className="text-xs text-muted-foreground">
              원하는 문제 스타일이나 내용을 자유롭게 입력해주세요 (자세하게
              입력할수록 원하는 문제집을 만들 수 있어요)
            </p>
          </div>
          <Textarea
            value={formData.prompt || ""}
            onChange={(e) => {
              setFormData({ ...formData, prompt: e.target.value });
            }}
            placeholder="예: 빠르게 풀어볼수 있게 중학교 1학년 수학 문제를 객관식과 주관식으로 5개 만들어주세요"
            className="min-h-30 resize-none max-h-48"
          />
        </div>
        {result?.success && <JsonView data={result.data} />}
        <Button
          onClick={handleCreateWorkbook}
          variant={"default"}
          disabled={isGenerating || !valid}
          className={cn("w-full rounded-lg py-6 text-base mt-2")}
        >
          {isGenerating && <Loader className="size-4 animate-spin mr-2" />}
          {isGenerating ? "생성 중..." : "AI로 생성하기"}
        </Button>
      </div>
    </div>
  );
}
