import { test, expect } from "@playwright/test";

test.describe("검색 (데스크톱)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("'컨테이너' 검색 — 본문 매칭 1건 + 패널 + 스니펫 하이라이트", async ({ page }) => {
    await page.getByTestId("search-input").fill("컨테이너");

    const panel = page.getByTestId("search-panel");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("1개의 결과");

    const result = page.getByTestId("search-result-container-query");
    await expect(result).toBeVisible();
    await expect(result).toContainText("Container Query");

    // <mark> 하이라이트에 검색어가 들어간다.
    const mark = panel.locator("mark").first();
    await expect(mark).toHaveText("컨테이너");
    await expect(mark).toHaveCSS("background-color", "rgba(0, 122, 255, 0.16)");
  });

  test("결과 없음 — 'graphql' 안내 문구 + 카테고리 칩", async ({ page }) => {
    await page.getByTestId("search-input").fill("graphql");
    const empty = page.getByTestId("search-empty");
    await expect(empty).toBeVisible();
    await expect(empty).toContainText("graphql");
    await expect(empty).toContainText("결과가 없습니다");
    // 카테고리 칩(6개).
    await expect(
      page.locator('[data-testid^="search-empty-chip-"]'),
    ).toHaveCount(6);
  });

  test("지우기 버튼 — 패널이 닫힌다", async ({ page }) => {
    await page.getByTestId("search-input").fill("컨테이너");
    await expect(page.getByTestId("search-panel")).toBeVisible();
    await page.getByTestId("search-clear").click();
    await expect(page.getByTestId("search-panel")).toHaveCount(0);
  });

  test("결과 클릭 — 글 상세로 이동", async ({ page }) => {
    await page.getByTestId("search-input").fill("컨테이너");
    await page.getByTestId("search-result-container-query").click();
    await expect(page).toHaveURL(/\/posts\/container-query\/?$/);
  });
});
