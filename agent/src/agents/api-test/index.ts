import { createAgent } from "../create-agent";
import { getResultsTool } from "./tools/get-results";
import { saveResultTool } from "./tools/save-result";
import { sendRequestTool } from "./tools/send-request";

/**
 * @description API 테스트 에이전트
 * HTTP API 요청을 테스트하고 결과를 관리하는 에이전트입니다.
 *
 * @tools
 * - sendRequest: HTTP 요청을 전송합니다 (GET, POST, PUT, DELETE 등)
 * - saveResult: API 테스트 결과를 저장합니다 (node_modules/@solves-agent/api-test-results.json)
 * - getResults: 저장된 테스트 히스토리를 조회합니다 (node_modules/@solves-agent/api-test-results.json)
 */
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
