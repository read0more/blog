import { test, expect } from "@playwright/test";
import {
  observeTransitions,
  expectTitleTransition,
  resetTransitions,
} from "../helpers/view-transitions";

for (const list of ["/", "/category/React/", "/tag/Hooks/"]) {
  test(`${list}의 제목이 상세와 연결되고 뒤로가기로 복귀한다`, async ({
    page,
  }) => {
    await observeTransitions(page);
    // 상세를 먼저 방문해 프리패치 완료 시점에 의존하지 않는 캐시를 만든다.
    await page.goto("/posts/use-effect-deps/");
    await page.getByTestId("header-wordmark").click();
    await expect(page).toHaveURL("/");
    await resetTransitions(page);
    if (list !== "/") {
      const link = page.locator(`a[href="${list}"]`).first();
      await link.click();
      await expect(page).toHaveURL(list);
    }
    await expect(page.getByTestId("post-list")).toBeVisible();
    await resetTransitions(page);
    await page.getByTestId("post-card-use-effect-deps").click();
    await expect(page.getByTestId("article-title")).toBeVisible();
    await expectTitleTransition(page);
    await page.goBack();
    await expect(page).toHaveURL(list);
    await expect(page.getByTestId("post-list")).toBeVisible();
    // popstate는 즉시 복원될 수 있다. 링크로 돌아갈 때의 역방향 공유 전환을 확인한다.
    await resetTransitions(page);
    await page.getByTestId("post-card-use-effect-deps").click();
    await expectTitleTransition(page);
    const backLink =
      list === "/"
        ? page.getByTestId("header-wordmark")
        : page.getByTestId("article").locator(`a[href="${list}"]`).first();
    await backLink.click();
    await expect(page).toHaveURL(list);
    await expectTitleTransition(page, 1);
    if (list === "/") {
      await page.screenshot({
        path: "test-results/view-transition-desktop.png",
      });
    }
  });
}

test("모션 감소 설정은 제목 전환의 애니메이션을 끈다", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await observeTransitions(page);
  await page.goto("/posts/use-effect-deps/");
  await page.getByTestId("header-wordmark").click();
  await expect(page).toHaveURL("/");
  await expect(page.getByTestId("post-list")).toBeVisible();
  await resetTransitions(page);
  await page.getByTestId("post-card-use-effect-deps").click();
  await expect(page.getByTestId("article-title")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.postTransitions[0]?.finished))
    .toBe(true);
  const records = await page.evaluate(() => window.postTransitions);
  expect(records[0].error).toBeUndefined();
  expect(records[0].durations.every((duration) => duration === 0)).toBe(true);
});

test("View Transitions 미지원 브라우저에서도 탐색과 본문 기능이 동작한다", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(document, "startViewTransition", {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto("/");
  await page.getByTestId("post-card-use-effect-deps").click();
  await expect(page).toHaveURL("/posts/use-effect-deps/");
  await expect(page.getByTestId("code-copy").first()).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId("post-list")).toBeVisible();
  expect(errors).toEqual([]);
});
