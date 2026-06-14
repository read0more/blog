import { test, expect, type Page } from "@playwright/test";

/**
 * 위로가기(back-to-top) FAB — AppShell 전역.
 * 동작: 초기 숨김 → window.scrollY > 400 이면 등장 → 클릭 시 최상단 smooth scroll.
 *
 * 구현 메모: 버튼은 항상 DOM 에 있고 visible/hidden 을 CSS opacity + pointer-events
 * 로 토글한다(.backToTopVisible). 따라서 Playwright 의 toBeVisible() 은 opacity:0
 * 상태도 "보임"으로 판정하므로, 노출 여부는 **computed opacity** 로 검증한다.
 * smooth scroll 은 비결정적이라 scrollY 를 expect.poll 로 폴링한다.
 */

const opacityOf = (page: Page) =>
  page
    .getByTestId("back-to-top")
    .evaluate((el) => Number(getComputedStyle(el).opacity));

const scrollYOf = (page: Page) => page.evaluate(() => window.scrollY);

/** 본문이 긴 글에서 검증한다(스크롤 여지 확보). */
const LONG_POST = "/posts/use-effect-deps/";

test.describe("위로가기 버튼", () => {
  test("초기엔 숨김 → 스크롤(>400) 후 노출 → 클릭 시 최상단 복귀", async ({
    page,
  }) => {
    await page.goto(LONG_POST);

    // ① 초기: opacity 0(숨김), pointer-events none.
    await expect.poll(() => opacityOf(page)).toBe(0);
    await expect(page.getByTestId("back-to-top")).toHaveCSS(
      "pointer-events",
      "none",
    );

    // ② 400px 초과로 스크롤(여유 있게 600) → 노출(opacity 1 + 클래스).
    await page.evaluate(() => window.scrollTo(0, 600));
    await expect.poll(() => scrollYOf(page)).toBeGreaterThan(400);
    await expect.poll(() => opacityOf(page)).toBe(1);
    await expect(page.getByTestId("back-to-top")).toHaveCSS(
      "pointer-events",
      "auto",
    );

    // ③ 클릭 → smooth scroll 로 최상단(scrollY 0) 복귀.
    await page.getByTestId("back-to-top").click();
    await expect.poll(() => scrollYOf(page), { timeout: 3000 }).toBe(0);

    // 최상단에선 다시 숨김으로 돌아온다.
    await expect.poll(() => opacityOf(page)).toBe(0);
  });

  test("임계값 부근 — 400px 이하에선 숨김 유지", async ({ page }) => {
    await page.goto(LONG_POST);
    // 350px 만 스크롤(임계값 400 미만) → 여전히 숨김.
    await page.evaluate(() => window.scrollTo(0, 350));
    await expect.poll(() => scrollYOf(page)).toBe(350);
    await expect.poll(() => opacityOf(page)).toBe(0);
  });
});
