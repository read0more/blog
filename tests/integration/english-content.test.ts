import { afterEach, test, expect, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

test("영어 목록·분류·검색은 번역본만 사용한다", async () => {
  vi.stubEnv("POSTS_DIR", "tests/fixtures/posts");
  vi.stubEnv("OMIT_DRAFTS", "false");
  const posts = await import("../../src/lib/posts");
  expect((await posts.getAllPostMeta("en")).map((post) => post.slug)).toEqual([
    "use-effect-deps",
  ]);
  expect(await posts.getCategories("en")).toEqual([
    expect.objectContaining({ name: "React", count: 1 }),
  ]);
  expect(await posts.getPostsByCategory("CSS", "en")).toEqual([]);
  expect(await posts.getPostsByTag("이미지", "en")).toEqual([]);
  expect(await posts.getPostBySlug("container-query", "en")).toBeNull();
  expect(await posts.getSearchDocs("en")).toEqual([
    expect.objectContaining({
      slug: "use-effect-deps",
      title: "Rethinking useEffect Dependencies",
      text: expect.stringContaining("Rendering"),
    }),
  ]);
  expect(
    (await posts.getAllPostMeta()).filter(
      (post) => post.slug === "use-effect-deps",
    ),
  ).toHaveLength(1);
});

test("공개할 영어 번역이 없으면 모든 영어 목록이 비어 있다", async () => {
  vi.stubEnv("POSTS_DIR", "tests/fixtures/posts");
  vi.stubEnv("OMIT_DRAFTS", "true");
  const posts = await import("../../src/lib/posts");
  expect(await posts.getAllPostMeta("en")).toEqual([]);
  expect(await posts.getCategories("en")).toEqual([]);
  expect(await posts.getAllTags("en")).toEqual([]);
  expect(await posts.getSearchDocs("en")).toEqual([]);
});
