import { test, expect } from "@playwright/test";

/**
 * 라이브 코드 블록: 연속된 ```lang live file=… 펜스가 하나의 Sandpack 으로 마운트되는지 본다.
 * 미리보기 iframe 내부(codesandbox 런타임)는 외부 네트워크에 기대므로 CI 게이트에서 제외하고
 * iframe 존재까지만 단언한다.
 */
test("live 펜스 묶음이 Sandpack 에디터 + 미리보기로 렌더된다", async ({
  page,
}) => {
  await page.goto("/posts/container-query/");

  const live = page.getByTestId("article-body").locator("[data-live-code]");
  await expect(live).toHaveCount(1);

  await expect(live.getByRole("tab", { name: "styles.css" })).toBeVisible();
  await expect(live.getByRole("tab", { name: "script.js" })).toBeVisible();
  // hidden 플래그 파일은 탭에 나오지 않는다.
  await expect(live.getByRole("tab", { name: "index.html" })).toHaveCount(0);
  await expect(live.locator('iframe[title="Sandpack Preview"]')).toHaveCount(1);
});
