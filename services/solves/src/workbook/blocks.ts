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
  .displayName("주관식")
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
 * answer: 1
 * answerSubmit: [0,2]
 */
const mcqMultipleBlock = blockBuilder("mcq-multiple")
  .displayName("객관식 다중")
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
      // TODO: 다중 정답 체크 로직 추가 필요
      // submitted.length === correctAnswer.answer.length &&
      correctAnswer.answer.some((answer) => submitted.includes(answer))
    );
  })
  .build();

const mcqBlock = blockBuilder("mcq")
  .displayName("객관식")
  .content(
    z.object({
      options: z.array(z.union([textOption, sourceOption])).min(2), // 최소 2개의 선택지 필요
    }),
  )

  .answer(
    z.object({
      answer: z.string().min(1),
    }),
  )
  .answerSubmit(
    z.object({
      answer: z.string().min(1),
    }),
  )
  .checker((correctAnswer, submittedAnswer) => {
    const submitted = submittedAnswer.answer;
    return correctAnswer.answer === submitted;
  })
  .build();

export type McqBlockContent = z.infer<typeof mcqMultipleBlock.contentSchema>;

export type McqBlockAnswer = z.infer<typeof mcqMultipleBlock.answerSchema>;

export type McqBlockAnswerSubmit = z.infer<
  typeof mcqMultipleBlock.answerSubmitSchema
>;

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
  .displayName("순위 맞추기")
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
  .displayName("OX 퀴즈")
  .answer(
    z.object({
      answer: z.boolean(),
    }),
  )
  .answerSubmit(
    z.object({
      answer: z.boolean(),
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
  [mcqMultipleBlock.type]: mcqMultipleBlock,
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
