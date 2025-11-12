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
        // 사용자 폼 입력을 분석하여 문제집 생성 전략과 메모를 도출
        analyzeFormStrategy: analyzeFormStrategyTool,
      },
      // 분류 도구 묶음 (태그/주제/상황/연령/난이도 등)
      classification: {
        // 문제집에 적합한 태그를 검색 (예: #기술면접, #코딩테스트)
        searchTags: searchTagsTool,
        // 문제집 주제를 검색 (예: 프로그래밍, 역사, 음식)
        searchTopic: searchTopicTool,
        // 문제 유형을 검색 (예: 객관식, OX퀴즈, 이상형월드컵)
        searchProblemType: searchProblemTypeTool,
        // 문제집 적용 상황을 검색 (예: 면접준비, 시험대비, 친구들과게임)
        searchSituation: searchSituationTool,
        // 대상 연령대를 검색 (예: 초등생, 중학생, 성인)
        searchAgeGroup: searchAgeGroupTool,
        // 문제 난이도를 검색 (예: 쉬움, 보통, 어려움)
        searchDifficulty: searchDifficultyTool,
      },
    },
    // 생성 프롬프트 패키지 작성
    prompt: {
      // 분석된 정보를 바탕으로 AI 생성용 프롬프트와 가이드를 구성
      buildGenerationPrompt: buildGenerationPromptTool,
    },
    // 초안 생성 및 평가·개선 루프
    draft: {
      // 프롬프트를 기반으로 문제집 초안을 생성
      generateProbDraft: generateProbDraftTool,
      // 생성된 초안의 품질, 형식, 내용을 평가
      evaluateProbDraft: evaluateProbDraftTool,
      // 평가 결과를 반영하여 초안을 개선하고 수정
      refineProbDraft: refineProbDraftTool,
    },
    // 최종 결과 정리 및 검증
    finalize: {
      // 완성된 문제집을 JSON 형식으로 최종 정리
      finalizeProbBook: finalizeProbBookTool,
      // 최종 JSON이 스키마 및 비즈니스 규칙을 만족하는지 검증
      validateProbBook: validateProbBookTool,
    },
    // 원샷 파이프라인
    pipeline: {
      // 위 모든 과정(분석→프롬프트→초안→평가→정리→검증)을 자동으로 수행하는 통합 명령
      generateProbBook: generateProbBookTool,
    },
  }),
  assistFirst: false,
  maxSteps: 3,
});
