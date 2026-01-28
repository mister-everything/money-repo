"use client";

import { isNull } from "@workspace/util";
import { useCallback, useState } from "react";
import { WorkbookPlan } from "@/lib/ai/tools/workbook/workbook-plan";
import { useAiStore } from "@/store/ai-store";
import { Step, WorkbookInstantForm } from "./workbook-instant-form";
import { WorkbookInstantSolve } from "./workbook-instant-solve";

export function WorkbookInstant() {
  const [workbookPlan, setWorkbookPlan] = useState<WorkbookPlan | undefined>(
    undefined,
  );

  const { chatModel, setChatModel } = useAiStore();
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [mode, setMode] = useState<"plan" | "solve">("plan");

  const handleReset = useCallback(() => {
    setWorkbookPlan(undefined);
    setMode("plan");
  }, []);

  const handleStart = useCallback(() => {
    setMode("solve");
  }, []);

  const handleRestart = useCallback(() => {
    handleReset();
    setMode("plan");
  }, []);

  const requiredStep =
    mode == "plan"
      ? undefined
      : isNull(categoryId)
        ? Step.CATEGORY
        : isNull(workbookPlan) || isNull(chatModel)
          ? Step.PLAN
          : undefined;

  if (mode === "plan" || requiredStep)
    return (
      <WorkbookInstantForm
        model={chatModel!}
        workbookPlan={workbookPlan}
        onModelChange={setChatModel}
        defaultStep={requiredStep}
        onReset={handleReset}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        onWorkbookPlanChange={setWorkbookPlan}
        onStart={handleStart}
      />
    );

  return (
    <WorkbookInstantSolve
      workbookPlan={workbookPlan!}
      categoryId={categoryId!}
      model={chatModel!}
      onModelChange={setChatModel}
      onRestart={handleRestart}
    />
  );
}
