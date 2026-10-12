import { test, expect } from "@playwright/test";

/**
 * 태그 — 픽스처 태그는 4개(렌더링 2편, Hooks/RSC/이미지 각 1편).
 * 카테고리명과 겹치지 않는 이름을 써서 카테고리 단언과 섞이지 않게 한다.
 */
test.describe("태그", () => {
  test("한글 태그 /tag/렌더링 — 글 2개, 태그 줄에서 active", async ({
    page,
  }) => {
    await page.goto("/tag/%EB%A0%8C%EB%8D%94%EB%A7%81/");
    await expect(page.getByTestId("list-title")).toHaveText("#렌더링");
    await expect(page.getByTestId("list-subtitle")).toHaveText("2개의 글");
    await expect(page.locator('[data-testid^="post-card-"]')).toHaveCount(2);

    // 태그 페이지의 태그 줄은 전체 태그를 보여주고 현재 태그만 강조한다.
    const row = page.getByTestId("tags").first();
    await expect(row.locator('[data-testid^="tag-chip-"]')).toHaveCount(4);
    await expect(row.getByTestId("tag-chip-렌더링")).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(row.getByTestId("tag-chip-Hooks")).not.toHaveAttribute(
      "aria-current",
    );
  });

  test("홈 태그 줄 — 글 수 내림차순, 동률은 가나다순", async ({ page }) => {
    await page.goto("/");
    const chips = page
      .getByTestId("tags")
      .first()
      .locator('[data-testid^="tag-chip-"]');
    await expect(chips).toHaveText(["#렌더링", "#이미지", "#Hooks", "#RSC"]);
  });

  test("카테고리 페이지 태그 줄 — 그 카테고리 글의 태그만", async ({
    page,
  }) => {
    await page.goto("/category/React/");
    const chips = page
      .getByTestId("tags")
      .first()
      .locator('[data-testid^="tag-chip-"]');
    await expect(chips).toHaveText(["#렌더링", "#Hooks", "#RSC"]);
  });

  test("카드의 태그 칩 클릭 — 글 상세가 아니라 태그 페이지로 간다", async ({
    page,
  }) => {
    await page.goto("/");
    const card = page
      .locator("li")
      .filter({ has: page.getByTestId("post-card-use-effect-deps") });
    await expect(card.locator('[data-testid^="tag-chip-"]')).toHaveText([
      "#Hooks",
      "#렌더링",
    ]);

    await card.getByTestId("tag-chip-Hooks").click();
    await expect(page).toHaveURL(/\/tag\/Hooks\/$/);
    await expect(page.getByTestId("list-title")).toHaveText("#Hooks");
  });

  test("태그 없는 글 — 카드에 태그 칩이 없다", async ({ page }) => {
    await page.goto("/");
    const card = page
      .locator("li")
      .filter({ has: page.getByTestId("post-card-satisfies") });
    await expect(card.getByTestId("tags")).toHaveCount(0);
  });

  test("글 상세 — 태그 칩이 표시되고 태그 페이지로 연결된다", async ({
    page,
  }) => {
    await page.goto("/posts/use-effect-deps/");
    const article = page.getByTestId("article");
    await expect(article.locator('[data-testid^="tag-chip-"]')).toHaveCount(2);

    await article.getByTestId("tag-chip-렌더링").click();
    await expect(page.getByTestId("list-title")).toHaveText("#렌더링");
  });
});
