export const AUTH_COOKIE_PREFIX = "money-repo-solves";
export const SOLVES_PROTOCOL_TAG = "solves-protocol";

export const MAX_BLOCK_COUNT = 10;

export const WorkBookSituation = [
  {
    label: "친목",
    value: "social",
    description: "",
    aiPrompt: "",
  },
  {
    label: "콘텐츠",
    value: "contents",
    description: "",
    aiPrompt: "",
  },
  {
    label: "교육",
    value: "education",
    description: "",
    aiPrompt: "",
  },
] as const;

export const WorkBookAgeGroup = [
  {
    label: "전체",
    value: "all",
    description: "",
    aiPrompt: "",
  },
  {
    label: "유아",
    value: "toddler",
    description: "",
    aiPrompt: "",
  },
  {
    label: "아동",
    value: "child",
    description: "",
    aiPrompt: "",
  },
  {
    label: "청소년",
    value: "teen",
    description: "",
    aiPrompt: "",
  },
  {
    label: "성인",
    value: "adult",
    description: "",
    aiPrompt: "",
  },
  {
    label: "시니어",
    value: "senior",
    description: "",
    aiPrompt: "",
  },
] as const;

export const WorkBookDifficulty = [
  {
    label: "쉬움",
    value: "easy",
    description: "",
    aiPrompt: "",
  },
  {
    label: "보통",
    value: "normal",
    description: "",
    aiPrompt: "",
  },
  {
    label: "어려움",
    value: "hard",
    description: "",
    aiPrompt: "",
  },
] as const;
