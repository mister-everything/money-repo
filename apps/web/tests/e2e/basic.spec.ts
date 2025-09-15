import { expect, test } from "@playwright/test";

test.describe("Basic E2E Tests", () => {
  test("should have root element", async ({ page }) => {
    // 홈페이지로 이동
    await page.goto("/");

    // root 요소가 존재하는지 확인
    await expect(page.locator("#root")).toBeVisible();
  });
});
