import { randomBytes } from "node:crypto";

import { pgDb } from "./db";
import { policyVersionTable } from "./schema";

const TERMS_POLICY_CONTENT = `
# 서비스 이용약관

## 제1조 (목적)
본 약관은 Solves(이하 "회사")가 제공하는 서비스의 이용 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.

## 제2조 (용어의 정의)
1. "서비스"라 함은 회사가 제공하는 모든 인터넷 서비스를 의미합니다.
2. "이용자"라 함은 본 약관에 따라 서비스를 이용하는 사용자를 의미합니다.

... (중략) ...
`.trim();

const PRIVACY_POLICY_CONTENT = `
# 개인정보 처리방침
... (기존 내용 동일) ...
`.trim();

const MARKETING_POLICY_CONTENT = `
# 마케팅 정보 수신 동의 (선택)

Solves의 새로운 기능, 이벤트, 혜택 등 다양한 소식을 가장 먼저 받아보실 수 있습니다.

1. 수집 항목: 이메일, 프로필 이름
2. 이용 목적: 신규 서비스 안내, 이벤트 정보 제공
3. 보유 기간: 서비스 탈퇴 시 또는 동의 철회 시까지
`.trim();

export async function seedPolicyVersions() {
  console.log("Seeding policy versions...");

  // 기존 데이터 확인
  const existing = await pgDb.select().from(policyVersionTable);

  if (existing.length > 0) {
    console.log("Policy versions already exist. Skipping seed.");
    return;
  }

  // 1. 서비스 이용약관 (필수)
  await pgDb.insert(policyVersionTable).values({
    id: randomBytes(16).toString("hex"),
    version: "1.0.0",
    type: "terms",
    title: "서비스 이용약관",
    content: TERMS_POLICY_CONTENT,
    effectiveAt: new Date("2024-01-01"),
    isRequired: true,
  });

  // 2. 개인정보 처리방침 (필수)
  await pgDb.insert(policyVersionTable).values({
    id: randomBytes(16).toString("hex"),
    version: "1.0.0",
    type: "privacy",
    title: "개인정보 처리방침",
    content: PRIVACY_POLICY_CONTENT,
    effectiveAt: new Date("2024-01-01"),
    isRequired: true,
  });

  // 3. 마케팅 정보 수신 동의 (선택)
  await pgDb.insert(policyVersionTable).values({
    id: randomBytes(16).toString("hex"),
    version: "1.0.0",
    type: "marketing",
    title: "마케팅 정보 수신 동의",
    content: MARKETING_POLICY_CONTENT,
    effectiveAt: new Date("2024-01-01"),
    isRequired: false,
  });

  console.log("Policy versions seeded successfully.");
}

// CLI에서 직접 실행 시
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPolicyVersions()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
