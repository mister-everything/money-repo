import { createOpenAI } from "@ai-sdk/openai";
import { generateText, ModelMessage, stepCountIs } from "ai";
import inquirer from "inquirer";
import { doneTodoTool } from "./tools/done-todo.tool";
import { getTodoTool } from "./tools/get-todo.tool";
import { insertTodoTool } from "./tools/insert-todo.tool";

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

const DB_MESSAGE_TABLE: ModelMessage[] = [];

const main = async () => {
  const answer = await inquirer.prompt([
    {
      type: "input",
      name: "prompt",
      message: "",
    },
  ]);

  DB_MESSAGE_TABLE.push({
    role: "user",
    content: answer.prompt,
  });

  const result = await generateText({
    model,
    system: SYSTEM_PROMPT,
    tools: {
      getTodo: getTodoTool,
      insertTodo: insertTodoTool,
      doneTodo: doneTodoTool,
    },
    messages: DB_MESSAGE_TABLE,
    stopWhen: stepCountIs(10),
  });
  DB_MESSAGE_TABLE.push(...result.response.messages);

  console.dir(result.response.messages, { depth: null });

  main();
};

main();
