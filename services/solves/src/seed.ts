import "@workspace/env";
import inquirer from "inquirer";
import { log } from "./logger";
import { seedPlans } from "./payment/seed-plans";
import { seedPrices } from "./payment/seed-prices";
import { seedWorkbook } from "./workbook/seed-workbook";

log.info("🚀 시드 데이터 생성 시작...\n");

const answer = await inquirer.prompt([
  {
    type: "checkbox",
    name: "modules",
    message: "어떤 모듈의 시드 데이터를 생성하시겠습니까?",
    choices: [
      {
        name: "📝 workbooks (문제집 & 문제)",
        value: "workbooks",
        checked: true,
      },
      { name: "💰 Payment (AI 가격 정보)", value: "payment", checked: true },
      {
        name: "📋 Subscription (구독 플랜)",
        value: "subscription",
        checked: true,
      },
    ],
  },
]);

if (answer.modules.length === 0) {
  log.info("⏭️  선택된 모듈이 없습니다. 종료합니다.");
  process.exit(0);
}

try {
  // Prob 모듈 시드
  if (answer.modules.includes("workbooks")) {
    await seedWorkbook();
  }

  // Payment 모듈 시드
  if (answer.modules.includes("payment")) {
    await seedPrices();
  }

  // Subscription 모듈 시드
  if (answer.modules.includes("subscription")) {
    await seedPlans();
  }

  log.info("✅ 모든 시드 데이터 생성 완료! 🎉");
} catch (error) {
  log.error("❌ 시드 데이터 생성 실패:", error);
  process.exit(1);
}

process.exit(0);
