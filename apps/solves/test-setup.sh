#!/bin/bash

echo "🚀 문제집 API 테스트용 목업 데이터 추가 중..."

# 기초 과학 문제집
curl -X POST http://localhost:3000/api/prob \
  -H "Content-Type: application/json" \
  -d '{
    "id": "1",
    "ownerId": "100001",
    "title": "기초 과학 문제집",
    "description": "기초 과학에 대한 다양한 유형의 문제를 풀어보세요.",
    "blocks": [
      {
        "id": "prob-1",
        "style": "generalFormat",
        "title": "물의 상태 변화",
        "tags": ["과학", "화학", "초등"],
        "content": {
          "id": "content-1",
          "type": "text",
          "data": {
            "content": "물이 얼 때 나타나는 상태 변화를 고르세요."
          }
        },
        "answerMeta": {
          "kind": "objective",
          "multiple": false
        },
        "options": [
          {
            "id": "option-1",
            "type": "text",
            "data": { "content": "응고" }
          },
          {
            "id": "option-2",
            "type": "text",
            "data": { "content": "기화" }
          },
          {
            "id": "option-3",
            "type": "text",
            "data": { "content": "승화" }
          }
        ]
      },
      {
        "id": "prob-2",
        "style": "mixedFormat",
        "title": "동물 사진 분류",
        "tags": ["과학", "생물", "사진"],
        "content": {
          "id": "content-2",
          "type": "image",
          "data": {
            "content": "아래 사진의 동물은 어떤 분류에 속할까요?",
            "url": "https://example.com/image/lion.jpg"
          }
        },
        "answerMeta": {
          "kind": "subjective",
          "charLimit": 200,
          "lines": 3,
          "placeholder": "여기에 답을 작성하세요."
        },
        "options": [
          {
            "id": "option-4",
            "type": "text",
            "data": { "content": "포유류" }
          },
          {
            "id": "option-5",
            "type": "text",
            "data": { "content": "파충류" }
          },
          {
            "id": "option-6",
            "type": "text",
            "data": { "content": "조류" }
          }
        ]
      },
      {
        "id": "prob-3",
        "style": "generalFormat",
        "title": "증기기관의 원리",
        "tags": ["과학", "물리", "주관식"],
        "content": {
          "id": "content-3",
          "type": "text",
          "data": {
            "content": "증기기관이 작동하는 원리를 간략하게 설명하세요."
          }
        },
        "answerMeta": {
          "kind": "subjective",
          "charLimit": 200,
          "lines": 3,
          "placeholder": "여기에 답을 작성하세요."
        }
      }
    ],
    "tags": ["기초과학", "초등", "혼합유형"]
  }' > /dev/null

echo "✅ 기초 과학 문제집 생성 완료"

# 수학 문제집
curl -X POST http://localhost:3000/api/prob \
  -H "Content-Type: application/json" \
  -d '{
    "id": "2",
    "ownerId": "100002",
    "title": "초등 수학 연산",
    "description": "기본 사칙연산 문제들",
    "blocks": [
      {
        "id": "math-1",
        "style": "generalFormat",
        "title": "덧셈 계산",
        "tags": ["수학", "연산"],
        "content": {
          "id": "math-content-1",
          "type": "text",
          "data": {
            "content": "15 + 27 = ?"
          }
        },
        "answerMeta": {
          "kind": "objective",
          "multiple": false
        },
        "options": [
          {
            "id": "math-option-1",
            "type": "text",
            "data": { "content": "42" }
          },
          {
            "id": "math-option-2",
            "type": "text",
            "data": { "content": "32" }
          },
          {
            "id": "math-option-3",
            "type": "text",
            "data": { "content": "52" }
          }
        ]
      }
    ],
    "tags": ["수학", "초등", "연산"]
  }' > /dev/null

echo "✅ 수학 문제집 생성 완료"

echo ""
echo "🎯 테스트용 목업 데이터 추가 완료!"
echo ""
echo "📋 생성된 문제집 목록:"
curl -s http://localhost:3000/api/prob | jq '.data[] | {id: .id, title: .title, ownerId: .ownerId}'

echo ""
echo "🔧 API 테스트 명령어:"
echo "GET    전체 목록: curl http://localhost:3000/api/prob"
echo "GET    특정 조회: curl http://localhost:3000/api/prob/1"
echo "GET    사용자별:  curl 'http://localhost:3000/api/prob?ownerId=100001'"
echo "POST   새로 생성: curl -X POST http://localhost:3000/api/prob -H 'Content-Type: application/json' -d '{...}'"
echo "PUT    수정:      curl -X PUT http://localhost:3000/api/prob/1 -H 'Content-Type: application/json' -d '{...}'"
echo "DELETE 삭제:      curl -X DELETE http://localhost:3000/api/prob/1"
