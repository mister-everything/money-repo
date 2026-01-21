import { CommunityCommentTable } from "./schema";

export type CommunityComment = typeof CommunityCommentTable.$inferSelect;

export type CommunityCommentWithUser = CommunityComment & {
  user: {
    id: string;
    name: string | null;
    nickname: string | null;
    image: string | null;
  };
};
