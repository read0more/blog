import { test, expect } from "@playwright/test";
import {
  observeTransitions,
  expectTitleTransition,
  resetTransitions,
} from "../helpers/view-transitions";

test("/blog 영어 목록의 긴 제목이 모바일 상세와 연결된다", async ({ page }) => {
  await observeTransitions(page);
  await page.goto("/blog/en/posts/view-transition-demo/");
  await page.getByTestId("header-wordmark").click();
  await expect(page).toHaveURL("/blog/en/");
  await expect(page.getByTestId("post-list")).toBeVisible();
  await resetTransitions(page);
  await page.getByTestId("post-card-view-transition-demo").click();
  await expect(page).toHaveURL("/blog/en/posts/view-transition-demo/");
  await expectTitleTransition(page);
  const title = page.getByTestId("article-title");
  const bounds = await title.boundingBox();
  expect(bounds!.height).toBeGreaterThan(60);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "test-results/view-transition-mobile.png" });
  await page.goBack();
  await expect(page).toHaveURL("/blog/en/");
  await expect(page.getByTestId("post-list")).toBeVisible();
  await resetTransitions(page);
  await page.getByTestId("post-card-view-transition-demo").click();
  await expectTitleTransition(page);
  await page.getByTestId("header-wordmark").click();
  await expect(page).toHaveURL("/blog/en/");
  await expectTitleTransition(page, 1);
  await page.reload();
  await page.getByTestId("post-card-view-transition-demo").click();
  await expect(page.getByTestId("article-title")).toBeVisible();
});
