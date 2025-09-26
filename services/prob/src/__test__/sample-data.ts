import "@workspace/env";
import { probService } from "../prob.service";
import { ProbBookSaveInput } from "../types";

async function createSampleData() {
  console.log("📝 샘플 데이터 생성 시작...");

  // 샘플 문제집 1: 수학 기초
  const mathBasics: ProbBookSaveInput = {
    ownerId: "teacher-kim",
    title: "초등 수학 기초 문제집",
    description: "초등학교 1-2학년을 위한 기초 수학 문제 모음",
    tags: ["수학", "초등", "기초"],
    blocks: [
      {
        id: `math-basic-1-${Date.now()}`,
        style: "generalFormat",
        title: "덧셈 기초 (1)",
        content: {
          id: `content-${Date.now()}-1`,
          type: "text",
          data: {
            content: "다음 중 2 + 3의 답으로 올바른 것을 고르세요.",
          },
        },
        answerMeta: {
          kind: "objective",
          multiple: false,
          randomized: false,
        },
        options: [
          {
            id: `option-${Date.now()}-1`,
            type: "text",
            data: { content: "4" },
          },
          {
            id: `option-${Date.now()}-2`,
            type: "text",
            data: { content: "5" },
          },
          {
            id: `option-${Date.now()}-3`,
            type: "text",
            data: { content: "6" },
          },
          {
            id: `option-${Date.now()}-4`,
            type: "text",
            data: { content: "7" },
          },
        ],
        tags: ["덧셈", "기초연산"],
      },
      {
        id: `math-basic-2-${Date.now()}`,
        style: "generalFormat",
        title: "뺄셈 기초 (1)",
        content: {
          id: `content-${Date.now()}-2`,
          type: "text",
          data: {
            content: "다음 식의 답을 구하세요: 10 - 4 = ?",
          },
        },
        answerMeta: {
          kind: "subjective",
          charLimit: 2,
          lines: 1,
          placeholder: "숫자만 입력하세요",
        },
        tags: ["뺄셈", "주관식"],
      },
    ],
  };

  // 샘플 문제집 2: 국어 읽기
  const koreanReading: ProbBookSaveInput = {
    ownerId: "teacher-park",
    title: "국어 읽기 이해 문제집",
    description: "초등학교 국어 읽기 이해력 향상을 위한 문제집",
    tags: ["국어", "읽기", "이해"],
    blocks: [
      {
        id: `korean-1-${Date.now()}`,
        style: "generalFormat",
        title: "글의 내용 이해",
        content: {
          id: `content-${Date.now()}-3`,
          type: "text",
          data: {
            content: `다음 글을 읽고 물음에 답하세요.

"어린 토끼가 숲에서 길을 잃었습니다. 해가 저물어 어둠이 내렸고, 토끼는 무서워서 울기 시작했습니다. 그때 친절한 부엉이가 나타나 토끼를 집까지 안전하게 데려다 주었습니다."

토끼를 도와준 동물은 무엇인가요?`,
          },
        },
        answerMeta: {
          kind: "objective",
          multiple: false,
          randomized: true,
        },
        options: [
          {
            id: `option-${Date.now()}-5`,
            type: "text",
            data: { content: "부엉이" },
          },
          {
            id: `option-${Date.now()}-6`,
            type: "text",
            data: { content: "여우" },
          },
          {
            id: `option-${Date.now()}-7`,
            type: "text",
            data: { content: "곰" },
          },
        ],
        tags: ["읽기이해", "문학"],
      },
    ],
  };

  // 샘플 문제집 3: 과학 탐구
  const scienceExploration: ProbBookSaveInput = {
    ownerId: "teacher-lee",
    title: "초등 과학 탐구 문제집",
    description: "과학적 사고력과 관찰력을 기르는 문제집",
    tags: ["과학", "탐구", "실험"],
    blocks: [
      {
        id: `science-1-${Date.now()}`,
        style: "mixedFormat",
        title: "물의 상태 변화",
        content: {
          id: `content-${Date.now()}-4`,
          type: "mixed",
          data: [
            {
              content: "물이 얼음이 되는 과정을 관찰해보세요.",
            },
            {
              content: "실험: 물을 냉동고에 넣고 1시간 후 상태를 확인합니다.",
            },
          ],
        },
        answerMeta: {
          kind: "subjective",
          charLimit: 100,
          lines: 3,
          placeholder: "관찰한 내용을 자세히 써보세요",
        },
        tags: ["물질", "상태변화", "관찰"],
      },
      {
        id: `science-2-${Date.now()}`,
        style: "generalFormat",
        title: "식물의 성장 조건",
        content: {
          id: `content-${Date.now()}-5`,
          type: "text",
          data: {
            content:
              "식물이 자라기 위해 필요한 것들을 모두 고르세요. (복수선택 가능)",
          },
        },
        answerMeta: {
          kind: "objective",
          multiple: true,
          randomized: false,
        },
        options: [
          {
            id: `option-${Date.now()}-8`,
            type: "text",
            data: { content: "햇빛" },
          },
          {
            id: `option-${Date.now()}-9`,
            type: "text",
            data: { content: "물" },
          },
          {
            id: `option-${Date.now()}-10`,
            type: "text",
            data: { content: "공기" },
          },
          {
            id: `option-${Date.now()}-11`,
            type: "text",
            data: { content: "음악" },
          },
        ],
        tags: ["식물", "성장조건", "복수선택"],
      },
    ],
  };

  try {
    console.log("💾 수학 기초 문제집 저장...");
    const savedMath = await probService.save(mathBasics);
    console.log(
      `✅ 저장 완료: ${savedMath.title} (문제 ${savedMath.blocks.length}개)`,
    );

    console.log("💾 국어 읽기 문제집 저장...");
    const savedKorean = await probService.save(koreanReading);
    console.log(
      `✅ 저장 완료: ${savedKorean.title} (문제 ${savedKorean.blocks.length}개)`,
    );

    console.log("💾 과학 탐구 문제집 저장...");
    const savedScience = await probService.save(scienceExploration);
    console.log(
      `✅ 저장 완료: ${savedScience.title} (문제 ${savedScience.blocks.length}개)`,
    );

    // 통계 조회
    console.log("\n📊 저장된 데이터 통계:");
    const allBooks = await probService.findAll();
    console.log(`📚 전체 문제집: ${allBooks.length}개`);

    const allTags = await probService.getAllTags();
    console.log(`🏷️ 전체 태그: ${allTags.length}개`);

    const tagStats = await probService.getTagStats();
    console.log("🔍 인기 태그 TOP 5:");
    tagStats.slice(0, 5).forEach((stat, idx) => {
      console.log(
        `  ${idx + 1}. ${stat.tagName}: 문제집 ${stat.bookCount}개, 문제 ${stat.probCount}개`,
      );
    });

    console.log("\n🎉 샘플 데이터 생성 완료!");
  } catch (error) {
    console.error("❌ 샘플 데이터 생성 실패:", error);
  }
}

createSampleData().then(() => process.exit(0));
