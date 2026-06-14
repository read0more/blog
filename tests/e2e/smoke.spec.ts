import { test, expect } from "@playwright/test";

/** 셋업 검증용 스모크 — 홈이 뜨고 헤더/사이드바/글목록이 렌더되는지. */
test("home renders shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("app-header")).toBeVisible();
  await expect(page.getByTestId("post-list")).toBeVisible();
});
