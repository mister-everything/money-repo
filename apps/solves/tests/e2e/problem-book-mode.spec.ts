import { expect, test } from "@playwright/test";

test.describe("문제집 풀이 모드 선택 E2E 테스트", () => {
  test.beforeEach(async ({ page }) => {
    // 문제집 목록 페이지로 이동
    await page.goto("/prob");
    // 페이지가 로드될 때까지 대기
    await page.waitForLoadState("networkidle");
  });

  test("문제집 상세 페이지 진입 시 모드 선택 화면 표시", async ({ page }) => {
    // 문제집 카드 찾기
    const probBookLink = page.locator('[href^="/prob/"]').first();
    const count = await probBookLink.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // 첫 번째 문제집 클릭
    await probBookLink.click();

    // URL이 변경되었는지 확인
    await page.waitForURL(/\/prob\/[^/]+$/);

    // 두 가지 모드 옵션이 있는지 확인
    await expect(page.locator("text=전체 풀이")).toBeVisible();
    await expect(page.locator("text=한 문제씩 풀이")).toBeVisible();
  });

  test("전체 풀이 모드 선택 및 동작", async ({ page }) => {
    // 문제집 카드 찾기
    const probBookLink = page.locator('[href^="/prob/"]').first();
    const count = await probBookLink.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // 문제집 클릭
    await probBookLink.click();
    await page.waitForURL(/\/prob\/[^/]+$/);

    // 모드 선택 화면에서 "전체 풀이" 카드 클릭
    // 카드 전체 영역을 클릭할 수 있도록 가장 가까운 클릭 가능한 요소 찾기
    const allModeHeading = page.locator("text=전체 풀이");
    await allModeHeading.click({ force: true });

    // URL에 mode=all이 추가되었는지 확인
    await page.waitForURL(/\/prob\/[^/]+\?mode=all/, { timeout: 5000 });

    // 문제집 헤더가 표시되는지 확인
    await expect(page.locator("text=총")).toBeVisible();

    // 문제들이 표시되는지 확인 (문제집에 문제가 있는 경우)
    const problemBlocks = page.locator("text=/문제 \\d+/");
    const problemCount = await problemBlocks.count();

    if (problemCount > 0) {
      await expect(problemBlocks.first()).toBeVisible();
    }

    // 제출 버튼이 있는지 확인 (결과가 없는 경우)
    const submitButton = page.locator("button:has-text('답안 제출')");
    const submitButtonCount = await submitButton.count();

    if (submitButtonCount > 0) {
      await expect(submitButton).toBeVisible();
    }
  });

  test("한 문제씩 풀이 모드 선택 및 동작", async ({ page }) => {
    // 문제집 카드 찾기
    const probBookLink = page.locator('[href^="/prob/"]').first();
    const count = await probBookLink.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // 문제집 클릭
    await probBookLink.click();
    await page.waitForURL(/\/prob\/[^/]+$/);

    // 모드 선택 화면에서 "한 문제씩 풀이" 카드 클릭
    const sequentialModeHeading = page.locator("text=한 문제씩 풀이");
    await sequentialModeHeading.click({ force: true });

    // URL에 mode=sequential이 추가되었는지 확인
    await page.waitForURL(/\/prob\/[^/]+\?mode=sequential/, { timeout: 5000 });

    // 문제집 헤더가 표시되는지 확인
    await expect(page.locator("text=총")).toBeVisible();

    // 진행률 표시가 있는지 확인
    await expect(page.locator("text=/문제 \\d+ \\/ \\d+/")).toBeVisible();

    // 진행률 바가 있는지 확인
    const progressBar = page.locator('[class*="bg-primary"]').first();
    await expect(progressBar).toBeVisible();

    // 네비게이션 버튼이 있는지 확인
    const prevButton = page.locator("button:has-text('이전')");
    const nextButton = page.locator("button:has-text('다음')");

    // 첫 번째 문제이므로 이전 버튼은 비활성화되어 있어야 함
    await expect(prevButton).toBeDisabled();

    // 다음 버튼 또는 제출 버튼이 있는지 확인
    const hasNextButton = (await nextButton.count()) > 0;
    const hasSubmitButton =
      (await page.locator("button:has-text('답안 제출')").count()) > 0;

    expect(hasNextButton || hasSubmitButton).toBeTruthy();
  });

  test("한 문제씩 풀이 모드에서 네비게이션 버튼 동작", async ({ page }) => {
    // 문제집 카드 찾기
    const probBookLink = page.locator('[href^="/prob/"]').first();
    const count = await probBookLink.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // 문제집 클릭
    await probBookLink.click();
    await page.waitForURL(/\/prob\/[^/]+$/);

    // 한 문제씩 풀이 모드 선택
    const sequentialModeHeading = page.locator("text=한 문제씩 풀이");
    await sequentialModeHeading.click({ force: true });
    await page.waitForURL(/\/prob\/[^/]+\?mode=sequential/, { timeout: 5000 });

    // 문제 개수 확인
    const problemCountText = await page
      .locator("text=/문제 \\d+ \\/ \\d+/")
      .textContent();
    if (!problemCountText) {
      test.skip();
      return;
    }

    const match = problemCountText.match(/(\d+)/);
    const totalProblems = match ? parseInt(match[1], 10) : 0;

    if (totalProblems < 2) {
      test.skip();
      return;
    }

    // 다음 버튼 클릭
    const nextButton = page.locator("button:has-text('다음')");
    const nextButtonCount = await nextButton.count();

    if (nextButtonCount > 0) {
      await nextButton.click();

      // 진행률이 업데이트되었는지 확인
      await expect(page.locator("text=/문제 2 \\/")).toBeVisible({
        timeout: 2000,
      });

      // 이전 버튼이 활성화되었는지 확인
      const prevButton = page.locator("button:has-text('이전')");
      await expect(prevButton).toBeEnabled();

      // 이전 버튼 클릭
      await prevButton.click();

      // 첫 번째 문제로 돌아왔는지 확인
      await expect(page.locator("text=/문제 1 \\/")).toBeVisible({
        timeout: 2000,
      });
    }
  });

  test("모드 선택 후 브라우저 뒤로가기 시 모드 선택 화면으로 돌아감", async ({
    page,
  }) => {
    // 문제집 카드 찾기
    const probBookLink = page.locator('[href^="/prob/"]').first();
    const count = await probBookLink.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // 문제집 클릭
    await probBookLink.click();
    await page.waitForURL(/\/prob\/[^/]+$/);

    // 전체 풀이 모드 선택
    const allModeHeading = page.locator("text=전체 풀이");
    await allModeHeading.click({ force: true });
    await page.waitForURL(/\/prob\/[^/]+\?mode=all/, { timeout: 5000 });

    // 브라우저 뒤로가기
    await page.goBack();

    // 모드 선택 화면으로 돌아왔는지 확인 (쿼리 파라미터 없음)
    await page.waitForURL(/\/prob\/[^/]+$/, { timeout: 5000 });
    await expect(page.locator("text=풀이 모드를 선택해주세요")).toBeVisible();
  });

  test("모드 선택 화면에서 문제집 정보 표시", async ({ page }) => {
    // 문제집 카드 찾기
    const probBookLink = page.locator('[href^="/prob/"]').first();
    const count = await probBookLink.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // 문제집 클릭
    await probBookLink.click();
    await page.waitForURL(/\/prob\/[^/]+$/);

    // 문제집 제목이 표시되는지 확인
    const title = page.locator('[class*="text-3xl"]').first();
    await expect(title).toBeVisible();

    // 문제 개수가 표시되는지 확인
    await expect(page.locator("text=/총 \\d+문제/")).toBeVisible();
  });
});
