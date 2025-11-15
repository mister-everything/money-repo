# 문제집/퀴즈 생성 Agent

사용자의 요구사항에 따라 다양한 퀴즈/문제집 콘텐츠를 JSON 형태로 자동 생성하는 AI Agent입니다.

## 특징

- 🤖 **AI 기반 콘텐츠 생성**: GPT-4o를 사용해 교육용부터 재미 콘텐츠까지 자동 생성
- 📚 **다양한 콘텐츠 타입**: 교육용 문제집, 이상형 월드컵, 넌센스 퀴즈, 밸런스 게임 등
- 🎮 **5가지 문제 타입 지원**: 주관식, 객관식, OX, 순위 맞추기, 매칭 퀴즈
- 🎯 **난이도/복잡도 조절**: easy, medium, hard 중 선택 가능
- 📋 **API 호환 JSON**: 생성된 JSON을 바로 POST API로 전송 가능

## 지원하는 콘텐츠 유형

### 📚 교육용

- 수학, 영어, 과학 등 학습 문제집
- 교과 과정 문제
- 자격증/시험 대비 문제

### 🎮 재미 콘텐츠

- 이상형 월드컵 (음식, 여행지, 캐릭터 등)
- 넌센스 퀴즈
- 밸런스 게임
- 상식 퀴즈

### 🎯 투표/설문

- OX 투표
- 선호도 순위 조사
- 찬반 의견 수렴

## 사용 방법

### 1. Agent 실행

```bash
pnpm agent
# 목록에서 "문제집생성" 선택
```

### 2. 기본 흐름 (자동 파이프라인)

1. 프론트에서 수집한 폼 데이터를 입력하면 `generateProbBook` 파이프라인이 전체 과정을 자동 실행
2. 결과로 문제집 JSON, 품질 평가 로그, 전략 메타데이터가 함께 제공
3. JSON을 검토 후 필요하면 수정해 API로 전송

### 3. 커스텀 제어 (단계별 도구 호출)

| 단계          | 도구                    | 역할                                                           |
| ------------- | ----------------------- | -------------------------------------------------------------- |
| 검색 분류     | `searchTags`            | 태그 정책(8자, 10개 이하)에 맞는 태그 추천                     |
|               | `searchTopic`           | 소재 대/중분류 분류 + 자동 태그 제안                           |
|               | `searchAgeGroup`        | 타깃 연령대 추정 및 콘텐츠 주의 포인트 제공                    |
|               | `searchDifficulty`      | 예상 정답률 기반 난이도 추정                                   |
|               | `searchSituation`       | 사용 맥락(친목/학습/팀빌딩/콘텐츠) 분류 및 운영 팁 제공        |
|               | `searchProblemType`     | 문제 유형별 추천 비중 및 활용 아이디어 제안                    |
|               | `buildSearchProfile`    | 위 분류 도구를 순차 호출해 통합 검색 프로필 생성               |
| 전략 설계     | `analyzeFormStrategy`   | 폼 입력을 구조화된 전략(형식/소재 비중, 난이도, 제약)으로 변환 |
| 프롬프트 작성 | `buildGenerationPrompt` | 전략을 기반으로 생성 프롬프트/체크리스트 생성                  |
| 초안 생성     | `generateProbDraft`     | 프롬프트로 문제집 초안 JSON 생성                               |
| 품질 평가     | `evaluateProbDraft`     | 초안을 전략과 비교하여 점수/이슈/제안 도출                     |
| 개선 반복     | `refineProbDraft`       | 평가 결과를 기반으로 초안을 보정                               |
| 최종 정리     | `finalizeProbBook`      | 누락 필드/순서/태그 정리, 기본값 보완                          |
| 검증          | `validateProbBook`      | 규칙(문항 수, 정답 정책, 태그 등) 최종 검증                    |

⏩ `generateProbBook`은 위 단계 전체를 1회 호출로 수행하는 단축 명령어다.

### 4. 문제 검색 정책 기반 도구 활용

```ts
const profile = await buildSearchProfile.tool({
  description: "중학교 2학년 과학 실험을 주제로 팀빌딩 워크숍에서 사용할 퀴즈",
  platform: "하이브리드",
  audience: "중학교 과학 동아리 20명",
  desiredOutcome: "팀워크 강화와 실험 개념 복습",
});

console.log(profile.tags.tags); // [{ tag: "과학", ... }, ...]
console.log(profile.topic.mainCategory); // "학교 교과목"
console.log(profile.problemTypes.recommendations); // 유형별 비중과 팁
```

각 분류 도구는 개별 호출도 가능하며, `buildSearchProfile`은 정책 테이블에 맞춰 일괄 분류 결과를 제공한다. 이후 `analyzeFormStrategy`나 문제 생성 파이프라인에서 그대로 활용할 수 있다.

### 4. 전략 입력 예시

폼 데이터 예:

```json
{
  "people": "3인 이상",
  "situation": "친목",
  "format": ["객관식", "OX 게임"],
  "platform": "하이브리드",
  "ageGroup": "성인",
  "topic": ["일반상식", "밈/트렌드"],
  "difficulty": "보통",
  "description": "회식 자리에서 팀원들이 웃으면서 풀 수 있게"
}
```

`analyzeFormStrategy` 출력 요약 예:

- 형식 계획: 객관식 6문항, OX 4문항
- 소재 계획: 일반상식 50%, 밈/트렌드 50%
- 난이도: medium
- 제약: 회식 분위기, 토론 유발형, 정답 포함

### 5. 생성된 JSON 활용

1. Agent가 출력한 JSON을 복사
2. 프론트에서 미리보기
3. 필요시 문제 수정/추가/삭제
4. `ownerId`를 실제 사용자 ID로 교체
5. `POST /api/prob-books` API로 전송

## 지원하는 문제 타입

### 1. 주관식 (default)

```json
{
  "type": "default",
  "content": { "type": "default", "question": "2 + 2 = ?" },
  "answer": { "type": "default", "answer": ["4"] }
}
```

### 2. 객관식 (mcq)

```json
{
  "type": "mcq",
  "content": {
    "type": "mcq",
    "question": "대한민국의 수도는?",
    "options": [
      { "type": "text", "text": "서울" },
      { "type": "text", "text": "부산" }
    ]
  },
  "answer": { "type": "mcq", "answer": [0] }
}
```

### 3. OX 퀴즈 (ox)

```json
{
  "type": "ox",
  "content": {
    "type": "ox",
    "question": "지구는 태양 주위를 돈다",
    "oOption": { "type": "text", "text": "맞다" },
    "xOption": { "type": "text", "text": "틀리다" }
  },
  "answer": { "type": "ox", "answer": "o" }
}
```

### 4. 순위 맞추기 (ranking)

```json
{
  "type": "ranking",
  "content": {
    "type": "ranking",
    "question": "다음을 연대순으로 정렬하세요",
    "items": [
      { "id": "1", "type": "text", "label": "조선 건국" },
      { "id": "2", "type": "text", "label": "고려 건국" }
    ]
  },
  "answer": { "type": "ranking", "order": ["2", "1"] }
}
```

### 5. 매칭 퀴즈 (matching)

```json
{
  "type": "matching",
  "content": {
    "type": "matching",
    "question": "용어와 정의를 연결하세요",
    "leftItems": [{ "id": "l1", "content": "광합성" }],
    "rightItems": [{ "id": "r1", "content": "빛을 이용한 에너지 생성" }]
  },
  "answer": {
    "type": "matching",
    "pairs": [{ "leftId": "l1", "rightId": "r1" }]
  }
}
```

## 환경 변수

`.env` 파일에 OpenAI API 키 필요:

```env
OPENAI_API_KEY=sk-...
```

## 개발

### 테스트 실행

```bash
cd agent
pnpm test -- prob-gen
```

### 구조

```text
prob-gen/
├── index.ts              # Agent 정의
├── tools/
│   ├── analyze-form-strategy.ts    # 폼 → 전략 변환
│   ├── build-generation-prompt.ts  # 전략 → 프롬프트 패키지
│   ├── generate-prob-draft.ts      # 프롬프트 → 초안 생성
│   ├── evaluate-prob-draft.ts      # 초안 품질 평가
│   ├── refine-prob-draft.ts        # 평가 기반 개선
│   ├── sanitize-prob-book.ts       # 최종 정리/보정
│   ├── validate-prob-book.ts       # 규칙 검증
│   ├── generate-prob-book.ts       # 전체 파이프라인 오케스트레이션
│   └── shared-schemas.ts           # 공통 스키마/타입
└── README.md
```

## 콘텐츠별 활용 예시

### 이상형 월드컵

- mcq 타입으로 2개 선택지 대결
- 16강 = 16개 문제
- 정답 불필요 (includeAnswers: false)
- 예: "음식 이상형 월드컵", "여행지 이상형 월드컵"

### 밸런스 게임

- ox 타입으로 양자택일 질문
- "A vs B" 형식
- 정답 불필요
- 예: "여행 vs 맛집", "돈 vs 시간"

### 넌센스 퀴즈

- default 또는 mcq 타입
- 재미있고 참신한 문제
- 정답 포함
- 예: "왕이 넘어지면?", "엄마가 좋아? 아빠가 좋아?"

### 순위 투표

- ranking 타입
- 선호도 순서 맞추기
- 정답 불필요 또는 인기 순위
- 예: "2024 인기 드라마 순위", "좋아하는 과일 순위"

## 향후 개선 사항

- [ ] 이미지/동영상 기반 문제 지원 (이상형 월드컵 이미지 등)
- [ ] 특정 교육 과정 기준 문제 생성 (예: 2022 개정 교육과정)
- [ ] 기존 문제집 수정/확장 기능
- [ ] 문제 난이도 자동 평가
- [ ] 다국어 문제 생성 지원
- [ ] MBTI 테스트, 캐릭터 테스트 등 성격 분석 콘텐츠
