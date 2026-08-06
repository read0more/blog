import { test, expect } from "@playwright/test";

test.describe("이미지 라이트박스", () => {
  test("본문 이미지 클릭 → 라이트박스가 열리고 ESC로 닫힌다", async ({
    page,
  }) => {
    await page.goto("/posts/image-lcp/");

    const img = page
      .getByTestId("article-body")
      .locator("figure.md-figure img");
    await expect(img).toHaveCount(1);

    await img.first().click();

    // PhotoSwipe 는 body 하위에 .pswp 를 붙이고 열린다.
    await expect(page.locator(".pswp")).toBeVisible();

    // PhotoSwipe 내부의 close()는 `opener.isOpen` 가드를 통과해야 실제로 닫힌다. 이
    // 플래그는 열기 애니메이션(기본 333ms)이 끝나는 시점(openingAnimationEnd)에야
    // true 로 바뀌므로, 애니메이션 도중에 Esc 를 누르거나 닫기 버튼을 클릭해도 close()가
    // 조용히 no-op 되어 버린다(키보드 리스너 자체도 같은 시점에 바인딩됨). `.pswp`가
    // visible 해지는 시점과 opener.isOpen 이 true 가 되는 시점 사이에 DOM으로 관찰 가능한
    // 신호가 없어, 애니메이션 지속시간에 여유를 더한 시간만큼 기다린 뒤 닫는다.
    await page.waitForTimeout(500);
    await page.keyboard.press("Escape");

    // 닫히면 PhotoSwipe 가 DOM 을 제거한다.
    await expect(page.locator(".pswp")).toHaveCount(0);
  });
});
