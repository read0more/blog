import { test, expect } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { listPostFiles } from "../../src/lib/post-files.mjs";

const indexScript = path.resolve("scripts/build-search-index.mjs");
let workspace: string;
let postsDir: string;

test.beforeEach(() => {
  workspace = fs.mkdtempSync(path.join(os.tmpdir(), "blog-post-files-"));
  postsDir = path.join(workspace, "posts");
});

test.afterEach(() => {
  fs.rmSync(workspace, { recursive: true, force: true });
});

function writePost(relativePath: string, draft = false) {
  const filePath = path.join(postsDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    `---\ntitle: "테스트 글"\ndate: "2026-08-01"\ndescription: "설명"\ntags: ["Hooks"]\ndraft: ${draft}\n---\n\n검색할 본문\n`,
  );
}

function buildSearchIndex(omitDrafts = false) {
  return spawnSync(process.execPath, [indexScript], {
    cwd: workspace,
    encoding: "utf8",
    env: {
      ...process.env,
      POSTS_DIR: postsDir,
      OMIT_DRAFTS: String(omitDrafts),
    },
  });
}

test("중첩 폴더와 폴더 이동은 카테고리만 결정하고 slug는 유지한다", () => {
  writePost("루프팩과정/wil/round1.md");
  fs.writeFileSync(path.join(postsDir, "루프팩과정", "notes.txt"), "메모");
  expect(listPostFiles(postsDir)).toEqual([
    {
      filePath: path.join(postsDir, "루프팩과정/wil/round1.md"),
      slug: "round1",
      category: "루프팩과정",
    },
  ]);

  fs.renameSync(
    path.join(postsDir, "루프팩과정"),
    path.join(postsDir, "생각들"),
  );
  expect(listPostFiles(postsDir)[0]).toMatchObject({
    slug: "round1",
    category: "생각들",
  });
});

test("중복 slug는 초안 제외 여부와 무관하게 두 경로를 포함한 오류를 낸다", () => {
  writePost("React/shared.md");
  writePost("생각들/nested/shared.md", true);

  expect(() => listPostFiles(postsDir)).toThrow(/Duplicate post slug "shared"/);
  const result = buildSearchIndex(true);
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("React/shared.md");
  expect(result.stderr).toContain("생각들/nested/shared.md");
});

test("카테고리 폴더 없이 루트에 둔 글은 빌드 오류를 낸다", () => {
  writePost("uncategorized.md");
  expect(() => listPostFiles(postsDir)).toThrow(
    /uncategorized.md.*must be inside a category directory/,
  );
  const result = buildSearchIndex();
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("<category>/uncategorized.md");
});

test("검색 인덱스도 디렉토리 카테고리, 태그, 초안 제외 규칙을 적용한다", () => {
  writePost("루프팩과정/wil/published.md");
  writePost("생각들/nested/draft.md", true);

  expect(buildSearchIndex().status).toBe(0);
  const indexPath = path.join(workspace, "public/search-index.json");
  expect(JSON.parse(fs.readFileSync(indexPath, "utf8"))).toHaveLength(2);

  expect(buildSearchIndex(true).status).toBe(0);
  expect(JSON.parse(fs.readFileSync(indexPath, "utf8"))).toEqual([
    expect.objectContaining({
      slug: "published",
      categories: ["루프팩과정"],
      tags: ["Hooks"],
      text: expect.stringContaining("검색할 본문 Hooks"),
    }),
  ]);
});

test("포스트 디렉토리가 없으면 빈 목록과 검색 인덱스를 만든다", () => {
  expect(listPostFiles(postsDir)).toEqual([]);
  expect(buildSearchIndex().status).toBe(0);
  expect(
    JSON.parse(
      fs.readFileSync(path.join(workspace, "public/search-index.json"), "utf8"),
    ),
  ).toEqual([]);
});
