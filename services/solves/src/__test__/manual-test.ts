import "@workspace/env";
import { probService } from "../prob.service";
import { ProbBookSaveInput } from "../types";

async function manualTest() {
  console.log("🧪 수동 테스트 시작...");

  try {
    const timestamp = Date.now();

    const sampleData: ProbBookSaveInput = {
      ownerId: "test-user-123",
      title: "간단한 테스트 문제집",
      description: "수동 테스트용",
      tags: ["테스트"],
      blocks: [
        {
          id: `prob-test-${timestamp}`,
          style: "generalFormat",
          title: "간단한 문제",
          content: {
            id: `content-test-${timestamp}`,
            type: "text",
            data: {
              content: "1 + 1 = ?",
            },
          },
          answerMeta: {
            kind: "objective",
            multiple: false,
          },
          options: [
            {
              id: `option-1-${timestamp}`,
              type: "text",
              data: { content: "1" },
            },
            {
              id: `option-2-${timestamp}`,
              type: "text",
              data: { content: "2" },
            },
          ],
          tags: ["기초"],
        },
      ],
    };

    console.log("📝 데이터 저장 중...");
    const saved = await probService.save(sampleData);
    console.log("✅ 저장 결과:", saved ? "성공" : "실패 (null 반환)");

    if (saved) {
      console.log("📋 저장된 문제집 ID:", saved.id);
      console.log("📋 문제 개수:", saved.blocks.length);
      console.log("📋 태그 개수:", saved.tags.length);

      // 조회 테스트
      console.log("🔍 조회 테스트...");
      const found = await probService.findById(saved.id);
      console.log("✅ 조회 결과:", found ? "성공" : "실패 (null 반환)");

      if (found) {
        console.log("📋 조회된 문제집:", found.title);
      }
    }
  } catch (error) {
    console.error("❌ 에러 발생:", error);
  }
}

manualTest().then(() => process.exit(0));
