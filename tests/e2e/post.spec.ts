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

// 목차의 자체 스크롤과 스크롤 가두기는 실제 레이아웃과 휠 입력이 있어야 확인된다.
test("목차는 본문 오른쪽에 있고, 창보다 길 때만 휠이 목차 안에 머문다", async ({
  page,
}) => {
  await page.goto("/blog/posts/use-effect-deps/");
  const body = page.getByTestId("article-body");
  const toc = page.getByTestId("toc");
  await expect(toc).toBeVisible();
  const bodyBox = await body.boundingBox();
  const tocBox = await toc.boundingBox();
  expect(tocBox!.x).toBeGreaterThanOrEqual(bodyBox!.x + bodyBox!.width);

  const pageY = () => page.evaluate(() => window.scrollY);
  const tocY = () => toc.evaluate((el) => el.scrollTop);
  // 목차가 헤더 아래에 붙은 상태로 만들고 그 위에 커서를 둔다.
  const hoverStuckToc = async () => {
    await body.evaluate((el) =>
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY,
        behavior: "instant",
      }),
    );
    const box = await toc.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    return pageY();
  };

  // 넘치지 않는 목차: 휠은 평소처럼 페이지를 굴린다.
  const before = await hoverStuckToc();
  await page.mouse.wheel(0, 300);
  await expect.poll(pageY).toBeGreaterThan(before);

  // 창을 낮춰 목차가 넘치게 하면 휠은 목차만 굴리고, 끝에 닿아도 페이지로 넘어가지 않는다.
  await page.setViewportSize({ width: 1280, height: 300 });
  await expect(toc).toHaveAttribute("data-overflowing", "");
  const stuck = await hoverStuckToc();
  await page.mouse.wheel(0, 100);
  await expect.poll(tocY).toBeGreaterThan(0);
  const tocRemaining = () =>
    toc.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop);
  await page.mouse.wheel(0, 5000);
  await expect.poll(tocRemaining).toBeLessThanOrEqual(1);
  // 한 번의 휠 제스처는 처음 잡은 스크롤 영역에 묶여 있어 원래 페이지로 넘어가지 않는다.
  // 커서를 움직여 묶임을 풀고, 이미 끝에 닿은 목차 위에서 새 제스처로 다시 내린다.
  const box = await toc.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2 + 2, box!.y + box!.height / 2);
  // 휠 이벤트가 문서에 도착한 것을 세어, 처리된 뒤에 페이지 위치를 본다.
  const wheels = () =>
    page.evaluate(() => Number(document.documentElement.dataset.wheels ?? 0));
  await page.evaluate(() =>
    window.addEventListener(
      "wheel",
      () => {
        const data = document.documentElement.dataset;
        data.wheels = String(Number(data.wheels ?? 0) + 1);
      },
      { passive: true },
    ),
  );
  await page.mouse.wheel(0, 300);
  await expect.poll(wheels).toBeGreaterThan(0);
  // 페이지로 넘어갔다면 스크롤이 시작됐을 두 프레임을 준다.
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  expect(await pageY()).toBe(stuck);
  expect(
    await toc.evaluate((el: HTMLElement) => el.offsetWidth - el.clientWidth),
    "스크롤바가 자리를 차지하지 않는다",
  ).toBe(0);
});
