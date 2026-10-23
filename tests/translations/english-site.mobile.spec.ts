import { test, expect } from "@playwright/test";

test("모바일에서 언어 홈·메뉴·검색을 거쳐 글을 열고 원문으로 돌아온다", async ({
  page,
}) => {
  await page.goto("/blog/");
  await page.getByRole("link", { name: "English", exact: true }).click();
  await expect(page).toHaveURL("/blog/en/");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: /Thoughts/ })
    .click();
  await expect(page).toHaveURL(
    `/blog/en/category/${encodeURIComponent("생각들")}/`,
  );
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const overlay = page.getByTestId("mobile-search-overlay");
  await overlay.getByRole("textbox").fill("counter");
  await overlay.getByRole("link", { name: /Live Code Block Preview/ }).click();
  await expect(page).toHaveURL("/blog/en/posts/live-code-demo/");
  await page.getByRole("link", { name: "한국어", exact: true }).click();
  await expect(page).toHaveURL("/blog/posts/live-code-demo/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
});
