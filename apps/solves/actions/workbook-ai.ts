"use server";

import { categoryService } from "@service/solves";
import {
  BlockType,
  blockDisplayNames,
  WORKBOOK_DESCRIPTION_MAX_LENGTH,
  WORKBOOK_TITLE_MAX_LENGTH,
} from "@service/solves/shared";
import { generateObject } from "ai";
import z from "zod";
import { getChatModel } from "@/lib/ai/model";
import { getSession } from "@/lib/auth/server";
import {
  MAX_BLOCK_COUNT,
  WorkBookAgeGroup,
  WorkBookSituation,
} from "@/lib/const";
import { fail } from "@/lib/protocol/interface";
import { safeAction } from "@/lib/protocol/server-action";

const generateWorkbookPlanInputSchema = z.object({
  categoryId: z.number().min(1, "카테고리를 선택해주세요."),
  blockTypes: z.array(z.string()).optional(),
  situation: z.string().optional(),
  ageGroup: z.string().optional(),
  prompt: z.string().min(1, "프롬프트를 입력해주세요."),
});

const generateWorkbookPlanActionImpl = safeAction(
  generateWorkbookPlanInputSchema,
  async ({ categoryId, blockTypes, situation, ageGroup, prompt }) => {
    const session = await getSession();
    const category = await categoryService.getById(categoryId);
    if (!category) {
      return fail("카테고리를 찾을 수 없습니다.");
    }

    const tempTitle = `${category.name} AI 문제집`;
    const tempDescription = prompt.slice(0, WORKBOOK_DESCRIPTION_MAX_LENGTH);

    const targetBlockTypes =
      blockTypes && blockTypes.length > 0
        ? blockTypes
        : (Object.keys(blockDisplayNames) as BlockType[]);
    const blockTypeLabels = targetBlockTypes
      .map(
        (type) =>
          `${blockDisplayNames[type as keyof typeof blockDisplayNames]}(${type})`,
      )
      .join(", ");

    const situationLabel = WorkBookSituation.find(
      (item) => item.value === (situation ?? ""),
    )?.label;
    const ageGroupLabel =
      ageGroup && ageGroup !== "all"
        ? WorkBookAgeGroup.find((item) => item.value === ageGroup)?.label
        : "전체";

    const planSchema = z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      goal: z.string().min(1),
      audience: z.string().min(1),
      totalQuestions: z.number().int().min(1).max(MAX_BLOCK_COUNT),
      blockPlan: z
        .array(
          z.object({
            type: z.string().min(1),
            count: z.number().int().min(1),
            intent: z.string().min(1),
          }),
        )
        .min(1),
      constraints: z.array(z.string().min(1)).min(1),
      notes: z.array(z.string().min(1)).min(1),
      openQuestions: z.array(z.string().min(1)).optional(),
    });

    const planningPrompt = `
너는 Solves AI의 문제집 플래너다. 사용자의 요청을 바탕으로 "문제 생성 플래닝"만 출력한다.
다음 규칙을 반드시 지켜라:
- 실제 문제/정답/보기/해설을 생성하지 마라.
- 외부 링크, 문제 ID, 문제집 생성 API 호출을 전제로 한 내용은 포함하지 마라.
- totalQuestions 는 최대 ${MAX_BLOCK_COUNT}를 넘지 않는다.
- blockPlan의 count 합계는 totalQuestions와 일치해야 한다.
- blockPlan.type은 다음 목록에서만 선택한다: ${blockTypeLabels}
- 불명확한 요구가 있으면 openQuestions에 1~3개 질문을 작성한다.

컨텍스트:
- 사용자 이름: ${session.user.nickname || session.user.name}
- 카테고리: ${category.name}
- 카테고리 힌트: ${category.aiPrompt || "없음"}
- 상황: ${situationLabel || "미선택"}
- 연령대: ${ageGroupLabel || "미선택"}
- 임시 제목: ${tempTitle}
- 임시 설명: ${tempDescription}

사용자 프롬프트:
${prompt.trim()}
`.trim();

    const result = await generateObject({
      model: getChatModel({
        provider: "xai",
        model: "grok-4.1-fast-non-reasoning",
      }),
      schema: planSchema,
      prompt: planningPrompt,
    });

    const finalTitle =
      result.object.title.slice(0, WORKBOOK_TITLE_MAX_LENGTH).trim() ||
      tempTitle.slice(0, WORKBOOK_TITLE_MAX_LENGTH);
    const finalDescription =
      result.object.description
        .slice(0, WORKBOOK_DESCRIPTION_MAX_LENGTH)
        .trim() || tempDescription;

    return {
      plan: {
        ...result.object,
        title: finalTitle,
        description: finalDescription,
      },
    };
  },
);

export async function generateWorkbookPlanAction(
  input: z.infer<typeof generateWorkbookPlanInputSchema>,
) {
  const result = await generateWorkbookPlanActionImpl(input);
  return result;
}
