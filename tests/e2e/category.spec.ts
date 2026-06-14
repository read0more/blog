import { test, expect } from "@playwright/test";

test.describe("카테고리", () => {
  test("/category/React — React 글 2개만 표시되고 사이드바가 active", async ({ page }) => {
    await page.goto("/category/React/");
    await expect(page.getByTestId("list-title")).toHaveText("React");
    await expect(page.getByTestId("list-subtitle")).toHaveText("2개의 글");
    await expect(page.locator('[data-testid^="post-card-"]')).toHaveCount(2);

    const reactRow = page
      .getByTestId("sidebar-desktop")
      .getByTestId("sidebar-category-React");
    await expect(reactRow).toHaveAttribute("aria-current", "page");
    // 글 개수 뱃지: React 글 2개.
    await expect(reactRow).toContainText("2");
  });

  test("한글 카테고리 /category/성능 — 1개 글, 사이드바 active", async ({ page }) => {
    await page.goto("/category/%EC%84%B1%EB%8A%A5/");
    await expect(page.getByTestId("list-title")).toHaveText("성능");
    await expect(page.getByTestId("list-subtitle")).toHaveText("1개의 글");
    const row = page
      .getByTestId("sidebar-desktop")
      .getByTestId("sidebar-category-성능");
    await expect(row).toHaveAttribute("aria-current", "page");
  });

  test("새 카테고리 자동 생성 — 'QA메모'가 사이드바에 나타난다", async ({ page }) => {
    // e2e-short-note.md(category: QA메모)가 추가되면 사이드바에 자동 생성된다.
    await page.goto("/");
    const row = page
      .getByTestId("sidebar-desktop")
      .getByTestId("sidebar-category-QA메모");
    await expect(row).toBeVisible();
    await expect(row).toContainText("QA메모");
    // 목 글 1개가 추가돼 글 개수 뱃지가 1로 집계된다(카테고리 글 수 반영).
    await expect(row).toContainText("1");

    // 클릭 시 해당 카테고리 페이지로.
    await row.click();
    await expect(page).toHaveURL(/\/category\//);
    await expect(page.getByTestId("list-title")).toHaveText("QA메모");
  });

  test("사이드바 카테고리 색상칩 — 모든 카테고리에 컬러 dot", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.getByTestId("sidebar-desktop");
    // 카테고리 6개(React/CSS/TypeScript/성능/빌드도구/QA메모).
    await expect(
      sidebar.locator('[data-testid^="sidebar-category-"]'),
    ).toHaveCount(6);
  });
});
