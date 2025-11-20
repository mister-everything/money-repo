import {
  BlockAnswer,
  BlockAnswerSubmit,
  BlockContent,
  BlockType,
  WorkbookBlock,
} from "@service/solves/shared";

export type BlockMode = "edit" | "solve" | "review";

export type BaseBlockProps<T extends BlockType = BlockType> = {
  id: string;
  question: string;
  order: number;
  type: T;
  content: BlockContent<T>;
};

export type EditBlockProps<T extends BlockType = BlockType> =
  BaseBlockProps<T> & {
    mode: "edit";
    answer: BlockAnswer<T>;
    onUpdateBlock: (block: Partial<WorkbookBlock>) => void;
  };

export type SolveBlockProps<T extends BlockType = BlockType> =
  BaseBlockProps<T> & {
    mode: "solve";
    submit: BlockAnswerSubmit<T>;
    onUpdateSubmit: (submit: Partial<BlockAnswerSubmit<T>>) => void;
  };

export type ReviewBlockProps<T extends BlockType = BlockType> =
  BaseBlockProps<T> & {
    mode: "review";
    answer: BlockAnswer<T>;
    submit: BlockAnswerSubmit<T>;
    isCorrect: boolean;
  };
