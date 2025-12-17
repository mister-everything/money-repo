import { BlockType } from "@service/solves/shared";

export type SolvesMentionItem =
  | {
      kind: "block"; // 문제 블록 멘션
      id: string;
      order: number;
      blockType: BlockType;
    }
  | {
      kind: "user"; // 사용자 멘션 ** example임 실제 사용 안함
      id: string;
      name: string;
    };

export type TipTapMentionJsonContentPart =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "mention";
      attrs: {
        id: SolvesMentionItem;
      };
    }
  | {
      type: "hardBreak";
    };

export type TipTapMentionJsonContent = {
  type: "doc";
  content: {
    type: "paragraph";
    content?: TipTapMentionJsonContentPart[];
  }[];
};
