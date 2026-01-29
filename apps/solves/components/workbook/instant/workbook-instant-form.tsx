"use client";

import { BlockType, ChatModel } from "@service/solves/shared";

import { motion } from "framer-motion";
import { LoaderIcon } from "lucide-react";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  generateWorkbookPlanAction,
  generateWorkbookPlanQuestionAction,
} from "@/actions/workbook-ai";
import { AskQuestionInput } from "@/components/chat/tool-part/ask-question-tool-part";
import { Badge } from "@/components/ui/badge";

import { AskQuestionOutput } from "@/lib/ai/tools/workbook/ask-question-tools";
import { WorkbookPlan } from "@/lib/ai/tools/workbook/workbook-plan";
import { useSafeAction } from "@/lib/protocol/use-safe-action";
import { PlanPreview } from "../workbook-plan-preview";
import { WorkbookInstantCategoryStep } from "./workbook-instant-category-step";
import { WorkbookInstantPromptStep } from "./workbook-instant-prompt-step";
import { WorkbookInstantQuestionStep } from "./workbook-instant-question-step";

type PlanCreateOptions = {
  blockTypes: BlockType[];
  blockCount: number;
  prompt: string;
};

export enum Step {
  CATEGORY = "category",
  PROMPT = "prompt",
  QUESTION = "question",
  PLAN = "plan",
}

const defaultOptions: PlanCreateOptions = {
  blockTypes: ["default", "mcq", "ox"],
  blockCount: 5,
  prompt: "",
};

interface WorkbookInstantFormProps {
  model: ChatModel;
  onModelChange: (model: ChatModel) => void;
  workbookPlan?: WorkbookPlan;
  onWorkbookPlanChange: (workbookPlan: WorkbookPlan | undefined) => void;
  categoryId?: number;
  onCategoryChange: (categoryId?: number) => void;
  onReset: () => void;
  onStart: () => void;
  defaultStep?: Step;
}

export function WorkbookInstantForm({
  workbookPlan,
  model,
  categoryId,
  onModelChange,
  onWorkbookPlanChange,
  onCategoryChange,
  onReset,
  onStart,
  defaultStep = Step.CATEGORY,
}: WorkbookInstantFormProps) {
  const [formData, setFormData] = useState<PlanCreateOptions>({
    ...defaultOptions,
  });
  const [step, setStep] = useState<Step>(defaultStep);

  const [question, setQuestion] = useState<{
    input?: AskQuestionInput; // 질문
    output?: AskQuestionOutput; // 질문 답변
  }>({});

  const [, generatePlan, isPlanGenerating] = useSafeAction(
    generateWorkbookPlanAction,
    {
      onSuccess: (result) => {
        onWorkbookPlanChange(result.plan);
      },
      failMessage: "계획 생성 중 오류가 발생했습니다.",
    },
  );

  const [, generateQuestions, isQuestionGenerating] = useSafeAction(
    generateWorkbookPlanQuestionAction,
    {
      onSuccess: (result) => {
        setQuestion({ input: result.question });
      },
      failMessage: "질문 생성 중 오류가 발생했습니다.",
    },
  );

  const handleReset = useCallback(() => {
    setStep(Step.CATEGORY);
    setFormData({ ...defaultOptions });
    setQuestion({});
    onReset();
  }, [onReset]);

  useEffect(() => {
    if (step === Step.QUESTION) {
      if (!question.input) {
        setQuestion({});
        generateQuestions({
          categoryId: categoryId!,
          prompt: formData.prompt,
          model,
          blockTypes: formData.blockTypes,
          blockCount: formData.blockCount,
        });
      }
    }
    if (step === Step.PLAN) {
      onWorkbookPlanChange(undefined);
      generatePlan({
        categoryId: categoryId!,
        askQuestion: {
          input: question.input ?? { questions: [] },
          output: question.output ?? { answers: [] },
        },
        prompt: formData.prompt,
        model,
        blockTypes: formData.blockTypes,
        blockCount: formData.blockCount,
      });
    }
  }, [step]);

  const currentStepOrder = useMemo(() => {
    return step === Step.CATEGORY
      ? 1
      : step === Step.PROMPT
        ? 2
        : step === Step.QUESTION
          ? 3
          : 4;
  }, [step]);

  useEffect(() => {
    setStep(defaultStep);
  }, [defaultStep]);

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-col gap-2 py-4">
        <h1 className="text-lg sm:text-2xl font-bold text-foreground flex items-center gap-2">
          검색 없이 바로 시작하는 문제집 풀기
          <Badge className="rounded-full text-xs">Beta</Badge>
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          원하는 소재와 유형만 고르면, AI가 즉시 계획을 만들고 한 문제씩
          생성해줘요. 게임처럼 바로 풀어보세요.
        </p>
      </header>

      <section className="flex flex-col gap-4 pb-12">
        {/* Step Indicator */}
        <div className="w-full flex items-center justify-center gap-1 pb-6">
          {[
            { order: 1, label: "카테고리", step: Step.CATEGORY },
            { order: 2, label: "프롬프트", step: Step.PROMPT },
            { order: 3, label: "질문", step: Step.QUESTION },
            { order: 4, label: "계획", step: Step.PLAN },
          ].map((item, index) => {
            const isCompleted = currentStepOrder > item.order;
            const isCurrent = currentStepOrder === item.order;
            const isLoading =
              (item.order === 3 && isQuestionGenerating) ||
              (item.order === 4 && isPlanGenerating);

            return (
              <Fragment key={item.step}>
                <div className="relative">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1 : isCompleted ? 1 : 0.95,
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    onClick={() => {
                      if (isCompleted) {
                        setStep(item.step);
                      }
                    }}
                    className={`relative size-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                      isCompleted || isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-input dark:bg-muted text-muted-foreground"
                    } ${isCompleted ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
                      >
                        <LoaderIcon className="size-4 animate-spin" />
                      </motion.div>
                    ) : isCompleted ? (
                      <motion.svg
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 20,
                        }}
                        className="size-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </motion.svg>
                    ) : (
                      <motion.span
                        initial={false}
                        animate={{
                          scale: isCurrent ? [1, 1.05, 1] : 1,
                        }}
                        className="font-bold"
                        transition={{
                          duration: 1.5,
                          repeat: isCurrent ? Number.POSITIVE_INFINITY : 0,
                          ease: "easeInOut",
                        }}
                      >
                        {item.order}
                      </motion.span>
                    )}
                  </motion.div>
                  {isCurrent && (
                    <motion.span
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.3 }}
                      className="absolute top-full mt-3 left-1/2 -translate-x-1/2 text-xs font-medium text-foreground whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </div>
                {index < 3 && (
                  <div className="h-0.5 w-12 md:w-20 bg-input dark:bg-muted  relative overflow-hidden rounded-full shrink-0">
                    <motion.div
                      initial={false}
                      animate={{
                        x: isCompleted ? "0%" : "-100%",
                      }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="h-full w-full bg-primary"
                    />
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
        {step === Step.CATEGORY ? (
          <WorkbookInstantCategoryStep
            onCategoryChange={onCategoryChange}
            categoryId={categoryId}
            onNextStep={() => setStep(Step.PROMPT)}
          />
        ) : step === Step.PROMPT ? (
          <WorkbookInstantPromptStep
            model={model}
            onModelChange={onModelChange}
            prompt={formData.prompt}
            onPromptChange={(prompt) => {
              setFormData({ ...formData, prompt });
            }}
            blockTypes={formData.blockTypes}
            onBlockTypesChange={(blockTypes) => {
              setFormData({ ...formData, blockTypes });
            }}
            blockCount={formData.blockCount}
            onBlockCountChange={(blockCount) => {
              setFormData({ ...formData, blockCount });
            }}
            onNextStep={() => setStep(Step.QUESTION)}
            onPreviousStep={() => setStep(Step.CATEGORY)}
          />
        ) : step === Step.QUESTION ? (
          <WorkbookInstantQuestionStep
            model={model}
            input={question.input}
            output={question.output}
            onChangeOutput={(output) => {
              setQuestion({ ...question, output });
            }}
            onNextStep={() => setStep(Step.PLAN)}
            isLoading={isQuestionGenerating}
          />
        ) : (
          <PlanPreview
            model={model}
            plan={workbookPlan}
            isLoading={isPlanGenerating}
            prompt={formData.prompt}
            categoryId={categoryId}
            blockCount={formData.blockCount}
            onNext={onStart}
            onGenerate={() => {
              onWorkbookPlanChange(undefined);
              generatePlan({
                categoryId: categoryId!,
                askQuestion: {
                  input: question.input ?? { questions: [] },
                  output: question.output ?? { answers: [] },
                },
                prompt: formData.prompt,
                model,
                blockTypes: formData.blockTypes,
                blockCount: formData.blockCount,
              });
            }}
            onReset={handleReset}
          />
        )}
      </section>
    </div>
  );
}
