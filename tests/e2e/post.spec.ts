import { test, expect } from "@playwright/test";

// 실제 레이아웃과 입력 후 scroll-spy 잠금 해제를 함께 검증한다.
test("목차로 이동한 뒤 직접 스크롤하면 끝까지 추적하고 맨 위로 돌아온다", async ({
  page,
}) => {
  await page.goto("/blog/posts/use-effect-deps/");
  const body = page.getByTestId("article-body");
  const toc = page.getByTestId("toc");
  const target = body.getByRole("heading", {
    name: "흔한 실수: 객체와 함수를 그대로 넣기",
  });
  const item = toc.getByRole("link", {
    name: "흔한 실수: 객체와 함수를 그대로 넣기",
  });
  await expect(toc).toBeVisible();
  await item.click();
  const targetId = await target.getAttribute("id");
  await expect
    .poll(() => decodeURIComponent(new URL(page.url()).hash))
    .toBe(`#${targetId}`);
  await expect
    .poll(() => target.evaluate((el) => el.getBoundingClientRect().top))
    .toBeLessThan(120);
  expect(
    await target.evaluate((el) => el.getBoundingClientRect().top),
  ).toBeGreaterThanOrEqual(0);
  await expect(item).toHaveAttribute("aria-current", "true");

  // 임의 휠 이동량에 기대지 않고, 사용자 키 입력으로 문서 끝에 도달했는지 먼저 확인한다.
  // 이 입력은 목차 클릭으로 생긴 scroll-spy 잠금도 풀어야 한다.
  await page.keyboard.press("End");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollHeight -
          window.innerHeight -
          window.scrollY,
      ),
    )
    .toBeLessThanOrEqual(1);
  await expect(
    toc.getByRole("link", { name: "정리: 세 가지 규칙" }),
  ).toHaveAttribute("aria-current", "true");
  const top = page.getByRole("button", { name: "맨 위로" });
  await expect(top).toHaveCSS("opacity", "1");
  await top.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(top).toHaveCSS("opacity", "0");
});
