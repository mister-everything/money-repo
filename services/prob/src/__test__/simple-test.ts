import "@workspace/env";
import { pgDb } from "../db";
import { probService } from "../prob.service";
import { probBooksTable } from "../schema";

async function simpleTest() {
  console.log("🧪 간단한 저장/조회 테스트...");

  try {
    const testId = `simple-test-${Date.now()}`;

    // 1. 직접 DB에 저장
    console.log("💾 직접 DB 저장...");
    const [directSaved] = await pgDb
      .insert(probBooksTable)
      .values({
        id: testId,
        ownerId: "test-user",
        title: "직접 저장 테스트",
        description: "간단한 테스트",
      })
      .returning();

    console.log("✅ 직접 저장 완료:", directSaved.id);

    // 2. probService.findById로 조회
    console.log("🔍 probService.findById로 조회...");
    const serviceResult = await probService.findById(testId);
    console.log("📋 서비스 조회 결과:", serviceResult ? "성공" : "실패");
  } catch (error) {
    console.error("❌ 에러:", error);
  }
}

simpleTest().then(() => process.exit(0));
