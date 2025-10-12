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

### 2. 요구사항 입력 예시

#### 📚 교육용

```
중학교 1학년 수학 문제집 10개 만들어줘
```

```
고등학교 영어 단어 퀴즈 20문제, 쉬운 난이도로
```

```
초등학교 과학 OX 퀴즈 15개
```

#### 🎮 재미 콘텐츠

```
음식 이상형 월드컵 16강 만들어줘
```

```
넌센스 퀴즈 20개, 쉬운 난이도로
```

```
여행 vs 맛집 밸런스 게임 10개
```

```
2024 인기 드라마 순위 투표 만들어줘
```

### 3. 생성된 JSON 활용

1. Agent가 생성한 JSON 복사
2. 프론트엔드에서 미리보기
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

```
prob-gen/
├── index.ts              # Agent 정의
├── tools/
│   ├── generate-prob-book.ts  # 문제집 생성 도구
│   └── shared.ts              # 공통 타입
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
