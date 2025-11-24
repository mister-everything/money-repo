import { Role } from "@service/auth/shared";
import { userService } from "@service/auth/user.service";
import { generateUUID } from "@workspace/util";

import { mockData } from "./mock-data";
import { workBookService } from "./workbook.service";

/**
 * Prob 모듈 시드 데이터 생성
 * 테스트 사용자 및 문제집 생성
 */
export const seedProb = async () => {
  console.log("🌱 Seeding Prob data...");

  // 랜덤 테스트 유저 생성
  const randomEmail = `test${Math.random().toString(36).substring(2, 10)}@test.com`;
  const testUser = await userService.createUser({
    email: randomEmail,
    name: "test",
    role: Role.USER,
    id: generateUUID(),
  });

  console.log(`✅ 랜덤 유저 생성 완료: ${testUser[0].email}`);

  // 첫 번째 문제집 생성
  const probBook = await workBookService.createWorkBook({
    ownerId: testUser[0].id,
    title: "상식 테스트 문제 입니다",
    // description: "상식 퀴즈 객관식과 주관식 문제 입니다.",
    // isPublic: true,
    // tags: ["test", "객관식", "주관식"],
  });

  for (const block of mockData.slice(0, 2)) {
    await workBookService.createWorkBookBlock({
      probBookId: probBook.id,
      ownerId: testUser[0].id,
      order: block.order,
      type: block.type,
      content: block.content,
      question: block.question,
      answer: block.answer!,
    });
  }

  console.log(`✅ 문제집 1 생성 완료: ${probBook.id}`);

  // 두 번째 문제집 생성
  const probBook2 = await workBookService.createWorkBook({
    ownerId: testUser[0].id,
    title: "상식 테스트 문제 입니다 2",
    // description: "상식퀴즈 OX, 순서맞추기 문제 입니다.",
    // isPublic: true,
    // tags: ["test", "OX", "순서맞추기"],
  });

  for (const block of mockData.slice(2, 4)) {
    await workBookService.createWorkBookBlock({
      probBookId: probBook2.id,
      ownerId: testUser[0].id,
      order: block.order,
      type: block.type,
      content: block.content,
      question: block.question,
      answer: block.answer!,
    });
  }

  console.log(`✅ 문제집 2 생성 완료: ${probBook2.id}`);

  const bookDetail = await workBookService.selectProbBookById(probBook.id);
  console.log("\n📊 생성된 문제집 상세:");
  console.dir(bookDetail, { depth: null });

  console.log("✅ Prob 시드 데이터 생성 완료\n");
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  import("@workspace/env");
  seedProb()
    .then(() => {
      console.log("\n✅ Seed completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    });
}
