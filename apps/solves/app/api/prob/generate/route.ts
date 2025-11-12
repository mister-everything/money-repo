import { generateProbBookTool } from "@agent/agents/prob-gen/tools/generate-prob-book";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  DEFAULT_PROBLEM_COUNT,
  type ProbGenerationFormData,
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

export async function POST(request: NextRequest) {
  try {
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

    const responsePayload = {
      probBook: result.probBook,
      message: result.message,
      metadata: {
        requirement,
        problemCount,
        includeAnswers,
        difficulty,
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
