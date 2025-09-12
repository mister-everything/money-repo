import { openai } from "@ai-sdk/openai";
import { truncateString } from "@workspace/util";
import { LanguageModel, ModelMessage, stepCountIs, streamText, Tool } from "ai";
import { colorize } from "consola/utils";
import inquirer from "inquirer";

type AgentOptions = {
  tools?: { [toolName: string]: Tool }; // 에이전트가 사용할 도구 목록
  systemPrompt?: string; // 에이전트 시스템프롬프트
  name: string; // 이름
  maxSteps?: number; // 맥스스텝 기본 10
  model?: LanguageModel; // 언어 모델 기본 openai 4.1 mini
};

export function createAgent(options: AgentOptions) {
  const model = options.model ?? openai("gpt-4.1-mini");
  const maxSteps = options.maxSteps ?? 10;

  const messages: ModelMessage[] = [];

  const startChat = async () => {
    const answer = await inquirer.prompt([
      {
        message: "USER: ",
        name: "user_message",
        type: "input",
      },
    ]);

    messages.push({
      role: "user",
      content: answer.user_message,
    });

    const result = streamText({
      model,
      stopWhen: stepCountIs(maxSteps),
      system: options.systemPrompt,
      messages,
      tools: options.tools,
    });

    for await (const part of result.fullStream) {
      switch (part.type) {
        case "text-start":
          // 텍스트 응답 시작
          console.log("\n");
          process.stdout.write(colorize("cyan", `💀${options.name}: `));
          break;

        case "text-delta":
          // 실시간 텍스트 스트리밍
          process.stdout.write(colorize("white", part.text));
          break;

        case "text-end":
          // 텍스트 응답 완료
          console.log(""); // 줄바꿈
          break;

        case "tool-input-start":
          // 도구 호출 input 생성 시작
          console.log(
            `\n${colorize("yellow", `🔧 ${part.toolName} 호출 중...`)}`,
          );
          break;
        case "tool-call":
          // 도구 입력 input 생성 완료
          console.log(`\n${JSON.stringify(part.input, null, 2)}`);
          break;
        case "tool-result":
          // 도구 실행 결과
          console.log(colorize("blue", `✅ ${part.toolName} 결과:`));
          console.log(
            `\n${truncateString(JSON.stringify(part.output, null, 2), 300)}`,
          );
          break;

        case "tool-error":
          // 도구 실행 오류
          console.log(colorize("red", `❌ ${part.toolName} 오류:`));
          console.error(part.error);
          break;
      }
    }

    const assistantMessages = await result.response.then((res) => res.messages);

    messages.push(...assistantMessages);
    console.log("\n");
    startChat();
  };

  return {
    runChat: startChat,
    name: options.name,
  };
}
