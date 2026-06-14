import { test, expect } from "@playwright/test";

/**
 * 모바일(390px) 전용 시나리오. config 의 mobile 프로젝트에서만 실행된다.
 * 햄버거 사이드바 / 검색 오버레이 / 모바일 TOC 토글을 검증한다.
 */
test.describe("모바일", () => {
  test("햄버거 — 사이드바 슬라이드 + 닫기", async ({ page }) => {
    await page.goto("/");
    // 데스크톱 사이드바는 숨겨져 있다.
    await expect(page.getByTestId("sidebar-desktop")).toBeHidden();

    const mobileSidebar = page.getByTestId("sidebar-mobile");
    await page.getByTestId("header-hamburger").click();
    await expect(mobileSidebar).toBeVisible();
    // "전체 글" 행이 보인다.
    await expect(
      mobileSidebar.getByTestId("sidebar-all"),
    ).toBeVisible();

    // 닫기 버튼.
    await page.getByTestId("sidebar-mobile-close").click();
    // transform 으로 화면 밖으로(닫힘) — 닫힘 후 첫 행 클릭 불가.
    await expect(mobileSidebar).not.toBeInViewport();
  });

  test("검색 오버레이 — 유휴 안내 → 결과 → 취소", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("header-mobile-search").click();

    const overlay = page.getByTestId("mobile-search-overlay");
    await expect(overlay).toBeVisible();
    // 유휴 안내.
    await expect(page.getByTestId("mobile-search-idle")).toBeVisible();

    // 본문 검색어 입력 → 결과.
    await page.getByTestId("mobile-search-input").fill("의존성");
    await expect(
      overlay.locator('[data-testid^="search-result-"]'),
    ).not.toHaveCount(0);
    await expect(overlay.locator("mark").first()).toHaveText("의존성");

    // 취소 → 오버레이 닫힘.
    await page.getByTestId("mobile-search-cancel").click();
    await expect(overlay).toHaveCount(0);
  });

  test("글 상세 — 모바일 TOC 토글로 목차 펼침", async ({ page }) => {
    await page.goto("/posts/use-effect-deps/");
    // 데스크톱 우측 TOC 는 숨김.
    await expect(page.getByTestId("toc")).toBeHidden();

    const mobileToc = page.getByTestId("mobile-toc");
    await expect(mobileToc).toBeVisible();
    // 펼치기 전 항목 없음.
    await expect(mobileToc.locator("a")).toHaveCount(0);
    await page.getByTestId("mobile-toc-toggle").click();
    await expect(mobileToc.locator("a")).toHaveCount(4);
  });

  test("위로가기 버튼 — 스크롤 후 노출 + 클릭 시 최상단", async ({ page }) => {
    await page.goto("/posts/use-effect-deps/");
    const fab = page.getByTestId("back-to-top");
    const opacity = () =>
      fab.evaluate((el) => Number(getComputedStyle(el).opacity));

    // 초기 숨김 → 400px 초과 스크롤(여유 있게 600) → 노출.
    await expect.poll(opacity).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 600));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(400);
    await expect.poll(opacity).toBe(1);

    // 클릭 → 최상단 복귀.
    await fab.click();
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 3000 })
      .toBe(0);
  });
});
