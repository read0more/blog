import { test, expect } from "@playwright/test";

test("옛 영어 주소는 브라우저에서 쿼리·해시를 보존해 이동한다", async ({
  page,
}) => {
  await page.goto(
    "/blog/posts/live-code-demo/en/?from=legacy#a-javascript-demo",
    { waitUntil: "domcontentloaded" },
  );
  await expect(page).toHaveURL(
    "/blog/en/posts/live-code-demo/?from=legacy#a-javascript-demo",
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("실제 404 응답에서 영어 홈으로 복귀할 수 있다", async ({ page }) => {
  const response = await page.goto("/blog/en/no-such-page/");
  expect(response?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("link", { name: "Back to home", exact: true }).click();
  await expect(page).toHaveURL("/blog/en/");
});

test.describe("JavaScript 없는 정적 페이지", () => {
  test.use({ javaScriptEnabled: false });

  test("언어 홈과 글·legacy 링크는 JavaScript 없이도 탐색된다", async ({
    page,
  }) => {
    await page.goto("/blog/");
    await page.getByRole("link", { name: "English", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.getByRole("link", { name: /Live Code Block Preview/ }).click();
    await expect(page).toHaveURL("/blog/en/posts/live-code-demo/");
    await expect(
      page.getByRole("heading", { name: "Live Code Block Preview" }),
    ).toBeVisible();
    await page.goto("/blog/posts/live-code-demo/en/");
    await page
      .getByRole("link", { name: "Continue to the English post" })
      .click();
    await expect(page).toHaveURL("/blog/en/posts/live-code-demo/");
  });
});
