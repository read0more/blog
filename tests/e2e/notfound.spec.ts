import { test, expect } from "@playwright/test";

test.describe("404", () => {
  test("잘못된 경로 — 404 화면 + 홈 버튼 + 최근 글", async ({ page }) => {
    await page.goto("/this-page-does-not-exist/");

    const nf = page.getByTestId("not-found");
    await expect(nf).toBeVisible();
    await expect(nf).toContainText("404");
    await expect(nf).toContainText("페이지를 찾을 수 없습니다");

    // 홈 버튼 → /
    const home = page.getByTestId("not-found-home");
    await expect(home).toHaveAttribute("href", "/");

    // 최근 글 3개.
    await expect(
      page.locator('[data-testid^="not-found-recent-"]'),
    ).toHaveCount(3);
  });

  test("홈 버튼 클릭 — 홈으로 이동", async ({ page }) => {
    await page.goto("/nope/");
    await page.getByTestId("not-found-home").click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("post-list")).toBeVisible();
  });
});
