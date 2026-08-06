import { test, expect } from "@playwright/test";

test.describe("이미지 라이트박스", () => {
  test("본문 이미지 클릭 → 라이트박스가 열리고 ESC로 닫힌다", async ({
    page,
  }) => {
    await page.goto("/posts/image-lcp/");

    const img = page
      .getByTestId("article-body")
      .locator("figure.md-figure img");
    await expect(img).toHaveCount(1);

    await img.first().click();

    // PhotoSwipe 는 body 하위에 .pswp 를 붙이고 열린다.
    await expect(page.locator(".pswp")).toBeVisible();

    await page.keyboard.press("Escape");

    // 닫히면 PhotoSwipe 가 DOM 을 제거한다.
    await expect(page.locator(".pswp")).toHaveCount(0);
  });
});
