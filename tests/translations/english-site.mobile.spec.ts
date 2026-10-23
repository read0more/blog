import { test, expect } from "@playwright/test";

test("모바일에서 언어 홈·메뉴·검색을 거쳐 글을 열고 원문으로 돌아온다", async ({
  page,
}) => {
  await page.goto("/blog/");
  await page.getByRole("link", { name: "English", exact: true }).click();
  await expect(page).toHaveURL("/blog/en/");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  const sidebar = page.getByTestId("sidebar-mobile");
  await expect(sidebar).toBeInViewport();
  await sidebar.getByRole("button", { name: "Close", exact: true }).click();
  await expect(sidebar).not.toBeInViewport();
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: /React/ })
    .click();
  await expect(page).toHaveURL("/blog/en/category/React/");
  await expect(sidebar).not.toBeInViewport();
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const overlay = page.getByTestId("mobile-search-overlay");
  await overlay.getByRole("textbox").fill("dependency");
  await overlay
    .getByRole("link", { name: /Rethinking useEffect Dependencies/ })
    .click();
  await expect(page).toHaveURL("/blog/en/posts/use-effect-deps/");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Rethinking useEffect Dependencies" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("link", { name: "한국어", exact: true }).click();
  await expect(page).toHaveURL("/blog/posts/use-effect-deps/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
});
