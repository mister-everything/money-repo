"use client";

import {
  BlockType,
  blockDisplayNames,
  ChatModel,
} from "@service/solves/shared";
import { errorToString } from "@workspace/util";

import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";
import {
  generateWorkbookPlanAction,
  generateWorkbookPlanQuestionAction,
} from "@/actions/workbook-ai";
import { AskQuestionInput } from "@/components/chat/tool-part/ask-question-tool-part";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/notify";
import { AskQuestionOutput } from "@/lib/ai/tools/workbook/ask-question-tools";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { useWorkbookEditStore } from "@/store/workbook-edit-store";
import { PlanPreview } from "../workbook-plan-preview";
import { BlockTypesStep } from "./workbook-instant-block-types-step";
import { WorkbookInstantCategoryStep } from "./workbook-instant-category-step";
import { PromptStep } from "./workbook-instant-prompt-step";
import { QuestionStep } from "./workbook-instant-question-step";

type PlanCreateOptions = {
  categoryId?: number;
  blockTypes: BlockType[];
  blockCount: number;
  prompt: string;
  model?: ChatModel;
};

enum Step {
  CATEGORY = "category",
  BLOCK_TYPES = "blockTypes",
  PROMPT = "prompt",
  QUESTION = "question",
  PLAN = "plan",
}

const defaultOptions: PlanCreateOptions = {
  blockTypes: Object.keys(blockDisplayNames) as BlockType[],
  blockCount: 5,
  prompt: "",
};

export function WorkbookInstantForm() {
  const [formData, setFormData] = useState<PlanCreateOptions>({
    ...defaultOptions,
  });
  const [step, setStep] = useState<Step>(Step.CATEGORY);

  const [question, setQuestion] = useState<{
    input?: AskQuestionInput; // 질문
    output?: AskQuestionOutput; // 질문 답변
  }>({});

  const [workbookPlan, setWorkbookPlan] = useWorkbookEditStore(
    useShallow((state) => [state.workbookPlan, state.setWorkbookPlan]),
  );

  const [, generatePlan, isPlanGenerating] = useSafeAction(
    generateWorkbookPlanAction,
    {
      onSuccess: (result) => {
        setWorkbookPlan(result.plan);
      },
      failMessage: errorToString,
      successMessage: "생성이 완료되었습니다. 화면 이동중...",
    },
  );

  const [, generateQuestions, isQuestionGenerating] = useSafeAction(
    generateWorkbookPlanQuestionAction,
    {
      onSuccess: (result) => {
        setQuestion({ input: result.question });
      },
      failMessage: errorToString,
    },
  );

  useEffect(() => {
    if (step === Step.QUESTION) {
      generateQuestions({
        categoryId: formData.categoryId!,
        prompt: formData.prompt,
        model: formData.model!,
        blockTypes: formData.blockTypes,
        blockCount: formData.blockCount,
      });
    }
    if (step === Step.PLAN) {
      generatePlan({
        categoryId: formData.categoryId!,
        askQuestion: {
          input: question.input ?? { questions: [] },
          output: question.output ?? { answers: [] },
        },
        prompt: formData.prompt,
        model: formData.model!,
        blockTypes: formData.blockTypes,
        blockCount: formData.blockCount,
      });
    }
  }, [step]);

  return (
    <div className="w-full space-y-6 max-w-4xl mx-auto">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          검색 없이 바로 시작하는 문제집 풀기
          <Badge className="rounded-full text-xs">Beta</Badge>
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          원하는 소재와 유형만 고르면, AI가 즉시 계획을 만들고 한 문제씩
          생성해줘요. 게임처럼 바로 풀어보세요.
        </p>
      </header>

      <section className="space-y-6">
        {step === Step.CATEGORY ? (
          <WorkbookInstantCategoryStep
            onCategoryChange={(ct) =>
              setFormData((prev) => ({ ...prev, categoryId: ct }))
            }
            categoryId={formData.categoryId}
            onNextStep={() => setStep(Step.BLOCK_TYPES)}
          />
        ) : step === Step.BLOCK_TYPES ? (
          <BlockTypesStep
            blockTypes={formData.blockTypes}
            onBlockTypesChange={(blockTypes) => {
              setFormData({ ...formData, blockTypes });
            }}
            blockCount={formData.blockCount}
            onBlockCountChange={(blockCount) => {
              setFormData({ ...formData, blockCount });
            }}
            onNextStep={() => setStep(Step.PROMPT)}
            onPreviousStep={() => setStep(Step.CATEGORY)}
          />
        ) : step === Step.PROMPT ? (
          <PromptStep
            model={formData.model}
            onModelChange={(model) => {
              setFormData({ ...formData, model });
            }}
            prompt={formData.prompt}
            onPromptChange={(prompt) => {
              setFormData({ ...formData, prompt });
            }}
            onNextStep={() => setStep(Step.QUESTION)}
            onPreviousStep={() => setStep(Step.BLOCK_TYPES)}
          />
        ) : step === Step.QUESTION ? (
          <QuestionStep
            input={question.input}
            output={question.output}
            onChangeOutput={(output) => {
              setQuestion({ ...question, output });
            }}
            onNextStep={() => setStep(Step.PLAN)}
            isLoading={isQuestionGenerating}
          />
        ) : (
          <>
            <PlanPreview
              plan={workbookPlan}
              isLoading={isPlanGenerating}
              prompt={formData.prompt}
              blockCount={formData.blockCount}
            />
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStep(Step.CATEGORY);
                  setFormData({ ...defaultOptions });
                  setWorkbookPlan(undefined);
                  setQuestion({});
                }}
              >
                다시 설계하기
              </Button>
              <Button
                onClick={() => {
                  notify.alert({
                    title: "문제집 생성 시작",
                    description: "문제집 생성을 시작합니다!",
                  });
                }}
              >
                {" "}
                시작하기
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
