import "@workspace/env";
import inquirer from "inquirer";
import { SERVICE_NAME } from "./const";
import { seedPrices } from "./payment/seed-prices";
import { seedProb } from "./prob/seed-prob";

console.log(`🚀 [${SERVICE_NAME}] 시드 데이터 생성 시작...\n`);

const answer = await inquirer.prompt([
  {
    type: "checkbox",
    name: "modules",
    message: "어떤 모듈의 시드 데이터를 생성하시겠습니까?",
    choices: [
      { name: "📝 Prob (문제집 & 문제)", value: "prob", checked: true },
      { name: "💰 Payment (AI 가격 정보)", value: "payment", checked: true },
    ],
  },
]);

if (answer.modules.length === 0) {
  console.log("⏭️  선택된 모듈이 없습니다. 종료합니다.");
  process.exit(0);
}

try {
  // Prob 모듈 시드
  if (answer.modules.includes("prob")) {
    await seedProb();
  }

  // Payment 모듈 시드
  if (answer.modules.includes("payment")) {
    await seedPrices();
  }

  console.log(`✅ [${SERVICE_NAME}] 모든 시드 데이터 생성 완료! 🎉`);
} catch (error) {
  console.error(`❌ [${SERVICE_NAME}] 시드 데이터 생성 실패:`, error);
  process.exit(1);
}

process.exit(0);
