import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const openai = createOpenAI({
  apiKey:
    "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",
});

const model = openai("gpt-4.1-mini");

const SYSTEM_PROMPT = `
너는 TODO 에이전트야. 

너는 우리팀의 todo 를 관리하는 에이전트야.

최초 대회시 todo 목록을 조회해

`;

const main = async () => {
  const result = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: "안녕",
  });

  console.log(result.text);
};

main();
