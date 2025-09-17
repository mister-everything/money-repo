import { createAgent } from "../create-agent";
import { addTodoTool } from "./tools/add-todo";
import { doneTodoTool } from "./tools/done-todo";
import { getTodoListTool } from "./tools/get-todo";

export const todoAgent = createAgent({
  name: "TODO",
  systemPrompt: `
  넌 TODO 에이전트야. 최초 대화를 시작할 때 TODO 항목을 조회를 먼저해. 
  사용자의 TODO를 관리해 주면 돼. 반말로 대답하고 주인님 이라고 불러.
  `.trim(),
  tools: {
    getTodoList: getTodoListTool,
    addTodo: addTodoTool,
    doneTodo: doneTodoTool,
  },
  assistFirst: true,
});
