import { openai } from "@ai-sdk/openai";
import { createAgent } from "../create-agent";
import {
  analyzeFormStrategyTool,
  buildGenerationPromptTool,
  evaluateProbDraftTool,
  finalizeProbBookTool,
  generateProbBookTool,
  generateProbDraftTool,
  refineProbDraftTool,
  searchAgeGroupTool,
  searchDifficultyTool,
  searchProblemTypeTool,
  searchSituationTool,
  searchTagsTool,
  searchTopicTool,
  validateProbBookTool,
} from "./tools";
import { flattenToolTree } from "@lib/utils";

export const probGenAgent = createAgent({
  name: "문제집생성",
  model: openai("gpt-4o"), // 더 좋은 모델 사용
  systemPrompt: `
너는 다양한 퀴즈/문제집 콘텐츠 생성 전문 AI야.

교육용 문제집뿐만 아니라 재미있는 엔터테인먼트 콘텐츠도 만들 수 있어.

**작업 순서 예시:**
1. analyzeFormStrategy로 폼 입력을 분석하고 전략 메모 확보
2. buildGenerationPrompt로 생성 프롬프트와 가이드 제작
3. generateProbDraft → evaluateProbDraft로 초안을 검사하고 필요하면 refineProbDraft 실행
4. finalizeProbBook으로 정리 후 validateProbBook으로 검증
5. generateProbBook은 위 과정을 자동으로 수행하는 단축 명령이야

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
  tools: flattenToolTree({
    // 분석 단계: 입력 폼을 해석하고 필요한 분류 정보를 수집
    analysis: {
      // 전략 메모 생성
      strategy: {
        analyzeFormStrategy: analyzeFormStrategyTool,
      },
      // 분류 도구 묶음 (태그/주제/상황/연령/난이도 등)
      classification: {
        searchTags: searchTagsTool,
        searchTopic: searchTopicTool,
        searchProblemType: searchProblemTypeTool,
        searchSituation: searchSituationTool,
        searchAgeGroup: searchAgeGroupTool,
        searchDifficulty: searchDifficultyTool,
      },
    },
    // 생성 프롬프트 패키지 작성
    prompt: {
      buildGenerationPrompt: buildGenerationPromptTool,
    },
    // 초안 생성 및 평가·개선 루프
    draft: {
      generateProbDraft: generateProbDraftTool,
      evaluateProbDraft: evaluateProbDraftTool,
      refineProbDraft: refineProbDraftTool,
    },
    // 최종 결과 정리 및 검증
    finalize: {
      finalizeProbBook: finalizeProbBookTool,
      validateProbBook: validateProbBookTool,
    },
    // 원샷 파이프라인
    pipeline: {
      generateProbBook: generateProbBookTool,
    },
  }),
  assistFirst: false,
  maxSteps: 3,
});
