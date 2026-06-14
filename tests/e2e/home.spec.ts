import { test, expect } from "@playwright/test";

/**
 * 홈(/) — 글 목록.
 * 원본 글 6개 + QA 목 글(e2e-short-note, 2024-01-01 로 백데이트해 맨 뒤)로 총 7개 카드.
 * 최신순 정렬·메타(카테고리/날짜/읽는시간)·카드 클릭 이동을 검증한다.
 */

// 최신순(원본 6개) + 마지막에 목 글.
const ORDER = [
  "use-effect-deps",
  "container-query",
  "server-components",
  "satisfies",
  "image-lcp",
  "vite-monorepo",
  "e2e-short-note",
];

test.describe("홈", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("글 카드가 최신순으로 렌더된다", async ({ page }) => {
    const cards = page.locator('[data-testid^="post-card-"]');
    await expect(cards).toHaveCount(ORDER.length);

    // DOM 순서가 곧 최신순. data-testid 의 slug 순서를 확인.
    const ids = await cards.evaluateAll((els) =>
      els.map((e) => e.getAttribute("data-testid")),
    );
    expect(ids).toEqual(ORDER.map((s) => `post-card-${s}`));
  });

  test("부제에 글 개수·최신순 안내가 있다", async ({ page }) => {
    await expect(page.getByTestId("list-title")).toHaveText("최신 글");
    await expect(page.getByTestId("list-subtitle")).toContainText("최신순");
    await expect(page.getByTestId("list-subtitle")).toContainText(
      `${ORDER.length}개의 글`,
    );
  });

  test("카드에 카테고리 색상·날짜·읽는시간 메타가 표시된다", async ({ page }) => {
    const card = page.getByTestId("post-card-use-effect-deps");
    // 카테고리(React) — categoryColor("React") = #5856d6.
    const cat = card.locator("span", { hasText: "React" }).first();
    await expect(cat).toHaveText("React");
    await expect(cat).toHaveCSS("color", "rgb(88, 86, 214)");
    // 날짜(YYYY년 …) + 읽는시간(N분)
    await expect(card).toContainText("년");
    await expect(card).toContainText("분");
  });

  test("카드 클릭 시 글 상세로 이동한다", async ({ page }) => {
    await page.getByTestId("post-card-use-effect-deps").click();
    await expect(page).toHaveURL(/\/posts\/use-effect-deps\/?$/);
    await expect(page.getByTestId("article-title")).toBeVisible();
  });
});
