import { Role } from "@service/auth/shared";
import { userService } from "@service/auth/user.service";
import { generateUUID } from "@workspace/util";
import { logger } from "../logger";
import { mockData } from "./mock-data";
import { workBookService } from "./workbook.service";

export const seedWorkbook = async () => {
  logger.info("🌱 Seeding Prob data...");

  // 랜덤 테스트 유저 생성
  const randomEmail = `test${Math.random().toString(36).substring(2, 10)}@test.com`;
  const testUser = await userService.createUser({
    email: randomEmail,
    name: "test",
    role: Role.USER,
    id: generateUUID(),
  });

  logger.info(`✅ 랜덤 유저 생성 완료: ${testUser[0].email}`);

  // 첫 번째 문제집 생성
  const workBook = await workBookService.createWorkBook({
    ownerId: testUser[0].id,
    title: "상식 테스트 문제 입니다",
  });

  await workBookService.processUpdateBlocks(
    workBook.id,
    testUser[0].id,
    [],
    mockData.slice(0, 2),
  );

  logger.info(`✅ 문제집 1 생성 완료: ${workBook.id}`);

  // 두 번째 문제집 생성
  const workBook2 = await workBookService.createWorkBook({
    ownerId: testUser[0].id,
    title: "상식 테스트 문제 입니다 2",
    // description: "상식퀴즈 OX, 순서맞추기 문제 입니다.",
    // isPublic: true,
    // tags: ["test", "OX", "순서맞추기"],
  });

  await workBookService.processUpdateBlocks(
    workBook2.id,
    testUser[0].id,
    [],
    mockData.slice(2, 4),
  );

  logger.info(`✅ 문제집 2 생성 완료: ${workBook2.id}`);

  const bookDetail = await workBookService.getWorkBook(workBook.id);
  logger.info("\n📊 생성된 문제집 상세:");
  logger.info(bookDetail);

  logger.info("✅ Prob 시드 데이터 생성 완료\n");
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  import("@workspace/env");
  seedWorkbook()
    .then(() => {
      logger.info("\n✅ Seed completed!");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("❌ Seed failed:", error);
      process.exit(1);
    });
}
