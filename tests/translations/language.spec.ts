import { test, expect } from "@playwright/test";
import { listPostFiles } from "../../src/lib/post-files.mjs";

const koreanPath = "/blog/posts/live-code-demo/";
const englishPath = "/blog/posts/live-code-demo/en/";

test("데모의 EN/KO 전환은 주소·제목·본문과 라이브 코드 블록을 전환한다", async ({
  page,
}) => {
  await page.goto(koreanPath, { waitUntil: "domcontentloaded" });
  const languageSwitch = page.getByTestId("post-language-switch");
  await expect(languageSwitch).toHaveText("EN");
  await expect(languageSwitch).toHaveAttribute("href", englishPath);
  await expect(languageSwitch).toHaveAttribute("hreflang", "en");
  await languageSwitch.click();

  await expect(page).toHaveURL(englishPath);
  await expect(page.getByTestId("article")).toHaveAttribute("lang", "en");
  await expect(page.getByTestId("article-title")).toHaveText(
    "Live Code Block Preview",
  );
  await expect(page.getByTestId("article-body").locator("h2")).toHaveText([
    "A JavaScript Demo",
    "A CSS-Only Demo",
  ]);
  await expect(page).toHaveTitle("Live Code Block Preview · read0more");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "A draft post for checking that code blocks run directly inside the blog.",
  );
  const demos = page.locator("[data-live-code]");
  await expect(demos).toHaveCount(2);
  await expect(
    demos.first().getByRole("group", { name: "보기 모드" }),
  ).toBeVisible();
  const files = JSON.parse(
    (await demos.first().getAttribute("data-live-code"))!,
  );
  expect(JSON.stringify(files)).toContain("clicks");
  await expect(languageSwitch).toHaveText("KO");
  await languageSwitch.click();

  await expect(page).toHaveURL(koreanPath);
  await expect(page.getByTestId("article")).toHaveAttribute("lang", "ko");
  await expect(page.getByTestId("article-title")).toHaveText(
    "라이브 코드 블록 미리보기",
  );
  await expect(demos).toHaveCount(2);
  await expect(
    demos.first().getByRole("group", { name: "보기 모드" }),
  ).toBeVisible();
});

test("영어 주소 직접 접근과 새로고침에서 영어 본문이 유지된다", async ({
  page,
}) => {
  await page.goto(englishPath, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("article-title")).toHaveText(
    "Live Code Block Preview",
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("post-language-switch")).toHaveText("KO");
  await expect(page.getByTestId("article-body")).toContainText(
    "Click the button to increment the counter.",
  );
});

test("번역이 없는 글은 EN을 노출하지 않고 영어 주소도 생성하지 않는다", async ({
  page,
  request,
}) => {
  const untranslated = listPostFiles("content/posts").find(
    (file) => !file.englishFilePath,
  )!;
  await page.goto(`/blog/posts/${untranslated.slug}/`);
  await expect(page.getByTestId("article-title")).toBeVisible();
  await expect(page.getByTestId("post-language-switch")).toHaveCount(0);
  const response = await request.get(`/blog/posts/${untranslated.slug}/en/`);
  expect(response.status()).toBe(404);
  expect((await request.get(`${englishPath}extra/`)).status()).toBe(404);
});

test("목록·카테고리·검색에 데모가 한 번만 집계된다", async ({
  page,
  request,
}) => {
  const originals = listPostFiles("content/posts");
  await page.goto("/blog/");
  await expect(page.locator('[data-testid^="post-card-"]')).toHaveCount(
    originals.length,
  );
  await expect(page.getByTestId("post-card-live-code-demo")).toHaveCount(1);
  await expect(page.getByTestId("post-card-live-code-demo.en")).toHaveCount(0);

  await page.goto(`/blog/category/${encodeURIComponent("생각들")}/`);
  await expect(page.locator('[data-testid^="post-card-"]')).toHaveCount(
    originals.filter((file) => file.category === "생각들").length,
  );
  const response = await request.get("/blog/search-index.json");
  const docs = await response.json();
  expect(docs).toHaveLength(originals.length);
  expect(
    docs.filter((doc: { slug: string }) => doc.slug === "live-code-demo"),
  ).toHaveLength(1);
  expect(docs.some((doc: { slug: string }) => doc.slug.endsWith(".en"))).toBe(
    false,
  );
});
