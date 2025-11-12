import {
  ageClassificationSchema,
  extendedDifficultySchema,
  tagSuggestionResultSchema,
  topicClassificationSchema,
} from "@agent/agents/prob-gen/tools/shared-schemas";
import { probBookMetadataSchema } from "@service/solves/shared";
import { z } from "zod";

export const DEFAULT_PROBLEM_COUNT = 10;

const stringOrStringArraySchema = z
  .union([z.string().min(1), z.array(z.string().min(1)).nonempty()])
  .transform((value) => (typeof value === "string" ? [value] : value));

export const probGenerationFormSchema = z.object({
  people: z.string().min(1),
  situation: z.string().min(1),
  format: stringOrStringArraySchema,
  platform: z.string().min(1),
  ageGroup: z.string().min(1),
  topic: z.array(z.string().min(1)).nonempty(),
  difficulty: z.string().min(1),
  description: z.string().optional().default(""),
});

export type ProbGenerationFormData = z.infer<typeof probGenerationFormSchema>;

export const probGenerationRequestSchema = z.object({
  form: probGenerationFormSchema,
  problemCount: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional(),
  includeAnswers: z.boolean().optional(),
});

const generatedProbBlockSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  type: z.string(),
  question: z.string().optional(),
  content: z.record(z.string(), z.unknown()),
  answer: z.unknown().optional(),
  tags: z.array(z.string()).optional(),
  order: z.number().optional(),
});

export type GeneratedProbBlock = z.infer<typeof generatedProbBlockSchema>;

export const generatedProbBookSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  ownerId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  blocks: z.array(generatedProbBlockSchema),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  thumbnail: z.string().optional(),
  metadata: probBookMetadataSchema.optional(),
});

export type GeneratedProbBook = z.infer<typeof generatedProbBookSchema>;

export const probGenerationResponseSchema = z.object({
  probBook: generatedProbBookSchema,
  message: z.string(),
  metadata: z
    .object({
      requirement: z.string(),
      problemCount: z.number(),
      includeAnswers: z.boolean(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      dbProbBookId: z.string().optional(),
      classifications: z
        .object({
          tags: tagSuggestionResultSchema,
          topic: topicClassificationSchema,
          age: ageClassificationSchema,
          difficulty: extendedDifficultySchema,
        })
        .optional(),
      agentMetadata: z.unknown().optional(),
    })
    .optional(),
});

export type ProbGenerationResponse = z.infer<
  typeof probGenerationResponseSchema
>;
export type ProbGenerationRequest = z.infer<typeof probGenerationRequestSchema>;
