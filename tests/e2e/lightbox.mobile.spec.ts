import { test, expect } from "@playwright/test";

test.describe("이미지 라이트박스(모바일)", () => {
  test("본문 이미지 탭 → 라이트박스가 열린다", async ({ page }) => {
    await page.goto("/posts/image-lcp/");

    const img = page
      .getByTestId("article-body")
      .locator("figure.md-figure img")
      .first();
    await img.tap();

    await expect(page.locator(".pswp")).toBeVisible();
  });
});
