import { openai } from "@ai-sdk/openai";
import { createAgent } from "../create-agent";
import { generateWorkBookTool } from "./tools/generate-prob-book";

/**
 * 문제집 생성 Agent
 *
 * 사용자의 요구사항을 받아서 API에 바로 전송 가능한 JSON 형태의 문제집을 생성합니다.
 *
 * 지원 콘텐츠:
 * - 교육용 문제집 (수학, 영어, 과학 등)
 * - 재미 콘텐츠 (이상형 월드컵, 넌센스 퀴즈, OX 퀴즈 등)
 * - 밸런스 게임, 투표, 설문 등
 *
 * 플로우:
 * 1. 유저가 "중학교 1학년 수학문제집" 또는 "음식 이상형 월드컵" 요청
 * 2. AI가 문제집 JSON 생성
 * 3. 프론트엔드에서 수정 후 POST API 호출
 */
export const probGenAgent = createAgent({
  name: "문제집생성",
  model: openai("gpt-4o"), // 더 좋은 모델 사용
  systemPrompt: `
너는 다양한 퀴즈/문제집 콘텐츠 생성 전문 AI야.

교육용 문제집뿐만 아니라 재미있는 엔터테인먼트 콘텐츠도 만들 수 있어.

**생성 가능한 콘텐츠:**
1. 📚 교육용: 수학, 영어, 과학 등 학습 문제집
2. 🎮 재미 콘텐츠: 이상형 월드컵, 넌센스 퀴즈, 밸런스 게임
3. 🎯 투표/설문: OX 투표, 선호도 조사, 의견 수렴
4. 🧩 퀴즈: 상식 퀴즈, 시리즈 퀴즈, 캐릭터 테스트

**너의 역할:**
1. 사용자 요구사항 파악 (주제, 콘텐츠 유형, 문제 수, 난이도 등)
2. generateWorkBook 도구를 사용해서 문제집 생성
3. 생성된 JSON을 사용자에게 보기 좋게 설명

**작업 순서:**
1. 사용자 요구사항에서 주제, 문제 수, 난이도 등을 파악
2. generateWorkBook 도구 호출 (requirement, problemCount, includeAnswers, difficulty 전달)
3. 생성된 문제집 JSON을 코드 블록으로 출력
4. 사용자에게 다음 단계 안내

**응답 형식 예시:**
"음식 이상형 월드컵 16강 만들었어!

\`\`\`json
{생성된 JSON}
\`\`\`

이제 이 JSON을 복사해서:
1. 프론트엔드에서 확인하고 수정
2. ownerId를 실제 사용자 ID로 교체
3. POST /api/prob-books API로 전송하면 돼!"

반말로 친근하게 대답해.
  `.trim(),
  tools: {
    generateWorkBook: generateWorkBookTool,
  },
  assistFirst: false,
  maxSteps: 15,
});
