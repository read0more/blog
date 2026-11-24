import { test, expect, type Page } from "@playwright/test";

declare global {
  interface Window {
    themeBeforeBody: string | null;
  }
}

/** 문서마다 <body> 가 만들어지기 전(첫 페인트 전)에 붙은 data-theme 을 기록한다. */
async function recordThemeBeforeBody(page: Page) {
  await page.addInitScript(() => {
    window.themeBeforeBody = null;
    // 이 시점에는 <html> 이 아직 없을 수 있어 문서 전체를 본다.
    const observer = new MutationObserver(() => {
      if (!document.body)
        window.themeBeforeBody =
          document.documentElement.getAttribute("data-theme");
      observer.disconnect();
    });
    observer.observe(document, {
      subtree: true,
      attributeFilter: ["data-theme"],
    });
  });
}

// 새 문서의 <head> 스크립트는 스타일시트를 기다렸다 돌므로 기록이 생길 때까지 본다.
const themeBeforeBody = (page: Page) =>
  expect.poll(() => page.evaluate(() => window.themeBeforeBody));

const DARK = "rgb(17, 17, 19)";
const LIGHT = "rgb(255, 255, 255)";

// 첫 페인트 전 스크립트·localStorage·CSS 캐스케이드는 실제 브라우저 문서 로드에서만 함께 확인된다.
test("시스템 다크면 처음부터 어둡고, 고른 테마는 새로고침과 언어 이동 뒤에도 남는다", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await recordThemeBeforeBody(page);
  const html = page.locator("html");
  const body = page.locator("body");
  const toggle = page.getByTestId("theme-toggle");

  await page.goto("/blog/posts/use-effect-deps/");
  await themeBeforeBody(page).toBe("dark");
  await expect(body).toHaveCSS("background-color", DARK);

  // 라벨이 실제 테마를 따라 바뀌었으면 hydration 이 끝나 버튼이 동작한다.
  await expect(toggle).toHaveAccessibleName("라이트 모드로 전환");
  await toggle.click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await expect(body).toHaveCSS("background-color", LIGHT);

  // 시스템은 여전히 다크지만 저장한 라이트가 첫 페인트부터 이긴다.
  await page.reload();
  await themeBeforeBody(page).toBe("light");
  await expect(body).toHaveCSS("background-color", LIGHT);

  // 언어 루트 사이 이동은 새 문서를 연다.
  await page.getByTestId("site-language-switch").click();
  await expect(page).toHaveURL("/blog/en/posts/use-effect-deps/");
  await expect(html).toHaveAttribute("lang", "en");
  await themeBeforeBody(page).toBe("light");
  await expect(body).toHaveCSS("background-color", LIGHT);
});
