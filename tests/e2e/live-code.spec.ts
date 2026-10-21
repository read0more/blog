import { test, expect } from "@playwright/test";

/**
 * 라이브 코드 블록: 연속된 ```lang live file=… 펜스가 하나의 Sandpack 으로 마운트되고,
 * 보기 모드(코드 + 미리보기 / 미리보기 / 코드) 버튼으로 패널이 전환되는지 본다.
 * 픽스처는 view=preview 로 시작한다.
 * 미리보기 iframe 내부(codesandbox 런타임)는 외부 네트워크에 기대므로 CI 게이트에서 제외하고
 * iframe 노출 여부까지만 단언한다.
 */
test("live 펜스 묶음이 Sandpack 으로 렌더되고 보기 모드가 전환된다", async ({
  page,
}) => {
  await page.goto("/posts/container-query/");

  const live = page.getByTestId("article-body").locator("[data-live-code]");
  await expect(live).toHaveCount(1);

  const preview = live.locator('iframe[title="Sandpack Preview"]');
  const cssTab = live.getByRole("tab", { name: "styles.css" });
  const mode = (name: string) =>
    live.getByRole("button", { name, exact: true });

  // view=preview: 미리보기만 보이고 코드는 숨겨진다.
  await expect(mode("미리보기")).toHaveAttribute("aria-pressed", "true");
  await expect(preview).toBeVisible();
  await expect(cssTab).toBeHidden();

  // 코드 + 미리보기
  await mode("코드 + 미리보기").click();
  await expect(cssTab).toBeVisible();
  await expect(live.getByRole("tab", { name: "script.js" })).toBeVisible();
  // hidden 플래그 파일은 탭에 나오지 않는다.
  await expect(live.getByRole("tab", { name: "index.html" })).toHaveCount(0);
  await expect(preview).toBeVisible();

  // 코드만
  await mode("코드").click();
  await expect(mode("코드")).toHaveAttribute("aria-pressed", "true");
  await expect(cssTab).toBeVisible();
  await expect(preview).toBeHidden();
});
