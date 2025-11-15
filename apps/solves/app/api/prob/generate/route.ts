import { generateProbBookTool } from "@agent/agents/prob-gen/tools/generate-prob-book";
import {
  ageClassificationSchema,
  extendedDifficultySchema,
  tagSuggestionResultSchema,
  topicClassificationSchema,
} from "@agent/agents/prob-gen/tools/shared-schemas";
import { probService } from "@service/solves";
import {
  probBookMetadataSchema,
  tagMetadataSchema,
  type ProbBookMetadata,
} from "@service/solves/shared";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { safeGetSession } from "@/lib/auth/server";
import {
  DEFAULT_PROBLEM_COUNT,
  type ProbGenerationFormData,
  generatedProbBookSchema,
  probGenerationRequestSchema,
} from "@/lib/prob/schemas";
import { errorResponse } from "@/lib/response";

type DifficultyLevel = "easy" | "medium" | "hard";

const difficultyMap: Record<string, DifficultyLevel> = {
  아주쉬움: "easy",
  쉬움: "easy",
  보통: "medium",
  기본: "medium",
  어려움: "hard",
  아주어려움: "hard",
};

function mapDifficulty(difficulty: string): DifficultyLevel {
  return difficultyMap[difficulty] ?? "medium";
}

function inferIncludeAnswers(
  form: ProbGenerationFormData,
  includeAnswers?: boolean,
) {
  if (typeof includeAnswers === "boolean") {
    return includeAnswers;
  }

  const formatTokens = Array.isArray(form.format) ? form.format : [form.format];
  const normalized = formatTokens.join(" ").toLowerCase();
  const situation = `${form.situation} ${form.description ?? ""}`.toLowerCase();

  if (
    normalized.includes("ox") ||
    normalized.includes("객관식") ||
    normalized.includes("주관식") ||
    normalized.includes("quiz")
  ) {
    return true;
  }

  if (situation.includes("투표") || situation.includes("월드컵")) {
    return false;
  }

  return true;
}

function buildRequirement(form: ProbGenerationFormData): string {
  const format = Array.isArray(form.format)
    ? form.format.join(", ")
    : form.format;

  const lines = [
    `상황: ${form.situation}`,
    `인원: ${form.people}`,
    `연령대: ${form.ageGroup}`,
    `플랫폼: ${form.platform}`,
    `형식: ${format}`,
    `소재: ${form.topic.join(", ")}`,
    `난이도: ${form.difficulty}`,
  ];

  if (form.description) {
    lines.push(`설명: ${form.description}`);
  }

  return lines.join("\n");
}

const pipelineMetadataSchema = z
  .object({
    problemCount: z.number(),
    includeAnswers: z.boolean(),
    classifications: z
      .object({
        tags: tagSuggestionResultSchema,
        topic: topicClassificationSchema,
        age: ageClassificationSchema,
        difficulty: extendedDifficultySchema,
      })
      .optional(),
  })
  .passthrough();

export async function POST(request: NextRequest) {
  try {
    const session = await safeGetSession();
    if (!session) {
      return NextResponse.json(errorResponse("인증이 필요합니다."), {
        status: 401,
      });
    }

    const ownerId = session.user.id;
    const parsed = probGenerationRequestSchema.parse(await request.json());
    const { form, includeAnswers: includeAnswersInput } = parsed;
    const problemCount = parsed.problemCount ?? DEFAULT_PROBLEM_COUNT;
    const includeAnswers = inferIncludeAnswers(form, includeAnswersInput);
    const difficulty = mapDifficulty(form.difficulty);
    const requirement = buildRequirement(form);

    const execute = generateProbBookTool.execute;
    if (!execute) {
      throw new Error("문제 생성 도구 실행 함수가 정의되어 있지 않습니다.");
    }

    const toolInput = {
      form: {
        ...form,
        format: Array.isArray(form.format) ? form.format : [form.format],
      },
      problemCount,
      includeAnswers,
      maxIterations: 2,
      scoreThreshold: 9,
    };

    console.log("[ProbGenerate API] 에이전트 호출 시작:", {
      ...toolInput,
      derivedDifficulty: difficulty,
      requirement,
    });

    const result = (await execute(toolInput, {
      toolCallId: "prob-generate-api",
      messages: [],
    })) as {
      probBook: unknown;
      message: string;
      metadata: unknown;
    };

    console.log("[ProbGenerate API] 에이전트 결과:", result);

    const parsedProbBook = generatedProbBookSchema.parse(result.probBook);
    const metadataParse = pipelineMetadataSchema.safeParse(result.metadata);
    const classifications = metadataParse.success
      ? metadataParse.data.classifications
      : undefined;

    const classificationTags =
      classifications?.tags.tags
        ?.map((entry) => entry.tag)
        .filter((tag): tag is string => Boolean(tag)) ?? [];
    const mergedTags = Array.from(
      new Set([...(parsedProbBook.tags ?? []), ...classificationTags]),
    ).slice(0, 10);

    const probMetadata: ProbBookMetadata | undefined = classifications
      ? {
          topic: {
            mainCategory: classifications.topic.mainCategory,
            subCategory: classifications.topic.subCategory,
            confidence: classifications.topic.confidence,
            reason: classifications.topic.reason,
            alternatives: classifications.topic.alternatives,
          },
          age: {
            primary: classifications.age.primary,
            secondary: classifications.age.secondary,
            reasoning: classifications.age.reasoning,
            contentNotes: classifications.age.contentNotes,
          },
          difficulty: {
            level: classifications.difficulty.level,
            label: classifications.difficulty.label,
            expectedAccuracy: classifications.difficulty.expectedAccuracy,
            rationale: classifications.difficulty.rationale,
            preparationTips: classifications.difficulty.preparationTips,
          },
          tags: classifications.tags.tags?.map((entry) =>
            tagMetadataSchema.parse({
              tag: entry.tag,
              reason: entry.reason,
              confidence: entry.confidence,
              related: entry.related,
            }),
          ),
        }
      : undefined;
    const normalizedMetadata = probMetadata
      ? probBookMetadataSchema.parse(probMetadata)
      : undefined;

    let savedBookId: string | null = null;

    type CreateProbBlockInput = Parameters<
      typeof probService.createProbBlock
    >[0];

    try {
      const savedProbBook = await probService.createProbBook({
        ownerId,
        title: parsedProbBook.title,
        description: parsedProbBook.description,
        isPublic: parsedProbBook.isPublic ?? false,
        thumbnail: parsedProbBook.thumbnail,
        tags: mergedTags.length ? mergedTags : undefined,
      });

      savedBookId = savedProbBook.id;

      for (const [index, block] of parsedProbBook.blocks.entries()) {
        await probService.createProbBlock({
          probBookId: savedProbBook.id,
          ownerId,
          order: block.order ?? index,
          question: block.question,
          type: block.type as CreateProbBlockInput["type"],
          content: block.content as CreateProbBlockInput["content"],
          answer: (block.answer ?? undefined) as CreateProbBlockInput["answer"],
        });
      }
    } catch (dbError) {
      if (savedBookId) {
        await probService.deleteProbBook(savedBookId).catch((deleteError) => {
          console.error(
            "[ProbGenerate API] 롤백 실패:",
            deleteError instanceof Error ? deleteError.message : deleteError,
          );
        });
      }
      throw dbError;
    }

    if (!savedBookId) {
      throw new Error("문제집 저장에 실패했습니다.");
    }

    const dbProbBookId = savedBookId;

    const responsePayload = {
      probBook: {
        ...parsedProbBook,
        id: dbProbBookId,
        ownerId,
        tags: mergedTags,
        metadata: normalizedMetadata,
      },
      message: result.message,
      metadata: {
        requirement,
        problemCount,
        includeAnswers,
        difficulty,
        dbProbBookId,
        classifications,
        agentMetadata: result.metadata,
      },
    };

    console.log("[ProbGenerate API] 응답 페이로드:", responsePayload);

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Error generating prob book:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse("입력 데이터가 올바르지 않습니다."),
        { status: 400 },
      );
    }

    return NextResponse.json(
      errorResponse("문제 생성 중 오류가 발생했습니다."),
      { status: 500 },
    );
  }
}
