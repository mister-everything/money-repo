# 문제집 생성 Agent 예시 모음

## 🎮 재미 콘텐츠

### 음식 이상형 월드컵

```json
{
  "title": "음식 이상형 월드컵",
  "description": "다양한 음식들 중에서 최고의 음식을 골라보세요!",
  "ownerId": "USER_ID_PLACEHOLDER",
  "blocks": [
    {
      "type": "mcq",
      "question": "이제 시작합니다! 다음 중 선택하세요.",
      "content": {
        "type": "mcq",
        "question": "떡볶이 vs 불고기",
        "options": [
          { "type": "text", "text": "떡볶이" },
          { "type": "text", "text": "불고기" }
        ]
      }
    }
  ],
  "tags": ["음식", "이상형 월드컵", "재미", "선호도조사"],
  "isPublic": true
}
```

### 넌센스 퀴즈

- 주관식(default) 또는 객관식(mcq)로 구성
- 재미있고 창의적인 문제
- 정답 포함

### 밸런스 게임

- OX(ox) 타입으로 양자택일
- "A vs B" 형식
- 정답 불필요

## 📚 교육용 콘텐츠

### 중학교 1학년 수학

```json
{
  "title": "중학교 1학년 수학 문제집",
  "blocks": [
    {
      "type": "default",
      "question": "3x + 5 = 11일 때, x의 값을 구하시오.",
      "content": {
        "type": "default",
        "question": "3x + 5 = 11일 때, x의 값을 구하시오."
      },
      "answer": { "type": "default", "answer": ["2"] }
    },
    {
      "type": "mcq",
      "question": "다음 중 소수가 아닌 것은?",
      "content": {
        "type": "mcq",
        "question": "다음 중 소수가 아닌 것은?",
        "options": [
          { "type": "text", "text": "3" },
          { "type": "text", "text": "9" }
        ]
      },
      "answer": { "type": "mcq", "answer": [1] }
    }
  ],
  "tags": ["수학", "중1", "기초"]
}
```

## 🎯 투표/설문

### 드라마 순위 투표

- ranking 타입
- 선호도 순서 맞추기
- 정답 불필요 또는 인기 순위

### 찬반 투표

- OX 타입
- 찬성/반대 의견
- 정답 불필요

## 💡 창의적 활용

AI는 주제를 자유롭게 해석해서 최적의 문제 타입을 선택합니다:

- 이상형 월드컵 → mcq로 대결 구조
- 교육 문제 → default, mcq, ox 섞어서 구성
- 순위 투표 → ranking 타입
- 매칭 게임 → matching 타입

**핵심**: 한정적인 규칙 없이 AI가 주제에 맞게 자유롭게 구성합니다!
