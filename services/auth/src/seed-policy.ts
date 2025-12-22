import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { pgDb } from "./db";
import { policyVersionTable } from "./schema";
import { CURRENT_PRIVACY_VERSION } from "./shared";

const PRIVACY_POLICY_CONTENT = `
Solves(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 본 개인정보 처리방침은 회사가 제공하는 문제집 제작 및 공유 서비스(이하 "서비스")에 적용됩니다.

---

## 1. 수집하는 개인정보

### 필수 수집 항목
- **OAuth 제공 정보:** 이메일 주소, 프로필 이름, 프로필 이미지 (Google 계정 연동 시)
- **서비스 이용 정보:** 닉네임, 서비스 이용 기록, 접속 로그

### 자동 수집 항목
- IP 주소, 브라우저 정보, 접속 시간
- 쿠키 및 유사 기술을 통한 이용 정보

---

## 2. 개인정보 이용 목적

- **서비스 제공:** 회원 가입, 로그인, 문제집 제작 및 공유 서비스 제공
- **사용자 식별:** 문제집 작성자 표시를 위한 닉네임 및 프로필 이미지 노출
- **서비스 개선:** 서비스 이용 통계 분석, 맞춤형 서비스 제공
- **고객 지원:** 문의사항 처리, 공지사항 전달
- **부정 이용 방지:** 서비스 악용 방지 및 보안 유지

---

## 3. 개인정보 보유 및 이용 기간

회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 다음의 경우에는 명시된 기간 동안 보관합니다:

- **회원 탈퇴 시:** 탈퇴 즉시 개인정보 익명화 처리
- **관련 법령에 의한 보관:**
  - 전자상거래법에 따른 계약 및 청약철회 기록: 5년
  - 전자상거래법에 따른 소비자 불만 처리 기록: 3년
  - 통신비밀보호법에 따른 접속 기록: 3개월

---

## 4. 개인정보의 제3자 제공

회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우는 예외로 합니다:

- 이용자가 사전에 동의한 경우
- 법령의 규정에 따르거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 요청이 있는 경우

---

## 5. 개인정보 처리 위탁

회사는 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다:

- **Google LLC:** OAuth 인증 서비스
- **클라우드 서비스 제공업체:** 데이터 저장 및 서버 운영

---

## 6. 이용자의 권리

이용자는 언제든지 다음의 권리를 행사할 수 있습니다:

- **개인정보 열람:** 수집된 개인정보의 열람을 요청할 수 있습니다.
- **개인정보 정정:** 잘못된 개인정보의 정정을 요청할 수 있습니다.
- **개인정보 삭제:** 계정 설정에서 계정 삭제를 요청할 수 있습니다. 삭제 요청 시 개인정보는 즉시 익명화 처리됩니다.
- **처리 정지:** 개인정보 처리 정지를 요청할 수 있습니다.

위 권리 행사는 서비스 내 설정 페이지 또는 privacy@solves.app로 연락하여 요청할 수 있습니다.

---

## 7. 개인정보 보호 조치

회사는 개인정보의 안전한 처리를 위해 다음과 같은 조치를 취하고 있습니다:

- 개인정보 암호화 전송 (HTTPS)
- 비밀번호 등 중요 정보 암호화 저장
- 접근 권한 관리 및 접근 통제
- 보안 프로그램 설치 및 주기적 갱신

---

## 8. 쿠키 사용

회사는 서비스 제공을 위해 쿠키를 사용합니다. 쿠키는 로그인 상태 유지, 사용자 설정 저장 등의 목적으로 사용되며, 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다. 단, 쿠키 저장을 거부할 경우 일부 서비스 이용에 제한이 있을 수 있습니다.

---

## 9. 개인정보 보호책임자

- **담당부서:** 개인정보보호팀
- **이메일:** privacy@solves.app

개인정보 관련 문의사항이 있으시면 위 연락처로 문의해 주시기 바랍니다. 성실하게 답변해 드리겠습니다.

---

## 10. 개인정보 처리방침 변경

본 개인정보 처리방침은 법령 및 방침에 따라 변경될 수 있습니다. 변경 시 서비스 내 공지사항을 통해 안내드리며, 변경된 방침은 공지한 시행일부터 효력이 발생합니다.
`.trim();

export async function seedPolicyVersions() {
  console.log("Seeding policy versions...");

  // 기존 데이터 확인
  const existing = await pgDb
    .select()
    .from(policyVersionTable)
    .where(eq(policyVersionTable.type, "privacy"));

  if (existing.length > 0) {
    console.log("Policy versions already exist. Skipping seed.");
    return;
  }

  // 개인정보 처리방침 시드
  await pgDb.insert(policyVersionTable).values({
    id: randomBytes(16).toString("hex"),
    version: CURRENT_PRIVACY_VERSION,
    type: "privacy",
    title: "개인정보 처리방침",
    content: PRIVACY_POLICY_CONTENT,
    effectiveAt: new Date("2024-01-01"),
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

