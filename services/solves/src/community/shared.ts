import z from "zod";

export const createCommunityCommentSchema = z.object({
  content: z.string().min(1).max(280),
});

export type CreateCommunityCommentInput = z.infer<
  typeof createCommunityCommentSchema
>;
