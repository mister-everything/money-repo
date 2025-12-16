import { chatService } from "@service/solves";
import { parseAnswer, parseContent } from "@service/solves/shared";
import { streamText } from "ai";
import { NextRequest } from "next/server";
import { getChatModel } from "@/lib/ai/model";
import { nextFail } from "@/lib/protocol/next-route-helper";
import { ExplainSolutionRequest } from "../types";

function makeExplainPrompt(param: {
  question: string;
  type: string;
  content: any;
  answer: any;
}) {
  const header =
    `아래 문제의 해설만 작성해줘.\n` +
    `- 핵심 이유/근거 중심으로 설명해.\n` +
    `- 3줄 이내로 작성해.\n` +
    `- 정답/보기를 그대로 재출력하지 말고, 왜 그렇게 되는지 설명해.\n\n` +
    `[입력 설명]\n` +
    `- type: 문제 유형. default=주관식, mcq=객관식(단일), mcq-multiple=객관식(다중), ranking=순서맞추기, ox=OX.\n` +
    `- content: 보기/항목 등 문제의 부가 데이터(유형별로 구조가 다름).\n` +
    `- answer: 정답 데이터(유형별로 구조가 다름).\n`;

  return (
    `${header}\n` +
    `[type]\n${param.type}\n\n` +
    `[문제]\n${param.question}\n\n` +
    `[content]\n${JSON.stringify(param.content ?? null)}\n\n` +
    `[answer]\n${JSON.stringify(param.answer ?? null)}\n`
  );
}

export async function POST(request: NextRequest) {
  const { block, options } = await request
    .json()
    .then(ExplainSolutionRequest.parse);

  // Block 검증
  const parsedContent = parseContent(block.content);
  const parsedAnswer = parseAnswer(block.answer);
  if (!parsedContent.success || !parsedAnswer.success) {
    return nextFail("블록 형식이 올바르지 않습니다.");
  }

  const prompt = makeExplainPrompt({
    question: block.question,
    type: block.type,
    content: block.content,
    answer: block.answer,
  });

  let systemPrompt: string | null = null;
  // 시스템 프롬프트가 있으면 조회
  if (options.systemPrompt) {
    systemPrompt = await chatService.getSystemPrompt(options.systemPrompt);
  }

  const result = streamText({
    model: getChatModel(options.model),
    prompt,
    system: systemPrompt ?? undefined,
    tools: options.tools ?? {},
  });
  return result.toTextStreamResponse();
}
