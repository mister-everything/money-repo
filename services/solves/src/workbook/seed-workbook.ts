import { Role } from "@service/auth/shared";
import { userService } from "@service/auth/user.service";
import { generateUUID } from "@workspace/util";
import { logger } from "../logger";
import { categoryService } from "./category.service";
import { mockData } from "./mock-data";
import { workBookService } from "./workbook.service";

export const seedWorkbook = async () => {
  logger.info("🌱 Seeding Prob data...");

  // 랜덤 테스트 유저 생성
  const randomEmail = `test${Math.random().toString(36).substring(2, 10)}@test.com`;
  const testUser = await userService.createUser({
    email: randomEmail,
    name: "최성근",
    role: Role.USER,
    id: generateUUID(),
  });

  logger.info(`✅ 랜덤 유저 생성 완료: ${testUser[0].email}`);

  // 카테고리 조회 또는 생성 (일반 상식 > 기초 상식)
  let rootCategory = await categoryService.getCategoryByNameAndParent(
    "일반 상식",
    null,
  );
  if (!rootCategory) {
    rootCategory = await categoryService.insertCategory({
      name: "일반 상식",
      parentId: null,
      description: "특정 분야에 국한되지 않은 보편적이고 재미 위주의 지식",
      aiPrompt: null,
    });
    logger.info(`✅ 루트 카테고리 생성: ${rootCategory.name}`);
  }

  let childCategory = await categoryService.getCategoryByNameAndParent(
    "기초 상식",
    rootCategory.id,
  );
  if (!childCategory) {
    childCategory = await categoryService.insertCategory({
      name: "기초 상식",
      parentId: rootCategory.id,
      description: null,
      aiPrompt: null,
    });
    logger.info(`✅ 하위 카테고리 생성: ${childCategory.name}`);
  }

  logger.info(
    `✅ 카테고리 준비 완료: ${rootCategory.name} > ${childCategory.name}`,
  );

  // Solves 멤버용 문제집 생성
  const workBook = await workBookService.createWorkBook({
    ownerId: testUser[0].id,
    title: "Solves 멤버용 문제집",
    categoryId: childCategory.id,
  });

  // 모든 블록 추가 (default, mcq-multiple, mcq, ranking, ox)
  await workBookService.processUpdateBlocks(workBook.id, {
    deleteBlocks: [],
    insertBlocks: mockData,
    updateBlocks: [],
  });

  logger.info(`✅ 문제집 생성 완료: ${workBook.id}`);

  const bookDetail = await workBookService.getWorkBook(workBook.id);
  await workBookService.publishWorkbook({
    workBookId: workBook.id,
    userId: testUser[0].id,
    tags: ["Solves", "Test", "최성근위주정답률90%"],
  });
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
