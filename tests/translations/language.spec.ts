import { test, expect } from "@playwright/test";

test("글 언어 전환은 정적 페이지 이동·새로고침과 라이브 코드 패널을 유지한다", async ({
  page,
}) => {
  await page.goto("/blog/posts/live-code-demo/");
  await page
    .getByRole("link", { name: "Read in English", exact: true })
    .click();
  await expect(page).toHaveURL("/blog/en/posts/live-code-demo/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Live Code Block Preview" }),
  ).toBeVisible();

  const demo = page.locator("[data-live-code]").first();
  const preview = demo.locator('iframe[title="Sandpack Preview"]');
  await expect(preview).toBeVisible();
  await demo.getByRole("button", { name: "Code", exact: true }).click();
  await expect(preview).toBeHidden();
  await demo.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(preview).toBeVisible();

  await page.getByRole("link", { name: "한국어로 읽기", exact: true }).click();
  await expect(page).toHaveURL("/blog/posts/live-code-demo/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
});
