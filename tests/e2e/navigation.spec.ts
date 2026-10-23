import { test, expect } from "@playwright/test";

// 실제 정적 URL, 한글 경로, Next 링크와 새로고침은 RTL에서 보증할 수 없다.
test("카테고리에서 글을 읽고 한글 태그 목록을 새로고침할 수 있다", async ({
  page,
}) => {
  await page.goto("/blog/");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: /성능/ })
    .click();
  await expect(page).toHaveURL(`/blog/category/${encodeURIComponent("성능")}/`);
  await page.getByRole("link", { name: /히어로 이미지로 망가진 LCP/ }).click();
  await expect(page).toHaveURL("/blog/posts/image-lcp/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "히어로 이미지로 망가진 LCP를 1.2초 줄인 과정",
  );
  await page
    .getByRole("article")
    .getByRole("link", { name: "#이미지" })
    .click();
  await expect(page).toHaveURL(`/blog/tag/${encodeURIComponent("이미지")}/`);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("#이미지");
  await expect(
    page.getByRole("link", { name: /히어로 이미지로 망가진 LCP/ }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL("/blog/posts/image-lcp/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "히어로 이미지로 망가진 LCP를 1.2초 줄인 과정",
  );
});
