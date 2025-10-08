import { BlockAnswer, BlockContent } from "./blocks";
import { ProbBlock } from "./types";

const defaultBlockContent: BlockContent<"default"> = {
  type: "default",
};

const defaultBlockAnswer: BlockAnswer<"default"> = {
  type: "default",
  answer: ["서울", "서울시", "Seoul"],
};

const defaultBlock: ProbBlock<"default"> = {
  type: "default",
  content: defaultBlockContent,
  answer: defaultBlockAnswer,
  id: 1,
  order: 1,
  question: "한국의 수도는?",
};

const mcqBlockContent: BlockContent<"mcq"> = {
  type: "mcq",
  options: [
    { id: "1", type: "text", text: "서울" },
    { id: "2", type: "text", text: "부산" },
    { id: "3", type: "text", text: "도쿄" },
    { id: "4", type: "text", text: "나가사키" },
  ],
};

const mcqBlockAnswer: BlockAnswer<"mcq"> = {
  type: "mcq",
  answer: ["1", "2"],
};

const mcqBlock: ProbBlock<"mcq"> = {
  type: "mcq",
  content: mcqBlockContent,
  answer: mcqBlockAnswer,
  id: 2,
  order: 2,
  question: "한국의 도시는?",
};

const oxBlockContent: BlockContent<"ox"> = {
  type: "ox",
  oOption: { id: "1", type: "text", text: "맞다" },
  xOption: { id: "2", type: "text", text: "틀리다" },
};

const oxBlockAnswer: BlockAnswer<"ox"> = {
  type: "ox",
  answer: "o",
};

const oxBlock: ProbBlock<"ox"> = {
  type: "ox",
  content: oxBlockContent,
  answer: oxBlockAnswer,
  id: 3,
  order: 3,
  question: "지구는 태양 주위를 돈다",
};

const rankingBlockContent: BlockContent<"ranking"> = {
  type: "ranking",
  items: [
    { id: "1", type: "text", text: "차은우" },
    { id: "2", type: "text", text: "송중기" },
    { id: "3", type: "text", text: "최성근" },
    { id: "4", type: "text", text: "전인산" },
  ],
};

const rankingBlockAnswer: BlockAnswer<"ranking"> = {
  type: "ranking",
  order: ["3", "2", "1", "4"],
};

const rankingBlock: ProbBlock<"ranking"> = {
  type: "ranking",
  content: rankingBlockContent,
  answer: rankingBlockAnswer,
  id: 4,
  order: 4,
  question: "잘생긴 사람 순서대로 나열하시오.",
};

export const mockData: ProbBlock[] = [
  defaultBlock,
  mcqBlock,
  oxBlock,
  rankingBlock,
];
