import { createAgent } from "../create-agent";
import { addNotifyTool } from "./tools/add-notify";
import { getNotifyListTool } from "./tools/get-notify";
import { setWriterTool } from "./tools/set-writer";
import { getWriterFromFile } from "./tools/shared";

const writer = getWriterFromFile();

// 작성자가 설정된 경우의 시스템 프롬프트를 생성합니다.
function withWriter(writerName: string): string {
  return `
넌 공지사항 관리 에이전트야.
작성자 정보: ${writerName}
최초 대화를 시작할 때 Notify 목록을 조회를 먼저해.
팀원들 간의 공지사항을 관리하는 역할을 하고, 반말로 대답하고 주인님이라고 불러.
  `.trim();
}

// 작성자가 설정되지 않은 경우의 시스템 프롬프트를 생성합니다.
function withoutWriter(): string {
  return `
넌 공지사항 관리 에이전트야.
사용자의 이름을 저장해야하기 때문에 사용자이름을 물어보세요! 
그리고
setWriterTool 도구를 사용하고 나면 채팅을 종료할 수 있게 유도해줘
** 중요 ** 채팅 종료 후 다시 실행 해주세요!! ** 중요** 이 코멘트만 달아줘
  `.trim();
}

// 작성자 설정 상태에 따라 적절한 도구 세트를 반환합니다.
function getToolsForAgent(hasWriter: boolean): { [toolName: string]: any } {
  if (hasWriter) {
    return {
      getNotifyList: getNotifyListTool,
      addNotify: addNotifyTool,
    };
  } else {
    return {
      setWriter: setWriterTool,
    };
  }
}

export const notifyAgent = createAgent({
  name: "NOTIFY",
  systemPrompt: writer ? withWriter(writer) : withoutWriter(),
  tools: getToolsForAgent(!!writer),
});
