import { BlockType, blockDisplayNames } from "@service/solves/shared";
import z from "zod";

const difficulty = ["easy", "medium", "hard"] as const;
const blockTypes = Object.keys(blockDisplayNames) as BlockType[];

// 개별 문제 계획 스키마
const blockPlanItemSchema = z.object({
  type: z.enum(blockTypes).describe("문제 유형"),
  intent: z.string().describe("문제 의도 및 목적"),
  learningObjective: z.string().describe("이 문제를 통해 달성할 학습 목표"),
  expectedDifficulty: z
    .enum(difficulty)
    .default("medium")
    .describe("예상 난이도"),
  topic: z.string().describe("다룰 주제 또는 개념"),
  notes: z.string().optional().describe("추가 메모 또는 특별 고려사항"),
});

// 전체 개요 스키마
const overviewSchema = z.object({
  title: z.string().describe("문제집 제목"),
  description: z.string().describe("문제집 설명"),
  goal: z.string().describe("문제집의 전체 목표"),
  targetAudience: z
    .string()
    .describe("문제집 대상 (예: 중학교 1학년, 일반인 등)"),
  difficulty: z
    .enum(difficulty)
    .default("medium")
    .describe("문제집 전체 난이도"),
});

// 전체 문제집 계획 스키마
export const workbookPlanSchema = z.object({
  overview: overviewSchema.describe("문제집 전체 개요"),
  blockPlans: z
    .array(blockPlanItemSchema)
    .min(1)
    .describe("각 문제에 대한 상세 계획 목록"),
  constraints: z.array(z.string()).optional(),
  guidelines: z.array(z.string()).optional(),
});

export type WorkbookPlan = z.infer<typeof workbookPlanSchema>;
