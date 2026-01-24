export type CommunityComment = {
  id: string;
  content: string;
  createdAt: Date;
  ownerPublicId: number;
  ownerName: string | null;
  ownerProfile: string | null;
  ownerRole: string | null;
};
