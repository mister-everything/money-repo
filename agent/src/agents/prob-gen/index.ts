import { openai } from "@ai-sdk/openai";
import { createAgent } from "../create-agent";
import {
  analyzeFormStrategyTool,
  buildGenerationPromptTool,
  buildSearchProfileTool,
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

export const probGenAgent = createAgent({
  name: "문제집생성",
  model: openai("gpt-4o"), // 더 좋은 모델 사용
  systemPrompt: `
너는 다양한 퀴즈/문제집 콘텐츠 생성 전문 AI야.

교육용 문제집뿐만 아니라 재미있는 엔터테인먼트 콘텐츠도 만들 수 있어.

**사용 가능한 도구:**
- searchTags: 설명을 기반으로 정책에 맞는 태그(최대 10개, 8자 이내)를 추천
- searchTopic: 소재 대/중분류를 분류하고 자동 태그 후보를 생성
- searchAgeGroup: 타깃 연령대를 추정하고 콘텐츠 주의점을 제안
- searchDifficulty: 예상 정답률을 포함한 난이도를 추정
- searchSituation: 사용 맥락(친목/학습/팀빌딩/콘텐츠)을 분류하고 운영 팁 제공
- searchProblemType: 문제 유형별 추천 비중과 활용 아이디어를 제안
- buildSearchProfile: 위 분류 도구를 순차 호출하여 통합 검색 프로필을 생성
- analyzeFormStrategy: 폼 입력을 분석해서 형식/소재 비중, 난이도, 제약 조건 등을 설계
- buildGenerationPrompt: 전략을 기반으로 생성용 프롬프트와 체크리스트 작성
- generateProbDraft: 프롬프트로 문제집 초안을 생성
- evaluateProbDraft: 초안을 전략과 비교해 점수화하고 문제점/개선점을 도출
- refineProbDraft: 평가 결과를 반영해 초안을 다듬기
- finalizeProbBook: 최종 JSON을 규칙에 맞게 정리
- validateProbBook: 최종 JSON이 프로젝트 규칙을 준수하는지 검증
- generateProbBook: 모든 단계를 자동으로 실행하는 파이프라인

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
  tools: {
    searchTags: searchTagsTool,
    searchTopic: searchTopicTool,
    searchAgeGroup: searchAgeGroupTool,
    searchDifficulty: searchDifficultyTool,
    searchSituation: searchSituationTool,
    searchProblemType: searchProblemTypeTool,
    buildSearchProfile: buildSearchProfileTool,
    analyzeFormStrategy: analyzeFormStrategyTool,
    buildGenerationPrompt: buildGenerationPromptTool,
    generateProbDraft: generateProbDraftTool,
    evaluateProbDraft: evaluateProbDraftTool,
    refineProbDraft: refineProbDraftTool,
    finalizeProbBook: finalizeProbBookTool,
    generateProbBook: generateProbBookTool,
    validateProbBook: validateProbBookTool,
  },
  assistFirst: false,
  maxSteps: 15,
});
