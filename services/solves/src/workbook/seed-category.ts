import { logger } from "../logger";
import { categoryService } from "./category.service";

/**
 * 카테고리 시드 데이터
 * { name: string, description: string, order: number, children: Array<{ name: string, order: number }> }
 */
const categoryData = [
  {
    name: "시사 • 상식",
    description: "특정 분야에 국한되지 않은 보편적이고 재미 위주의 지식",
    order: 0,
    children: [
      { name: "기초 상식", order: 0 },
      { name: "넌센스", order: 0 },
      { name: "일상 잡학", order: 0 },
    ],
  },
  {
    name: "학교 교과목",
    description: "초/중/고 교육과정 기반의 심화 및 내신/수능 대비 문제",
    order: 1,
    children: [
      { name: "국어", order: 0 },
      { name: "수학", order: 0 },
      { name: "영어", order: 0 },
      { name: "사회", order: 0 },
      { name: "과학", order: 0 },
      { name: "예체능", order: 0 },
    ],
  },
  {
    name: "역사 • 문화 • 예술",
    description: "연도, 작품명/작가 연결, 유적지 상식 등",
    order: 2,
    children: [
      { name: "한국사", order: 0 },
      { name: "세계사", order: 0 },
      { name: "미술사", order: 0 },
      { name: "음악사", order: 0 },
      { name: "문학 • 철학", order: 0 },
    ],
  },
  {
    name: "영화 • 음악",
    description: "배우/가수/곡 제목 맞히기, 팬덤 지식",
    order: 3,
    children: [
      { name: "K-POP", order: 0 },
      { name: "팝/클래식", order: 0 },
      { name: "영화/드라마", order: 0 },
      { name: "웹툰/애니메이션", order: 0 },
    ],
  },
  {
    name: "업무 • 직무",
    description: "전문 직무 지식, 팀빌딩 퀴즈, 워크숍 자료",
    order: 4,
    children: [
      { name: "HR/경영", order: 0 },
      { name: "비즈니스매너", order: 0 },
      { name: "직장생활", order: 0 },
      { name: "마케팅/홍보", order: 0 },
      { name: "IT/개발", order: 0 },
    ],
  },
  {
    name: "MBTI • 성향 • 트렌드",
    description: "재미 중심의 심리 테스트",
    order: 5,
    children: [
      { name: "MBTI 유형", order: 0 },
      { name: "애니어그램", order: 0 },
      { name: "심리테스트", order: 0 },
      { name: "가치관", order: 0 },
      { name: "유행어", order: 0 },
      { name: "SNS트렌드", order: 0 },
    ],
  },
  {
    name: "취미 • 라이프스타일",
    description: "특정 취미 분야 전문 지식 테스트, 라이프스타일 취향 파악 퀴즈",
    order: 6,
    children: [
      { name: "여행", order: 0 },
      { name: "스포츠", order: 0 },
      { name: "요리", order: 0 },
      { name: "패션/뷰티", order: 0 },
      { name: "반려동물", order: 0 },
      { name: "건강/웰빙", order: 0 },
    ],
  },
  {
    name: "과학 • 기술 • IT",
    description: "기술 용어 이해도, 과학 원리 응용, 테크 트렌드 파악 문제",
    order: 7,
    children: [
      { name: "인공지능(AI)", order: 0 },
      { name: "우주/천문학", order: 0 },
      { name: "생명과학", order: 0 },
      { name: "최신 IT 트렌드", order: 0 },
    ],
  },
  {
    name: "기타",
    description: null,
    aiPrompt: "ETC 항목 입니다. 사용자에게 어떤 문제집을 만들건지 구체적으로 질문이 필요합니다.",
    order: 20,
    children: [],
  },
];

export const seedCategory = async () => {
  logger.info("🌱 Seeding Category data...");

  for (const category of categoryData) {
    // 루트 카테고리 존재 여부 확인 (parentId가 null인 경우)
    let rootCategory = await categoryService.getCategoryByNameAndParent(
      category.name,
      null,
    );

    if (rootCategory) {
      logger.info(`⏭️  루트 카테고리 이미 존재: ${category.name}`);
    } else {
      rootCategory = await categoryService.insertCategory({
        name: category.name,
        parentId: null,
        description: category.description,
        aiPrompt: category.aiPrompt || null,
        order: category.order,
      });
      logger.info(`✅ 루트 카테고리 생성: ${rootCategory.name}`);
    }

    // 하위 카테고리 처리
    for (const child of category.children) {
      const existsChild = await categoryService.getCategoryByNameAndParent(
        child.name,
        rootCategory.id,
      );

      if (!existsChild) {
        await categoryService.insertCategory({
          name: child.name,
          parentId: rootCategory.id,
          description: null,
          aiPrompt: null,
          order: child.order,
        });
      }
    }
    logger.info(`  └─ 하위 카테고리 ${category.children.length}개 완료`);
  }

  logger.info("✅ Category 시드 데이터 생성 완료\n");
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  import("@workspace/env");
  seedCategory()
    .then(() => {
      logger.info("\n✅ Category Seed completed!");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("❌ Category Seed failed:", error);
      process.exit(1);
    });
}
