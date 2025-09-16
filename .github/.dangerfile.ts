// @ts-nocheck
import { danger, fail, message, warn } from "danger";

const prTitle = danger.github.pr.title;
const conventionalRegex =
  /^(feat|fix|chore|docs|style|refactor|test|perf|build|ci|revert)(\(.+\))?!?: .+/;

if (!conventionalRegex.test(prTitle)) {
  fail(
    `❌ PR 제목이 Conventional Commit 형식을 따르지 않습니다.

**현재 제목:** "${prTitle}"

**예상 형식:**
- \`feat: 로그인 기능 추가\`
- \`fix: 리다이렉트 버그 수정\`
- \`chore: 의존성 xyz 업데이트\`
- \`feat(auth): OAuth 통합 추가\`

**지원되는 접두사:**
- \`feat\` - 새로운 기능
- \`fix\` - 버그 수정
- \`chore\` - 유지보수 작업
- \`docs\` - 문서 변경
- \`style\` - 포맷팅 변경
- \`refactor\` - 코드 리팩토링
- \`test\` - 테스트 추가/변경
- \`perf\` - 성능 개선
- \`build\` - 빌드 시스템 변경
- \`ci\` - CI 설정 변경
- \`revert\` - 변경사항 되돌리기

PR 제목을 이 형식 중 하나에 맞게 업데이트해주세요.`,
  );
} else {
  message("✅ PR 제목이 Conventional Commit 형식을 따릅니다!");
}

if (prTitle.length > 100) {
  warn("⚠️ PR 제목이 너무 깁니다. 100자 이하로 유지하는 것을 고려해주세요.");
}

if (prTitle.length < 10) {
  warn("⚠️ PR 제목이 너무 짧습니다. 더 자세하게 설명하는 것을 고려해주세요.");
}
