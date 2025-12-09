import { generateUUID } from "@workspace/util";
import { BlockAnswer, BlockContent } from "./blocks";
import { WorkBookBlock } from "./types";

// Block 1: 주관식 문제
const defaultBlockContent: BlockContent<"default"> = {
  type: "default",
};

const defaultBlockAnswer: BlockAnswer<"default"> = {
  type: "default",
  answer: ["서울", "서울시", "Seoul", "한국"],
};

const defaultBlock: WorkBookBlock<"default"> = {
  type: "default",
  content: defaultBlockContent,
  answer: defaultBlockAnswer,
  id: generateUUID(),
  order: 1,
  question: "서울의 **수도**는 어디일까요?",
};

// Block 2: 객관식 다중 선택 문제
const mcqMultipleBlockContent: BlockContent<"mcq-multiple"> = {
  type: "mcq-multiple",
  options: [
    { id: "opt-1", type: "text", text: "최성근" },
    { id: "opt-2", type: "text", text: "일론 머스크" },
    { id: "opt-3", type: "text", text: "오수민" },
    { id: "opt-4", type: "text", text: "차은우" },
    { id: "opt-5", type: "text", text: "박주창" },
  ],
};

const mcqMultipleBlockAnswer: BlockAnswer<"mcq-multiple"> = {
  type: "mcq-multiple",
  answer: ["opt-2", "opt-4"], // 일론 머스크, 차은우
};

const mcqMultipleBlock: WorkBookBlock<"mcq-multiple"> = {
  type: "mcq-multiple",
  content: mcqMultipleBlockContent,
  answer: mcqMultipleBlockAnswer,
  id: generateUUID(),
  order: 2,
  question: "`Solves` 멤버가 아닌 사람을 고르시오",
};

// Block 3: 객관식 단일 선택 문제
const mcqBlockContent: BlockContent<"mcq"> = {
  type: "mcq",
  options: [
    { id: "opt-1", type: "text", text: "최성근" },
    { id: "opt-2", type: "text", text: "오수민" },
    { id: "opt-3", type: "text", text: "조현재" },
    { id: "opt-4", type: "text", text: "박주창" },
    { id: "opt-5", type: "text", text: "전인산" },
  ],
};

const mcqBlockAnswer: BlockAnswer<"mcq"> = {
  type: "mcq",
  answer: "opt-4", // 박주창
};

const mcqBlock: WorkBookBlock<"mcq"> = {
  type: "mcq",
  content: mcqBlockContent,
  answer: mcqBlockAnswer,
  id: generateUUID(),
  order: 3,
  question: "키 `183cm` **이상**인 사람은 누구일까요?",
};

// Block 4: 순위 맞추기 문제
const rankingBlockContent: BlockContent<"ranking"> = {
  type: "ranking",
  items: [
    { id: "item-1", type: "text", text: "최성근" },
    { id: "item-2", type: "text", text: "차은우" },
    { id: "item-3", type: "text", text: "침착맨" },
    { id: "item-4", type: "text", text: "옥동자" },
  ],
};

const rankingBlockAnswer: BlockAnswer<"ranking"> = {
  type: "ranking",
  order: ["item-1", "item-2", "item-3", "item-4"], // 최성근 > 차은우 > 침착맨 > 옥동자
};

const rankingBlock: WorkBookBlock<"ranking"> = {
  type: "ranking",
  content: rankingBlockContent,
  answer: rankingBlockAnswer,
  id: generateUUID(),
  order: 4,
  question:
    "잘생긴 순서대로 나열하세요.\n\n> 정직한 문제 입니다. 최대한 솔직하게 풀어 주세요.",
};

// Block 5: OX 퀴즈 문제
const oxBlockContent: BlockContent<"ox"> = {
  type: "ox",
};

const oxBlockAnswer: BlockAnswer<"ox"> = {
  type: "ox",
  answer: true,
};

const oxBlock: WorkBookBlock<"ox"> = {
  type: "ox",
  content: oxBlockContent,
  answer: oxBlockAnswer,
  id: generateUUID(),
  order: 5,
  question:
    '아래 코드의 `console.log` 결과는 `one` 이다.\n\n```ts\nconst arr = ["one","two","three"];\n\nconsole.log(arr[0])\n```\n',
};

export const mockData: WorkBookBlock[] = [
  defaultBlock,
  mcqMultipleBlock,
  mcqBlock,
  rankingBlock,
  oxBlock,
];
