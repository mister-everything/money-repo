import { boolean, jsonb, pgSchema, text } from "drizzle-orm/pg-core";
import { z } from "zod";

/**
 * types.ts
 */

// 일반 주관식 문제
// 모든 문제 타입에는 기본적으로 type,question 컬럼이 있음
// 문제 뿐 아니라 정답마저 타입마다 형태가 다름
// 문제 형태 추가할때 마다  content, answer, answerSubmit 타입 정의해야함
export const defaultBlockContentSchema = z.object({
  type: z.literal("default"),
  question: z.string().optional(),
});
// 일반 주관식 문제 정답
export const defaultBlockAnswerSchema = z.object({
  type: z.literal("default"),
  answer: z.array(z.string()),
});
// 일반 주관식 문제 정답 제출
export const defaultBlockAnswerSubmitSchema = z.object({
  type: z.literal("default"),
  answer: z.string(),
});

// 객관식 문제 선택지
export const mcqBlockContentOptionSchema = z.union([
  z.object({
    type: z.literal("source"),
    mimeType: z.string(),
    url: z.string(),
  }),
  z.object({
    type: z.literal("text"),
    text: z.string(),
  }),
]);

// 객관식 문제
export const mcqBlockContentSchema = z.object({
  type: z.literal("mcq"),
  question: z.string().optional(),
  options: mcqBlockContentOptionSchema.array(),
});

// 객관식 문제 정답
export const mcqBlockAnswerSchema = z.object({
  type: z.literal("mcq"),
  answer: z.array(z.number()),
});

// 객관식 문제 정답 제출
export const mcqBlockAnswerSubmitSchema = z.object({
  type: z.literal("mcq"),
  answer: z.array(z.number()), // 복수형으로 제출 할 수 있음
});

// 주관식 문제
export type DefaultBlockContent = z.infer<typeof defaultBlockContentSchema>;
export type DefaultBlockAnswer = z.infer<typeof defaultBlockAnswerSchema>;
export type DefaultBlockAnswerSubmit = z.infer<
  typeof defaultBlockAnswerSubmitSchema
>;

// 객관식 문제
export type McqBlockContent = z.infer<typeof mcqBlockContentSchema>;
export type McqBlockAnswer = z.infer<typeof mcqBlockAnswerSchema>;
export type McqBlockAnswerSubmit = z.infer<typeof mcqBlockAnswerSubmitSchema>;

export type ProbBlockContent = DefaultBlockContent | McqBlockContent;
export type ProbBlockAnswer = DefaultBlockAnswer | McqBlockAnswer;
export type ProbBlockAnswerSubmit =
  | DefaultBlockAnswerSubmit
  | McqBlockAnswerSubmit;

export type ProbBlock = {
  id: string;
  type: ProbBlockContent["type"]; //  content 에 포함되어있어도 db 검색을 위해 별도 컬럼
  question?: string; // content 에 포함되어있어도 db 검색을 위해 별도 컬럼
  content: ProbBlockContent;
  answer?: ProbBlockAnswer;
  tags: string[];
};

export type ProbBook = {
  id: string;
  title: string;
  description?: string;
  blocks: ProbBlock[]; // 문제 블록
  tags: string[];
  isPublic: boolean;
};

/**
 * @MockData
 */

// 주관식 문제 블록 예시
export const MockDefaultBlock: ProbBlock = {
  id: "1",
  type: "default",
  question: "한국의 수도는?",
  content: {
    //실제 디비에 저장할때 content 에서 type,question 은 제외하고 저장함
    // type,question 은 항상 모든 문제에 필요한 컬럼, 디비검색을 위해 별도 컬럼
    type: "default",
    question: "한국의 수도는?",
  },
  answer: {
    type: "default",
    answer: ["서울", "Seoul", "서울시"],
  },
  tags: ["한국", "수도"],
};

// 객관식 문제 블록 예시
export const MockMcqBlock: ProbBlock = {
  id: "2",
  type: "mcq",
  question: "한국의 수도는?",
  content: {
    type: "mcq",
    question: "한국의 수도는?",
    options: [
      {
        type: "source",
        mimeType: "image/png",
        url: "https://example.com/image.png",
      },
      {
        type: "text",
        text: "서울",
      },
      {
        type: "text",
        text: "부산",
      },
      {
        type: "text",
        text: "대구",
      },
    ],
  },
  answer: {
    type: "mcq",
    answer: [1],
  },
  tags: ["상식"],
};

export const MockProbBook: ProbBook = {
  id: "1",
  title: "상식 퀴즈",
  description: "상식 퀴즈 문제 모음",
  blocks: [MockDefaultBlock, MockMcqBlock],
  tags: ["상식"],
  isPublic: true,
};

/**
 * @schema.ts
 */

const testSchema = pgSchema("test");

export const ProbBookTable = testSchema.table("prob_books", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  // tag  생성자 생성일자 등등 ...
});

export const ProbBlockTable = testSchema.table("prob_blocks", {
  id: text("id").primaryKey(),
  probBookId: text("prob_book_id")
    .notNull()
    .references(() => ProbBookTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  question: text("question"),
  content: jsonb("content").notNull().$type<ProbBlockContent>(),
  answer: jsonb("answer").$type<ProbBlockAnswer>(),
  // tag 생성자 생성일자 등등 ...
});

export const ProbBlockAnswerSubmitTable = testSchema.table(
  "prob_block_answer_submits",
  {
    id: text("id").primaryKey(),
    probBlockId: text("prob_block_id")
      .notNull()
      .references(() => ProbBlockTable.id, { onDelete: "cascade" }),
    answer: jsonb("answer").notNull().$type<ProbBlockAnswerSubmit>(),
    // 생성자 생성일자 등등 ...
  },
);

/**
 * @utils.ts
 */

export const isMaybeDefaultContent = (
  block: ProbBlockContent,
): block is DefaultBlockContent => {
  return block.type === "default";
};

export const isMaybeMcqContent = (
  block: ProbBlockContent,
): block is McqBlockContent => {
  return block.type === "mcq";
};

export const checkAnswer = (
  correctAnswer?: ProbBlockAnswer,
  submittedAnswer?: ProbBlockAnswerSubmit,
) => {
  if (!correctAnswer || !submittedAnswer) return false;
  if (correctAnswer?.type !== submittedAnswer?.type) return false;

  switch (correctAnswer?.type) {
    case "default":
      return checkDefaultAnswer(
        correctAnswer,
        submittedAnswer as DefaultBlockAnswerSubmit,
      );
    case "mcq":
      return checkMcqAnswer(
        correctAnswer,
        submittedAnswer as McqBlockAnswerSubmit,
      );
    default:
      throw new Error("정의되지 않은 문제 형태");
  }
};

export const checkDefaultAnswer = (
  correctAnswer: DefaultBlockAnswer,
  submittedAnswer: DefaultBlockAnswerSubmit,
) => {
  const submitted = submittedAnswer.answer;
  // 주관식은 이중 하나라도 맞으면 정답
  const isOk = correctAnswer.answer.some((answer) =>
    submitted.includes(answer),
  );
  return isOk;
};

export const checkMcqAnswer = (
  correctAnswer: McqBlockAnswer,
  submittedAnswer: McqBlockAnswerSubmit,
) => {
  const submitted = submittedAnswer.answer;
  // 객관식은 모두 맞아야 정답
  const isOk = correctAnswer.answer.every((answer) =>
    submitted.includes(answer),
  );
  return isOk;
};
