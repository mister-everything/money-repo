import "@workspace/env";
import inquirer from "inquirer";
import { apiTestAgent } from "./agents/apiTest";
import { todoAgent } from "./agents/todo";

const agents = [todoAgent, apiTestAgent];

const result = await inquirer.prompt([
  {
    type: "select",
    name: "agent",
    choices: agents.map((v, i) => ({
      name: v.name,
      value: v,
    })),
    message: "에이전트를 선택하세요. ",
  },
]);

const agent = result.agent;

agent.runChat();
