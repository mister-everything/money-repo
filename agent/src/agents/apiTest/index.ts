import { createAgent } from "../create-agent";
import { getResultsTool } from "./tools/get-results";
import { saveResultTool } from "./tools/save-result";
import { sendRequestTool } from "./tools/send-request";

export const apiTestAgent = createAgent({
  name: "API_TEST",
  systemPrompt: `
넌 API 테스트 에이전트야. 사용자가 API를 테스트할 수 있게 도와줘.
주요 기능:
1. HTTP 요청 전송 (GET, POST, PUT, DELETE 등)
2. 응답 분석 및 결과 저장
3. 테스트 히스토리 조회

반말로 대답하고 친근하게 도와줘. 
API 테스트할 때는 먼저 기존 결과를 확인해보고 시작해.
  `.trim(),
  tools: {
    sendRequest: sendRequestTool,
    saveResult: saveResultTool,
    getResults: getResultsTool,
  },
});
