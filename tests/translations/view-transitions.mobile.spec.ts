import { test, expect } from "@playwright/test";
import {
  observeTransitions,
  expectPostTransition,
  resetTransitions,
} from "../helpers/view-transitions";

test("/blog 영어 목록의 제목·카테고리·날짜가 모바일 상세와 연결된다", async ({
  page,
}) => {
  await observeTransitions(page);
  await page.goto("/blog/en/posts/live-code-demo/");
  await page.getByTestId("header-wordmark").click();
  await expect(page).toHaveURL("/blog/en/");
  await expect(page.getByTestId("post-list")).toBeVisible();
  await resetTransitions(page);
  await page.getByTestId("post-card-live-code-demo").click();
  await expect(page).toHaveURL("/blog/en/posts/live-code-demo/");
  await expectPostTransition(page);
  const title = page.getByTestId("article-title");
  await expect(title).toHaveText("Live Code Block Preview");
  const bounds = await title.boundingBox();
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "test-results/view-transition-mobile.png" });
  await page.goBack();
  await expect(page).toHaveURL("/blog/en/");
  await expect(page.getByTestId("post-list")).toBeVisible();
  await resetTransitions(page);
  await page.getByTestId("post-card-live-code-demo").click();
  await expectPostTransition(page);
  await page.getByTestId("header-wordmark").click();
  await expect(page).toHaveURL("/blog/en/");
  await expectPostTransition(page, 1);
  await page.reload();
  await page.getByTestId("post-card-live-code-demo").click();
  await expect(page.getByTestId("article-title")).toBeVisible();
});
