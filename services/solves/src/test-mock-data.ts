import type {
  DefaultBlockAnswer,
  DefaultBlockContent,
  MatchingBlockAnswer,
  MatchingBlockContent,
  McqBlockAnswer,
  McqBlockContent,
  OxBlockAnswer,
  OxBlockContent,
  ProbBlock,
  ProbBookSaveInput,
  RankingBlockAnswer,
  RankingBlockContent,
} from "./types";

/**
 * suggest-code.ts에서 가져온 Mock 데이터들을 새로운 구조에 맞게 변환
 */

/**
 * 주관식 문제 예시
 */
const mockDefaultBlock: ProbBlock = {
  id: 1,
  type: "default",
  question: "한국의 수도는?",
  content: {
    type: "default",
    question: "한국의 수도는?",
  } as DefaultBlockContent,
  answer: {
    type: "default",
    answer: ["서울", "Seoul", "서울시"],
  } as DefaultBlockAnswer,
  tags: ["한국", "수도"],
};

/**
 * 객관식 문제 예시
 */
const mockMcqBlock: ProbBlock = {
  id: 2,
  type: "mcq",
  question: "한국의 수도는?",
  content: {
    type: "mcq",
    question: "한국의 수도는?",
    options: [
      {
        type: "text",
        text: "부산",
      },
      {
        type: "text",
        text: "서울",
      },
      {
        type: "text",
        text: "대구",
      },
      {
        type: "text",
        text: "광주",
      },
    ],
  } as McqBlockContent,
  answer: {
    type: "mcq",
    answer: [1], // "서울" (index 1)
  } as McqBlockAnswer,
  tags: ["상식"],
};

/**
 * 순위 맞추기 문제 예시
 */
const mockRankingBlock: ProbBlock = {
  id: 3,
  type: "ranking",
  question: "전세계 부자 순위를 맞춰보세요 (2024년 기준)",
  content: {
    type: "ranking",
    question: "전세계 부자 순위를 맞춰보세요 (2024년 기준)",
    items: [
      {
        id: "elon",
        type: "text",
        label: "일론 머스크 (Tesla, SpaceX CEO)",
      },
      {
        id: "bezos",
        type: "text",
        label: "제프 베조스 (Amazon 창업자)",
      },
      {
        id: "arnault",
        type: "text",
        label: "베르나르 아르노 (LVMH 회장)",
      },
      {
        id: "gates",
        type: "text",
        label: "빌 게이츠 (Microsoft 창업자)",
      },
    ],
  } as RankingBlockContent,
  answer: {
    type: "ranking",
    order: ["arnault", "elon", "bezos", "gates"],
  } as RankingBlockAnswer,
  tags: ["경제", "인물"],
};

/**
 * OX 퀴즈 문제 예시
 */
const mockOxBlock: ProbBlock = {
  id: 4,
  type: "ox",
  question: "지구는 평평하다?",
  content: {
    type: "ox",
    question: "지구는 평평하다?",
    oOption: {
      type: "text",
      text: "O (맞다)",
    },
    xOption: {
      type: "text",
      text: "X (틀리다)",
    },
  } as OxBlockContent,
  answer: {
    type: "ox",
    answer: "x",
  } as OxBlockAnswer,
  tags: ["과학", "상식"],
};

/**
 * 매칭 퀴즈 문제 예시
 */
const mockMatchingBlock: ProbBlock = {
  id: 5,
  type: "matching",
  question: "나라와 수도를 연결하세요",
  content: {
    type: "matching",
    question: "나라와 수도를 연결하세요",
    leftItems: [
      { id: "korea", content: "대한민국" },
      { id: "japan", content: "일본" },
      { id: "usa", content: "미국" },
      { id: "france", content: "프랑스" },
    ],
    rightItems: [
      { id: "seoul", content: "서울" },
      { id: "tokyo", content: "도쿄" },
      { id: "washington", content: "워싱턴 D.C." },
      { id: "paris", content: "파리" },
    ],
  } as MatchingBlockContent,
  answer: {
    type: "matching",
    pairs: [
      { leftId: "korea", rightId: "seoul" },
      { leftId: "japan", rightId: "tokyo" },
      { leftId: "usa", rightId: "washington" },
      { leftId: "france", rightId: "paris" },
    ],
  } as MatchingBlockAnswer,
  tags: ["지리", "상식"],
};

/**
 * 저장용 문제집 Mock 데이터
 */
export const mockProbBookSaveInput: ProbBookSaveInput = {
  ownerId: "test-user-123",
  title: "종합 상식 퀴즈",
  description: "다양한 형태의 문제로 구성된 상식 퀴즈입니다.",
  isPublic: true,
  blocks: [
    {
      type: "default",
      question: "한국의 수도는?",
      content: mockDefaultBlock.content,
      answer: mockDefaultBlock.answer,
      tags: ["한국", "수도"],
      order: 0,
    },
    {
      type: "mcq",
      question: "한국의 수도는?",
      content: mockMcqBlock.content,
      answer: mockMcqBlock.answer,
      tags: ["상식"],
      order: 1,
    },
    {
      type: "ranking",
      question: "전세계 부자 순위를 맞춰보세요 (2024년 기준)",
      content: mockRankingBlock.content,
      answer: mockRankingBlock.answer,
      tags: ["경제", "인물"],
      order: 2,
    },
    {
      type: "ox",
      question: "지구는 평평하다?",
      content: mockOxBlock.content,
      answer: mockOxBlock.answer,
      tags: ["과학", "상식"],
      order: 3,
    },
    {
      type: "matching",
      question: "나라와 수도를 연결하세요",
      content: mockMatchingBlock.content,
      answer: mockMatchingBlock.answer,
      tags: ["지리", "상식"],
      order: 4,
    },
  ],
  tags: ["상식", "퀴즈"],
  thumbnail: "https://example.com/thumbnail.png",
};

console.log("Mock 데이터가 생성되었습니다:");
console.log("- 주관식 문제:", mockDefaultBlock.question);
console.log("- 객관식 문제:", mockMcqBlock.question);
console.log("- 순위 맞추기:", mockRankingBlock.question);
console.log("- OX 퀴즈:", mockOxBlock.question);
console.log("- 매칭 퀴즈:", mockMatchingBlock.question);
console.log("문제집:", mockProbBookSaveInput.title);
