import { test, expect } from "@playwright/test";

test.describe("글 상세", () => {
  test("본문 블록이 렌더된다(제목/heading/문단/코드/인용/리스트)", async ({
    page,
  }) => {
    await page.goto("/posts/use-effect-deps/");
    await expect(page.getByTestId("article-title")).toHaveText(
      "useEffect 의존성 배열, 다시 생각하기",
    );
    const body = page.getByTestId("article-body");
    await expect(body.locator("h2")).toHaveCount(3);
    await expect(body.locator("h3")).toHaveCount(1);
    await expect(body.locator("blockquote")).toHaveCount(1);
    await expect(body.locator("ul")).toHaveCount(1);
    // 코드블록(shiki figure) 2개.
    await expect(
      body.locator("figure[data-rehype-pretty-code-figure]"),
    ).toHaveCount(2);
  });

  test("코드 복사 버튼 — 클릭 시 '복사'→'복사됨'으로 바뀐다", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/posts/use-effect-deps/");
    const copyBtn = page.getByTestId("code-copy").first();
    await expect(copyBtn).toContainText("복사");
    await copyBtn.click();
    await expect(copyBtn).toContainText("복사됨");
    // 1.5s 후 원복.
    await expect(copyBtn).toContainText("복사", { timeout: 3000 });
  });

  test("TOC — 3개 이상 heading 글에서 우측 목차가 보인다", async ({ page }) => {
    await page.goto("/posts/use-effect-deps/");
    await expect(page.getByTestId("toc")).toBeVisible();
    await expect(page.locator('[data-testid^="toc-item-"]')).toHaveCount(4);
  });

  test("TOC 클릭 — 해당 heading으로 스크롤되고 해시가 갱신된다", async ({
    page,
  }) => {
    await page.goto("/posts/use-effect-deps/");
    // 두 번째 heading(문서 중간)을 기준으로 검증한다. 마지막 heading 은 페이지
    // 끝이라 끝까지 스크롤해도 상단에 닿지 못하므로 안착 위치 검증에 부적합.
    const target = page.getByTestId("article-body").locator("h2").nth(1);

    const before = await target.evaluate(
      (el) => el.getBoundingClientRect().top,
    );
    expect(before).toBeGreaterThan(400);

    const tocItems = page.locator('[data-testid^="toc-item-"]');
    // toc-item 순서 = h2/h3 순서. nth(1) 은 두 번째 항목(두 번째 h2).
    await tocItems.nth(1).click();
    await expect(page).toHaveURL(/#/);

    // smooth scroll 정착 후 — heading 이 sticky 헤더 바로 아래
    // (scroll-margin-top ≈ 헤더57 + space16 = 73px) 근처로 올라온다.
    await expect
      .poll(
        async () =>
          target.evaluate((el) => Math.round(el.getBoundingClientRect().top)),
        { timeout: 2000 },
      )
      .toBeLessThan(120);
  });

  test("scroll-spy — 아래로 스크롤하면 active 항목이 갱신된다", async ({
    page,
  }) => {
    await page.goto("/posts/use-effect-deps/");
    // 초기 active = 첫 항목.
    const items = page.locator('[data-testid^="toc-item-"]');
    await expect(items.first()).toHaveAttribute("aria-current", "true");

    // 마지막 heading 위치로 스크롤.
    await page
      .getByTestId("article-body")
      .locator("h2")
      .last()
      .scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(300);
    // 더 이상 첫 항목이 active 가 아니다(아래 항목으로 이동).
    await expect(items.first()).not.toHaveAttribute("aria-current", "true");
  });

  test("TOC 숨김 — heading 2개인 짧은 글에는 목차가 없다", async ({ page }) => {
    await page.goto("/posts/e2e-short-note/");
    await expect(page.getByTestId("article-title")).toBeVisible();
    await expect(page.getByTestId("toc")).toHaveCount(0);
  });

  test("giscus 안내 박스 — env 미설정 시 placeholder가 보인다", async ({
    page,
  }) => {
    await page.goto("/posts/use-effect-deps/");
    await expect(page.getByTestId("comments")).toBeVisible();
    await expect(page.getByTestId("comments")).toContainText("GitHub 로그인");
    await expect(page.getByTestId("giscus-placeholder")).toBeVisible();
  });
});
