import type { ZodObject, ZodType } from "zod";
import { z } from "zod";
import {
  ProbCheckerError,
  ProbInvalidAnswerError,
  ProbInvalidAnswerSubmitError,
  ProbWrongAnswerError,
} from "./error";

export interface Block<
  BlockType extends string,
  Content = any,
  Answer = any,
  AnswerSubmit = any,
> {
  type: BlockType;
  contentSchema: ZodType<Content>;
  answerSchema: ZodType<Answer>;
  answerSubmitSchema: ZodType<AnswerSubmit>;
  checkAnswer: (correctAnswer: unknown, submittedAnswer: unknown) => boolean; // 오답 시 예외 발생
  isMaybeContent: (block: any) => block is Content;
  isMaybeAnswer: (block: any) => block is Answer;
  isMaybeAnswerSubmit: (block: any) => block is AnswerSubmit;
}

export interface BlockBuilderContext<
  BlockType extends string,
  Content = { type: BlockType },
  Answer = { type: BlockType },
  AnswerSubmit = { type: BlockType },
  O extends string = never,
> {
  content<T extends ZodObject>(
    content: T,
  ): Omit<
    BlockBuilderContext<
      BlockType,
      z.infer<T> & { type: BlockType },
      Answer,
      AnswerSubmit,
      O | "content"
    >,
    O | "content"
  >;
  answer<T extends ZodObject>(
    answer: T,
  ): Omit<
    BlockBuilderContext<
      BlockType,
      Content,
      z.infer<T> & { type: BlockType },
      AnswerSubmit,
      O | "answer"
    >,
    O | "answer"
  >;
  answerSubmit<T extends ZodObject>(
    answerSubmit: T,
  ): Omit<
    BlockBuilderContext<
      BlockType,
      Content,
      Answer,
      z.infer<T> & { type: BlockType },
      O | "answerSubmit"
    >,
    O | "answerSubmit"
  >;
  checker(
    checker: (correctAnswer: Answer, submittedAnswer: AnswerSubmit) => boolean,
  ): Omit<
    BlockBuilderContext<
      BlockType,
      Content,
      Answer,
      AnswerSubmit,
      O | "checker"
    >,
    O | "checker"
  >;
  build(): Block<BlockType, Content, Answer, AnswerSubmit>;
}

export function blockBuilder<BlockType extends string>(
  type: BlockType,
): BlockBuilderContext<BlockType> {
  let content: any;
  let answer: any;
  let answerSubmit: any;
  let checkerFn: (correctAnswer: any, submittedAnswer: any) => boolean;

  const context = {
    build() {
      if (!answer) {
        throw new Error(`${type} 블록의 정답 스키마가 없습니다.`);
      }
      if (!answerSubmit) {
        throw new Error(`${type} 블록의 제출 답안 스키마가 없습니다.`);
      }
      if (!checkerFn) {
        throw new Error(`${type} 블록의 체커 함수가 없습니다.`);
      }

      const baseContentSchema = z.object({
        type: z.literal(type),
        question: z.string().optional(),
      });
      const resolvedContentSchema = content
        ? baseContentSchema.merge(content)
        : baseContentSchema;

      const baseAnswerSchema = z.object({ type: z.literal(type) });
      const resolvedAnswerSchema = baseAnswerSchema.merge(answer);
      const resolvedAnswerSubmitSchema = baseAnswerSchema.merge(answerSubmit);

      const block: Block<BlockType> = {
        type,
        contentSchema: resolvedContentSchema.default({
          type: type,
          question: undefined,
        }),
        answerSchema: resolvedAnswerSchema.default({ type: type }),
        answerSubmitSchema: resolvedAnswerSubmitSchema.default({ type: type }),
        checkAnswer(correctAnswer, submittedAnswer) {
          const correct = block.answerSchema.safeParse(correctAnswer);
          if (!correct.success) {
            // 잘못된 정답 형식
            throw new ProbInvalidAnswerError();
          }
          const submitted = block.answerSubmitSchema.safeParse(submittedAnswer);
          if (!submitted.success) {
            // 잘못된 제출 형식
            throw new ProbInvalidAnswerSubmitError();
          }
          try {
            // TODO: 배점 처리 추가
            console.log(correct.data, submitted.data);
            console.log(checkerFn(correct.data, submitted.data));
            const isOk = checkerFn(correct.data, submitted.data);
            if (!isOk) {
              return false;
            }
          } catch (error) {
            if (error instanceof ProbWrongAnswerError) {
              throw error;
            }
            console.error(error);
            throw new ProbCheckerError({
              originalError: error,
              correctAnswer: correct.data,
              submittedAnswer: submitted.data,
            });
          }
          return true;
        },
        isMaybeContent(block: any): block is unknown {
          return block?.type === type;
        },
        isMaybeAnswer(block: any): block is unknown {
          return block?.type === type;
        },
        isMaybeAnswerSubmit(block: any): block is unknown {
          return block?.type === type;
        },
      };
      return block;
    },
    content(schema) {
      content = schema;
      return context;
    },
    answer(schema) {
      answer = schema;
      return context;
    },
    answerSubmit(schema) {
      answerSubmit = schema;
      return context;
    },
    checker(checker) {
      checkerFn = checker;
      return context;
    },
  } as BlockBuilderContext<BlockType>;

  return context;
}
