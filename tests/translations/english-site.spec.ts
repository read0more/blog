import { test, expect } from "@playwright/test";

test("옛 영어 주소는 브라우저에서 쿼리·해시를 보존해 이동한다", async ({
  page,
}) => {
  await page.goto(
    "/blog/posts/use-effect-deps/en/?from=legacy#avoid-unstable-references",
    { waitUntil: "domcontentloaded" },
  );
  await expect(page).toHaveURL(
    "/blog/en/posts/use-effect-deps/?from=legacy#avoid-unstable-references",
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
