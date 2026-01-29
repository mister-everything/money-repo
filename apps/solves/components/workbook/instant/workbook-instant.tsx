"use client";

import { isNull } from "@workspace/util";
import { useCallback, useState } from "react";
import { BaseContainer } from "@/components/layouts/base-container";
import { GoBackLayout } from "@/components/layouts/go-back-layout";
import { SidebarHeaderLayout } from "@/components/layouts/sidebat-header-layout";
import { SidebarController } from "@/components/ui/sidebar";
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
      <SidebarHeaderLayout menuName="만들어서 풀기">
        <BaseContainer>
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
        </BaseContainer>
      </SidebarHeaderLayout>
    );

  return (
    <GoBackLayout href="/workbooks">
      <SidebarController openMounted={false} openUnmounted={true} />
      <BaseContainer>
        <WorkbookInstantSolve
          workbookPlan={workbookPlan!}
          categoryId={categoryId!}
          model={chatModel!}
          onModelChange={setChatModel}
          onRestart={handleRestart}
        />
      </BaseContainer>
    </GoBackLayout>
  );
}
