import { z } from "zod";

const defaultBlockContentSchema = z.object({
  type: z.literal("default"),
  question: z.string().optional(),
});

const defaultBlockAnswerSchema = z.object({
  type: z.literal("default"),
  answer: z.array(z.string()).min(1),
});

const mcqBlockContentOptionSchema = z.union([
  z.object({
    type: z.literal("source"),
    mimeType: z.string(),
    url: z.string().url(),
  }),
  z.object({
    type: z.literal("text"),
    text: z.string().min(1),
  }),
]);

const mcqBlockContentSchema = z.object({
  type: z.literal("mcq"),
  question: z.string().optional(),
  options: mcqBlockContentOptionSchema.array().min(2),
});

const mcqBlockAnswerSchema = z.object({
  type: z.literal("mcq"),
  answer: z.array(z.number().int().min(0)).min(1),
});

const rankingBlockItemSchema = z.union([
  z.object({
    id: z.string(),
    type: z.literal("text"),
    label: z.string().min(1),
  }),
  z.object({
    id: z.string(),
    type: z.literal("source"),
    mimeType: z.string(),
    url: z.string().url(),
  }),
]);

const rankingBlockContentSchema = z.object({
  type: z.literal("ranking"),
  question: z.string().optional(),
  items: rankingBlockItemSchema.array().min(2),
});

const rankingBlockAnswerSchema = z.object({
  type: z.literal("ranking"),
  order: z.array(z.string()).min(2),
});

const oxBlockOptionSchema = z.union([
  z.object({
    type: z.literal("source"),
    mimeType: z.string(),
    url: z.string().url(),
  }),
  z.object({
    type: z.literal("text"),
    text: z.string().min(1),
  }),
]);

const oxBlockContentSchema = z.object({
  type: z.literal("ox"),
  question: z.string().optional(),
  oOption: oxBlockOptionSchema,
  xOption: oxBlockOptionSchema,
});

const oxBlockAnswerSchema = z.object({
  type: z.literal("ox"),
  answer: z.enum(["o", "x"]),
});

const matchingBlockLeftItemSchema = z.object({
  id: z.string(),
  content: z.string().min(1),
  imageUrl: z.string().url().optional(),
});

const matchingBlockRightItemSchema = z.object({
  id: z.string(),
  content: z.string().min(1),
  imageUrl: z.string().url().optional(),
});

const matchingBlockContentSchema = z.object({
  type: z.literal("matching"),
  question: z.string().optional(),
  leftItems: matchingBlockLeftItemSchema.array().min(2),
  rightItems: matchingBlockRightItemSchema.array().min(2),
});

const matchingPairSchema = z.object({
  leftId: z.string(),
  rightId: z.string(),
});

const matchingBlockAnswerSchema = z.object({
  type: z.literal("matching"),
  pairs: matchingPairSchema.array().min(1),
});

export const probBookSaveSchema = z.object({
  id: z.number().optional(),
  ownerId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  blocks: z.array(
    z.object({
      id: z.number().optional(),
      type: z.enum(["default", "mcq", "ranking", "ox", "matching"]),
      question: z.string().optional(),
      content: z.union([
        defaultBlockContentSchema,
        mcqBlockContentSchema,
        rankingBlockContentSchema,
        oxBlockContentSchema,
        matchingBlockContentSchema,
      ]),
      answer: z
        .union([
          defaultBlockAnswerSchema,
          mcqBlockAnswerSchema,
          rankingBlockAnswerSchema,
          oxBlockAnswerSchema,
          matchingBlockAnswerSchema,
        ])
        .optional(),
      tags: z.array(z.string()).optional(),
      order: z.number().optional(),
    }),
  ),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  thumbnail: z.string().optional(),
});

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
  extra: z.record(z.string(), z.unknown()).optional(),
});

export const weightedPlanItemSchema = z.object({
  label: z.string(),
  weight: z.number().gte(0).lte(1),
  targetCount: z.number().int().min(0).optional(),
  problemType: z
    .enum(["default", "mcq", "ranking", "ox", "matching", "survey", "custom"])
    .optional(),
  rationale: z.string().optional(),
});

export const constraintItemSchema = z.object({
  label: z.string(),
  description: z.string().optional(),
});

export const strategyDifficultySchema = z.object({
  userDifficulty: z.string(),
  normalized: z.enum(["easy", "medium", "hard"]),
  rationale: z.string().optional(),
});

export const probGenerationStrategySchema = z.object({
  summary: z.string(),
  primaryGoal: z.string(),
  contentType: z.string(),
  tone: z.string().optional(),
  environment: z.string().optional(),
  requirementStatement: z.string(),
  recommendedProblemCount: z.number().int().min(1),
  includeAnswers: z.boolean(),
  formatPlan: weightedPlanItemSchema.array().nonempty(),
  topicPlan: weightedPlanItemSchema.array().nonempty(),
  difficulty: strategyDifficultySchema,
  participantNotes: z.string().optional(),
  platformNotes: z.string().optional(),
  constraints: constraintItemSchema.array().optional(),
  opportunities: constraintItemSchema.array().optional(),
  suggestedTags: z.array(z.string()).min(1),
  additionalNotes: z.array(z.string()).optional(),
});

export const evaluationScoreSchema = z.object({
  category: z.string(),
  score: z.number().min(0).max(10),
  reasoning: z.string().optional(),
});

export const evaluationCoverageSchema = z.object({
  label: z.string(),
  expectedCount: z.number().int().min(0).optional(),
  expectedWeight: z.number().min(0).max(1).optional(),
  actualCount: z.number().int().min(0),
  actualWeight: z.number().min(0).max(1).optional(),
  meetsExpectation: z.boolean(),
  notes: z.string().optional(),
});

export const evaluationIssueSchema = z.object({
  severity: z.enum(["low", "medium", "high", "critical"]),
  message: z.string(),
  category: z.string().optional(),
  blockIndex: z.number().int().min(0).optional(),
  blockId: z.union([z.string(), z.number()]).optional(),
});

export const evaluationSuggestionSchema = z.object({
  priority: z.enum(["low", "medium", "high"]),
  action: z.string(),
  target: z.string().optional(),
  rationale: z.string().optional(),
});

export const probDraftEvaluationSchema = z.object({
  overallScore: z.number().min(0).max(10),
  threshold: z.number().min(0).max(10).default(9),
  pass: z.boolean(),
  breakdown: evaluationScoreSchema.array().optional(),
  formatCoverage: evaluationCoverageSchema.array().optional(),
  topicCoverage: evaluationCoverageSchema.array().optional(),
  difficultyAssessment: z
    .object({
      normalized: z.enum(["easy", "medium", "hard"]),
      meetsExpectation: z.boolean(),
      notes: z.string().optional(),
    })
    .optional(),
  participantFit: z
    .object({
      meetsExpectation: z.boolean(),
      notes: z.string().optional(),
    })
    .optional(),
  platformFit: z
    .object({
      meetsExpectation: z.boolean(),
      notes: z.string().optional(),
    })
    .optional(),
  issues: evaluationIssueSchema.array().optional(),
  suggestions: evaluationSuggestionSchema.array().optional(),
  notes: z.array(z.string()).optional(),
});

export const refinementChangeSchema = z.object({
  description: z.string(),
  affectedBlocks: z.array(z.number().int().min(0)).optional(),
});

export const refineDraftResultSchema = z.object({
  probBook: probBookSaveSchema,
  appliedChanges: refinementChangeSchema.array().optional(),
  notes: z.array(z.string()).optional(),
});

export const promptExampleSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  json: z.string(),
});

export const promptPackageSchema = z.object({
  prompt: z.string(),
  summary: z.string(),
  guardrails: z.array(z.string()).optional(),
  checklist: z.array(z.string()).optional(),
  examples: promptExampleSchema.array().optional(),
  metadata: z
    .object({
      strategySummary: z.string().optional(),
      problemCount: z.number().int().min(1).max(50).optional(),
      includeAnswers: z.boolean().optional(),
    })
    .optional(),
});

export const probDraftGenerationSchema = z.object({
  probBook: probBookSaveSchema,
  raw: z.unknown().optional(),
  notes: z.array(z.string()).optional(),
});

export const tagSuggestionSchema = z.object({
  tag: z.string().min(1).max(8),
  reason: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  related: z.array(z.string().min(1).max(8)).max(3).optional(),
});

export const tagSuggestionResultSchema = z.object({
  tags: z.array(tagSuggestionSchema).max(10),
  summary: z.string().optional(),
  notes: z.array(z.string()).optional(),
});

export const topicClassificationSchema = z.object({
  mainCategory: z.string().min(1),
  subCategory: z.string().min(1),
  reason: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  alternatives: z.array(z.string().min(1)).optional(),
  autoTags: z.array(z.string().min(1).max(8)).optional(),
});

export const ageBandSchema = z.enum([
  "전체",
  "유아",
  "초등 저학년",
  "초등 고학년",
  "중등",
  "고등",
  "성인",
  "시니어",
]);

export const ageClassificationSchema = z.object({
  primary: ageBandSchema,
  secondary: z.array(ageBandSchema).optional(),
  reasoning: z.string().optional(),
  contentNotes: z.array(z.string()).optional(),
});

export const extendedDifficultySchema = z.object({
  level: z.enum(["very_easy", "easy", "medium", "hard", "very_hard"]),
  label: z.string().min(1),
  expectedAccuracy: z.number().min(0).max(1).optional(),
  rationale: z.string().optional(),
  preparationTips: z.array(z.string()).optional(),
});

export const situationOptionSchema = z.enum([
  "친목/파티",
  "학습/평가",
  "팀빌딩/교육",
  "콘텐츠",
]);

export const situationSelectionSchema = z.object({
  primary: situationOptionSchema,
  secondary: z.array(situationOptionSchema).optional(),
  rationale: z.string().optional(),
  guidance: z.array(z.string()).optional(),
});

export const problemTypeOptionSchema = z.enum([
  "객관식",
  "주관식",
  "O/X 퀴즈",
  "순위 매기기",
  "낱말 퀴즈",
  "이미지/오디오",
]);

export const problemTypeRecommendationSchema = z.object({
  type: problemTypeOptionSchema,
  reason: z.string().optional(),
  sampleUseCases: z.array(z.string()).optional(),
  weight: z.number().min(0).max(1).optional(),
});

export const problemTypeRecommendationResultSchema = z.object({
  recommendations: problemTypeRecommendationSchema.array().min(1),
  summary: z.string().optional(),
});

export const searchProfileSchema = z.object({
  tags: tagSuggestionResultSchema,
  topic: topicClassificationSchema,
  age: ageClassificationSchema,
  difficulty: extendedDifficultySchema,
  situation: situationSelectionSchema,
  problemTypes: problemTypeRecommendationResultSchema,
  notes: z.array(z.string()).optional(),
});

export type ProbBookSave = z.infer<typeof probBookSaveSchema>;
export type ProbGenerationForm = z.infer<typeof probGenerationFormSchema>;
export type ProbGenerationStrategy = z.infer<
  typeof probGenerationStrategySchema
>;
export type ProbDraftEvaluation = z.infer<typeof probDraftEvaluationSchema>;
export type RefineDraftResult = z.infer<typeof refineDraftResultSchema>;
export type WeightedPlanItem = z.infer<typeof weightedPlanItemSchema>;
export type ConstraintItem = z.infer<typeof constraintItemSchema>;
export type PromptPackage = z.infer<typeof promptPackageSchema>;
export type ProbDraftGeneration = z.infer<typeof probDraftGenerationSchema>;
export type TagSuggestion = z.infer<typeof tagSuggestionSchema>;
export type TagSuggestionResult = z.infer<typeof tagSuggestionResultSchema>;
export type TopicClassification = z.infer<typeof topicClassificationSchema>;
export type AgeBand = z.infer<typeof ageBandSchema>;
export type AgeClassification = z.infer<typeof ageClassificationSchema>;
export type ExtendedDifficulty = z.infer<typeof extendedDifficultySchema>;
export type SituationSelection = z.infer<typeof situationSelectionSchema>;
export type ProblemTypeRecommendation = z.infer<
  typeof problemTypeRecommendationSchema
>;
export type ProblemTypeRecommendationResult = z.infer<
  typeof problemTypeRecommendationResultSchema
>;
export type SearchProfile = z.infer<typeof searchProfileSchema>;
