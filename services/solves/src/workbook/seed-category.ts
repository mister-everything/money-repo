import { logger } from "../logger";
import { categoryService } from "./category.service";

/**
 * 카테고리 시드 데이터
 * { name: string, description: string, children: string[] }
 */
const categoryData = [
  {
    name: "일반 상식",
    description: "특정 분야에 국한되지 않은 보편적이고 재미 위주의 지식",
    children: ["기초 상식", "넌센스", "일상 잡학"],
  },
  {
    name: "학교 교과목",
    description: "초/중/고 교육과정 기반의 심화 및 내신/수능 대비 문제",
    children: ["국어", "수학", "영어", "사회", "과학", "예체능"],
  },
  {
    name: "시사",
    description: "최근 1년 이내 주요 뉴스, 정책, 사회 이슈",
    children: ["국내 정치/사회", "국제/외교", "문학/철학", "전통문화"],
  },
  {
    name: "역사/문화/예술",
    description: "연도, 작품명/작가 연결, 유적지 상식 등",
    children: ["한국사", "세계사", "미술사", "음악사", "문학/철학"],
  },
  {
    name: "영화/음악",
    description: "배우/가수/곡 제목 맞히기, 팬덤 지식",
    children: ["K-POP", "팝/클래식", "영화/드라마", "웹툰/애니메이션"],
  },
  {
    name: "업무/직무",
    description: "전문 직무 지식, 팀빌딩 퀴즈, 워크숍 자료",
    children: ["HR/경영", "비즈니스매너", "직장생활", "마케팅/홍보", "IT/개발"],
  },
  {
    name: "MBTI/성향",
    description: "재미 중심의 심리 테스트",
    children: ["MBTI 유형", "애니어그램", "심리테스트", "가치관"],
  },
  {
    name: "밈/트렌드",
    description: "라이트 유저 대상의 재미 요소, 유행어 생성 배경 파악 퀴즈",
    children: ["유행어", "SNS트렌드", "밸런스게임"],
  },
  {
    name: "취미/라이프스타일",
    description: "특정 취미 분야 전문 지식 테스트, 라이프스타일 취향 파악 퀴즈",
    children: ["여행", "스포츠", "요리", "패션/뷰티", "반려동물", "건강/웰빙"],
  },
  {
    name: "과학/기술/IT",
    description: "기술 용어 이해도, 과학 원리 응용, 테크 트렌드 파악 문제",
    children: ["인공지능(AI)", "우주/천문학", "생명과학", "최신 IT 트렌드"],
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
        aiPrompt: null,
      });
      logger.info(`✅ 루트 카테고리 생성: ${rootCategory.name}`);
    }

    // 하위 카테고리 처리
    for (const childName of category.children) {
      const existsChild = await categoryService.getCategoryByNameAndParent(
        childName,
        rootCategory.id,
      );

      if (!existsChild) {
        await categoryService.insertCategory({
          name: childName,
          parentId: rootCategory.id,
          description: null,
          aiPrompt: null,
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
