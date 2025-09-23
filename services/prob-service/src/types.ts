import { z } from "zod";

/**
 * @description 문제 스타일 포맷
 * @param generalFormat 일반적인 1번 ~, 2번 ~ 텍스트형
 * @param mixedFormat 텍스트 + 도표가 있는 포맷 (임시)
 */
export type styleFormat = "generalFormat" | "mixedFormat";

/**
 * @description 각 유형별 필요 데이터 맵
 * @param text 텍스트 데이터
 * @param image 이미지 데이터
 * @param video 비디오 데이터
 * @param audio 오디오 데이터
 * @param mixed 여러 리소스
 */
export type ProbBlockDataMap = {
  text: { content: string };
  image: { content: string; url?: string };
  video: { content: string; url?: string; duration?: number };
  audio: { content: string; url?: string; duration?: number };
  mixed: { content: string; url?: string; duration?: number }[];
};

export type BaseProbBlock<
  T extends keyof ProbBlockDataMap = keyof ProbBlockDataMap,
> = {
  id: string;
  type: T;
  data: ProbBlockDataMap[T];
};

/**
 * @description 문제 내용
 */
export type ProbCotentType =
  | BaseProbBlock<"text">
  | BaseProbBlock<"image">
  | BaseProbBlock<"video">
  | BaseProbBlock<"audio">
  | BaseProbBlock<"mixed">;

/**
 * @description 문제 보기 (선택지)
 */
export type ProbSelectType =
  | BaseProbBlock<"text">
  | BaseProbBlock<"image">
  | BaseProbBlock<"video">
  | BaseProbBlock<"audio">;

/**
 * @description 객관식 정답 정책
 * @param kind objective
 * @param multiple 복수 선택 여부
 * @param randomized 랜덤 정답 여부
 */
export type ObjectiveAnswerMeta = {
  kind: "objective";
  multiple?: boolean;
  randomized?: boolean;
};

/**
 * @description 주관식 정답 정책
 * @param kind subjective
 * @param charLimit 주관식 최대 글자 수
 * @param lines 주관식 최대 줄 수
 * @param placeholder 주관식 입력 플레이스홀더
 */
export type SubjectiveAnswerMeta = {
  kind: "subjective";
  charLimit?: number;
  lines?: number;
  placeholder?: string;
};

export type AnswerMeta = ObjectiveAnswerMeta | SubjectiveAnswerMeta;

/**
 * @description 문제 블록
 * @param id 문제 블록 id
 * @param style 문제 스타일 (포맷)
 * @param content 문제 내용
 * @param answerMeta 문제 정답 메타
 * @param options 문제 선택지
 * @param title 문제 제목
 */
export type ProbBlock = {
  id: string;
  style: styleFormat;
  content: ProbCotentType;
  answerMeta: AnswerMeta;
  options?: ProbSelectType[];
  title?: string;
  tags?: string[];
};

/**
 * @description 문제집 타입
 * @param id 문제집 id
 * @param ownerId 문제집 소유자 id
 * @param title 문제집 제목
 * @param description 문제집 설명
 * @param blocks 문제 블록
 * @param tags 문제집 태그
 * @param createdAt 문제집 생성 시간
 * @param updatedAt 문제집 수정 시간
 */
export type ProbBook = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  blocks: ProbBlock[];
  tags: string[] | null;
  createdAt: Date;
  updatedAt: Date;
};

// Zod 스키마 정의
export const probBlockDataSchema = z.union([
  z.object({
    content: z.string(),
  }),
  z.object({
    content: z.string(),
    url: z.string().optional(),
  }),
  z.object({
    content: z.string(),
    url: z.string().optional(),
    duration: z.number().optional(),
  }),
  z.array(
    z.object({
      content: z.string(),
      url: z.string().optional(),
      duration: z.number().optional(),
    }),
  ),
]);

export const baseProbBlockSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "image", "video", "audio", "mixed"]),
  data: probBlockDataSchema,
});

export const objectiveAnswerMetaSchema = z.object({
  kind: z.literal("objective"),
  multiple: z.boolean().optional(),
  randomized: z.boolean().optional(),
});

export const subjectiveAnswerMetaSchema = z.object({
  kind: z.literal("subjective"),
  charLimit: z.number().optional(),
  lines: z.number().optional(),
  placeholder: z.string().optional(),
});

export const answerMetaSchema = z.union([
  objectiveAnswerMetaSchema,
  subjectiveAnswerMetaSchema,
]);

export const probBlockSchema = z.object({
  id: z.string(),
  style: z.enum(["generalFormat", "mixedFormat"]),
  content: baseProbBlockSchema,
  answerMeta: answerMetaSchema,
  options: z.array(baseProbBlockSchema).optional(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const probBookSaveSchema = z.object({
  id: z.string().optional(),
  ownerId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  blocks: z.array(probBlockSchema),
  tags: z.array(z.string()).nullable().optional(),
});
