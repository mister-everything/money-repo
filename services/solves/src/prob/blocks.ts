import z from "zod";
import { blockBuilder } from "./create-block";

const textOption = z.object({
  id: z.string(),
  type: z.literal("text"),
  text: z.string().min(1),
});

const sourceOption = z.object({
  id: z.string(),
  type: z.literal("source"),
  mimeType: z.string(),
  url: z.string(),
});

/**
 * 주관식 문제
 *
 * type: "default"
 * question: 한국의 수도는?
 * answer: ["서울", "Seoul", "서울시"]
 * answerSubmit: "서울"
 *
 * checker: answerSubmit 이 answer 중에 하나라도 일치하면 정답.
 */
const defaultBlock = blockBuilder("default")
  // .content() 은 필요 없음.
  .answer(
    z.object({
      answer: z.array(z.string().min(1)).min(1),
    }),
  )
  .answerSubmit(
    z.object({
      answer: z.string().min(1),
    }),
  )
  .checker((correctAnswer, submittedAnswer) => {
    const submitted = submittedAnswer.answer;
    return correctAnswer.answer.some((answer) => submitted === answer);
  })
  .build();

export type DefaultBlockContent = z.infer<typeof defaultBlock.contentSchema>;

export type DefaultBlockAnswer = z.infer<typeof defaultBlock.answerSchema>;

export type DefaultBlockAnswerSubmit = z.infer<
  typeof defaultBlock.answerSubmitSchema
>;

/**
 * 객관식 문제
 *
 * type: "mcq"
 * question: 한국의 도시는?
 * options: [{type: "text", text: "서울"}, {type: "text", text: "도쿄"}, {type: "text", text: "나가사키"}, {type: "text", text: "부산"}]
 * answer: [0,2]
 * answerSubmit: [0,2]
 */
const mcqBlock = blockBuilder("mcq")
  .content(
    z.object({
      options: z.array(z.union([textOption, sourceOption])).min(2), // 최소 2개의 선택지 필요
    }),
  )
  .answer(
    z.object({
      answer: z.array(z.string()).min(1), // 정답이 여러개 일 수 있음.
    }),
  )
  .answerSubmit(
    z.object({
      answer: z.array(z.string()).min(1), // 제출된 답안은 여러개 일 수 있음.
    }),
  )
  .checker((correctAnswer, submittedAnswer) => {
    const submitted = submittedAnswer.answer;
    return (
      submitted.length === correctAnswer.answer.length &&
      correctAnswer.answer.every((answer) => submitted.includes(answer))
    );
  })
  .build();

export type McqBlockContent = z.infer<typeof mcqBlock.contentSchema>;

export type McqBlockAnswer = z.infer<typeof mcqBlock.answerSchema>;

export type McqBlockAnswerSubmit = z.infer<typeof mcqBlock.answerSubmitSchema>;

/**
 * 순위 맞추기 문제
 *
 * type: "ranking"
 * question: 한국의 도시는?
 * items: [{type: "text", text: "서울"}, {type: "text", text: "도쿄"}, {type: "text", text: "나가사키"}, {type: "text", text: "부산"}]
 * answer: ["서울", "나가사키"]
 * answerSubmit: ["서울", "나가사키"]
 */
const rankingBlock = blockBuilder("ranking")
  .content(
    z.object({
      items: z.array(z.union([textOption, sourceOption])).min(2),
    }),
  )
  .answer(
    z.object({
      order: z.array(z.string()).min(2),
    }),
  )
  .answerSubmit(
    z.object({
      order: z.array(z.string()),
    }),
  )
  .checker((correctAnswer, submittedAnswer) => {
    const correct = correctAnswer.order;
    const submitted = submittedAnswer.order;
    if (correct.length !== submitted.length) return false;
    return correct.every((id, index) => id === submitted[index]);
  })
  .build();

export type RankingBlockContent = z.infer<typeof rankingBlock.contentSchema>;

export type RankingBlockAnswer = z.infer<typeof rankingBlock.answerSchema>;

export type RankingBlockAnswerSubmit = z.infer<
  typeof rankingBlock.answerSubmitSchema
>;

/**
 * 오답 문제
 *
 * type: "ox"
 * question: 한국의 수도는? 부산이다
 * answer: "x"
 * answerSubmit: "x"
 */
const oxBlock = blockBuilder("ox")
  .content(
    z.object({
      oOption: z.union([textOption, sourceOption]),
      xOption: z.union([textOption, sourceOption]),
    }),
  )
  .answer(
    z.object({
      answer: z.enum(["o", "x"]),
    }),
  )
  .answerSubmit(
    z.object({
      answer: z.enum(["o", "x"]),
    }),
  )
  .checker((correctAnswer, submittedAnswer) => {
    return correctAnswer.answer === submittedAnswer.answer;
  })
  .build();

export type OxBlockContent = z.infer<typeof oxBlock.contentSchema>;

export type OxBlockAnswer = z.infer<typeof oxBlock.answerSchema>;

export type OxBlockAnswerSubmit = z.infer<typeof oxBlock.answerSubmitSchema>;

export const All_BLOCKS = {
  [defaultBlock.type]: defaultBlock,
  [mcqBlock.type]: mcqBlock,
  [rankingBlock.type]: rankingBlock,
  [oxBlock.type]: oxBlock,
} as const;

export type BlockType = keyof typeof All_BLOCKS;

export type BlockContent<T extends BlockType = BlockType> = z.infer<
  (typeof All_BLOCKS)[T]["contentSchema"]
>;
export type BlockAnswer<T extends BlockType = BlockType> = z.infer<
  (typeof All_BLOCKS)[T]["answerSchema"]
>;
export type BlockAnswerSubmit<T extends BlockType = BlockType> = z.infer<
  (typeof All_BLOCKS)[T]["answerSubmitSchema"]
>;
