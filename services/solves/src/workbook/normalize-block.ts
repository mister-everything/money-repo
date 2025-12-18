import { arrayToObject, exclude, truncateString } from "@workspace/util";
import {
  BlockAnswer,
  BlockContent,
  McqBlockContent,
  McqMultipleBlockContent,
  RankingBlockContent,
} from "./blocks";
import { WorkBookBlock } from "./types";

// block to string
// 아마 대부분 ai prompt 에 block 내용을 전달하기 위한 목적으로 사용 예정

export function noralizeSummaryBlock(block: WorkBookBlock): string {
  const { question, order, type } = block;
  return JSON.stringify({
    ref: "summary",
    type,
    order,
    question: truncateString(question.trim(), 30),
  });
}

export function normalizeDetailBlock(block: WorkBookBlock): string {
  const { id, question, order, content, answer, type, ...rest } = block;

  const data = {
    ref: "detail",
    id,
    type,
    order,
    question: question.trim(),
    content: normalizeContent(content),
    correctAnswer: normalizeAnswer({
      answer,
      content,
    }),
    solution: answer.solution?.trim(),
    ...rest,
  };

  return JSON.stringify(data);
}

function normalizeContent(content: BlockContent) {
  const noOption = "보기를 작성하지 않음";
  switch (content.type) {
    case "default":
      return undefined;
    case "ox":
      return undefined;
    case "ranking":
      return content.items.length
        ? content.items.map((v) => (v.type == "text" ? v.text : v.url))
        : noOption;
    case "mcq":
    case "mcq-multiple":
      return content.options.length
        ? content.options.map((v) => (v.type == "text" ? v.text : v.url))
        : noOption;
  }
  return exclude(content, ["type"]);
}

function normalizeAnswer({
  answer,
  content,
}: {
  content: BlockContent;
  answer?: BlockAnswer;
}) {
  const noAnswer = "정답을 작성하지 않음.";

  if (!answer?.type) return "정답을 작성하지 않음.";
  switch (answer?.type) {
    case "default":
      return answer.answer?.length ? answer.answer : noAnswer;
    case "ox":
      return answer.answer ? "o" : "x";
    case "ranking": {
      const { items } = content as RankingBlockContent;
      const itemById = arrayToObject(items, (v) => v.id);
      const result = answer.order
        .map((v) => {
          const item = itemById[v];
          if (!item) return undefined;
          return item.type == "text" ? item.text : item.url;
        })
        .filter(Boolean);
      return result.length ? result : noAnswer;
    }
    case "mcq": {
      const { options } = content as McqBlockContent;
      if (!options?.length) return noAnswer;
      const item = (content as McqBlockContent).options.find(
        (v) => v.id == answer?.answer,
      );
      if (!item) return noAnswer;
      return item.type == "text" ? item.text : item.url;
    }

    case "mcq-multiple": {
      const { options } = content as McqMultipleBlockContent;
      if (!options?.length) return noAnswer;
      if (!answer.answer?.length) return noAnswer;
      const itemById = arrayToObject(options, (v) => v.id);
      return answer.answer
        .map((v) => {
          const item = itemById[v];
          if (!item) return;
          return item.type == "text" ? item.text : item.url;
        })
        .filter(Boolean);
    }
  }
  return exclude(answer, ["type", "solution"]);
}
