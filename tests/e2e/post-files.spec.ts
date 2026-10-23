import { test, expect } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { listPostFiles, readPostSources } from "../../src/lib/post-files.mjs";

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

function writeTranslation(draft = false) {
  const filePath = path.join(postsDir, "React/nested/example.en.md");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    `---\ntitle: "English title"\ndescription: "English description"\ndraft: ${draft}\n---\n\nEnglish body\n`,
  );
}

test("인접한 영어 번역은 같은 글로 묶이고 원문의 분류·태그·작성일을 상속한다", () => {
  writePost("React/nested/example.md");
  writeTranslation();
  expect(listPostFiles(postsDir)).toHaveLength(1);
  const sources = readPostSources(postsDir);
  expect(sources).toHaveLength(2);
  expect(sources[0]).toMatchObject({ language: "ko", hasEnglish: true });
  expect(sources[1]).toMatchObject({
    slug: "example",
    language: "en",
    category: "React",
    hasEnglish: true,
    frontmatter: {
      title: "English title",
      description: "English description",
      date: "2026-08-01",
      tags: ["Hooks"],
    },
    content: expect.stringContaining("English body"),
  });

  expect(buildSearchIndex().status).toBe(0);
  const index = JSON.parse(
    fs.readFileSync(path.join(workspace, "public/search-index.json"), "utf8"),
  );
  expect(index).toHaveLength(1);
  expect(index[0]).toMatchObject({ slug: "example", title: "테스트 글" });
  expect(index[0].text).not.toContain("English body");
});

for (const originalDraft of [false, true]) {
  for (const translationDraft of [false, true]) {
    test(`초안 공개 규칙: 원문=${originalDraft}, 번역=${translationDraft}`, () => {
      writePost("React/nested/example.md", originalDraft);
      writeTranslation(translationDraft);
      expect(
        readPostSources(postsDir).map((source) => source.language),
      ).toEqual(["ko", "en"]);
      const published = readPostSources(postsDir, true);
      expect(published.map((source) => source.language)).toEqual(
        originalDraft ? [] : translationDraft ? ["ko"] : ["ko", "en"],
      );
      if (!originalDraft)
        expect(published[0].hasEnglish).toBe(!translationDraft);
      expect(buildSearchIndex(true).status).toBe(0);
      expect(
        JSON.parse(
          fs.readFileSync(
            path.join(workspace, "public/search-index.json"),
            "utf8",
          ),
        ),
      ).toHaveLength(originalDraft ? 0 : 1);
    });
  }
}

test("다른 폴더에 원문이 있어도 인접하지 않은 번역은 오류를 낸다", () => {
  writePost("React/example.md");
  writeTranslation();
  expect(() => listPostFiles(postsDir)).toThrow(
    /requires an adjacent original/,
  );
  expect(buildSearchIndex().status).not.toBe(0);
});

test("영어 번역의 제목·설명과 draft 타입을 검증한다", () => {
  writePost("React/nested/example.md");
  writeTranslation();
  const filePath = path.join(postsDir, "React/nested/example.en.md");
  const valid = fs.readFileSync(filePath, "utf8");
  fs.writeFileSync(filePath, valid.replace('title: "English title"\n', ""));
  expect(() => readPostSources(postsDir)).toThrow(
    /example.en.md.*title\/description/,
  );
  fs.writeFileSync(filePath, valid.replace("draft: false", 'draft: "false"'));
  expect(() => readPostSources(postsDir, true)).toThrow(
    /draft must be a boolean/,
  );
});

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
