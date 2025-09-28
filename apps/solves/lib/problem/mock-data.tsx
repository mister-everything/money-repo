import { ProbBook } from "@/type";

export const mockProbBook: ProbBook = {
  id: "1",
  ownerId: "100001",
  title: "기초 과학 문제집",
  description: "기초 과학에 대한 다양한 유형의 문제를 풀어보세요.",
  blocks: [
    {
      id: "prob-1",
      style: "generalFormat",
      title: "물의 상태 변화",
      tags: ["과학", "화학", "초등"],
      content: {
        id: "content-1",
        type: "text",
        data: {
          content: "물이 얼 때 나타나는 상태 변화를 고르세요.",
        },
      },
      answerMeta: {
        kind: "objective",
        multiple: false,
      },
      options: [
        {
          id: "option-1",
          type: "text",
          data: { content: "응고" },
        },
        {
          id: "option-2",
          type: "text",
          data: { content: "기화" },
        },
        {
          id: "option-3",
          type: "text",
          data: { content: "승화" },
        },
      ],
    },
    {
      id: "prob-2",
      style: "mixedFormat",
      title: "동물 사진 분류",
      tags: ["과학", "생물", "사진"],
      content: {
        id: "content-2",
        type: "image",
        data: {
          content: "아래 사진의 동물은 어떤 분류에 속할까요?",
          url: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&h=300&fit=crop",
        },
      },
      answerMeta: {
        kind: "objective",
        multiple: false,
      },
      options: [
        {
          id: "option-4",
          type: "text",
          data: { content: "포유류" },
        },
        {
          id: "option-5",
          type: "text",
          data: { content: "파충류" },
        },
        {
          id: "option-6",
          type: "text",
          data: { content: "조류" },
        },
      ],
    },
    {
      id: "prob-3",
      style: "generalFormat",
      title: "증기기관의 원리",
      tags: ["과학", "물리", "주관식"],
      content: {
        id: "content-3",
        type: "text",
        data: {
          content: "증기기관이 작동하는 원리를 간략하게 설명하세요.",
        },
      },
      answerMeta: {
        kind: "subjective",
        charLimit: 200,
        lines: 3,
        placeholder: "여기에 답을 작성하세요.",
      },
    },
    {
      id: "prob-4",
      style: "mixedFormat",
      title: "비디오 문제",
      tags: ["과학", "실험", "비디오"],
      content: {
        id: "content-4",
        type: "video",
        data: {
          content: "다음 실험 영상을 보고 질문에 답하세요.",
          url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
          duration: 30,
        },
      },
      answerMeta: {
        kind: "subjective",
        charLimit: 300,
        lines: 4,
        placeholder: "실험 결과를 설명해주세요.",
      },
    },
    {
      id: "prob-5",
      style: "mixedFormat",
      title: "이미지 문제",
      tags: ["과학", "실험", "이미지"],
      content: {
        id: "content-5",
        type: "text",
        data: {
          content: "모두 선택하세요.",
        },
      },
      answerMeta: {
        kind: "objective",
        multiple: true,
        randomized: true,
      },
      options: [
        {
          id: "option-7",
          type: "image",
          data: {
            content: "포유류",
            url: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&h=300&fit=crop",
          },
        },
        {
          id: "option-8",
          type: "image",
          data: {
            content: "파충류",
            url: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&h=300&fit=crop",
          },
        },
        {
          id: "option-9",
          type: "image",
          data: {
            content: "조류",
            url: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&h=300&fit=crop",
          },
        },
      ],
    },
  ],
  tags: ["기초과학", "초등", "혼합유형"],
  createdAt: new Date("2025-09-19T14:12:00.000Z"),
  updatedAt: new Date("2025-09-19T14:12:15.000Z"),
};

export const mockProbBook2: ProbBook = {
  id: "2",
  ownerId: "100001",
  title: "수학 기초 문제집",
  description: "초등 수학 기초 개념 문제집입니다.",
  blocks: [
    {
      id: "prob-math-1",
      style: "generalFormat",
      title: "덧셈 계산",
      tags: ["수학", "덧셈", "초등"],
      content: {
        id: "content-math-1",
        type: "text",
        data: {
          content: "15 + 23 = ?",
        },
      },
      answerMeta: {
        kind: "objective",
        multiple: false,
      },
      options: [
        {
          id: "option-math-1",
          type: "text",
          data: { content: "38" },
        },
        {
          id: "option-math-2",
          type: "text",
          data: { content: "37" },
        },
        {
          id: "option-math-3",
          type: "text",
          data: { content: "39" },
        },
      ],
    },
  ],
  tags: ["수학", "초등", "기초"],
  createdAt: new Date("2025-09-20T10:30:00.000Z"),
  updatedAt: new Date("2025-09-20T10:30:00.000Z"),
};

export const mockProbBooks: ProbBook[] = [mockProbBook, mockProbBook2];
