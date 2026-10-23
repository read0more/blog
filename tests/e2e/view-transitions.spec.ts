import { test, expect } from "@playwright/test";
import {
  observeTransitions,
  resetTransitions,
} from "../helpers/view-transitions";

test("모션 감소 설정은 공유 요소 전환의 애니메이션을 끈다", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await observeTransitions(page);
  await page.goto("/blog/posts/use-effect-deps/");
  await page.getByTestId("header-wordmark").click();
  await expect(page).toHaveURL("/blog/");
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
