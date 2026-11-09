import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import { listPostFiles, readPostSources } from "../src/lib/post-files.mjs";

const postsDir = path.resolve(process.env.POSTS_DIR ?? "content/posts");
const basePath = process.env.BASE_PATH ?? "";
const sources = readPostSources(postsDir, process.env.OMIT_DRAFTS === "true");
const english = sources.filter((source) => source.language === "en");
const originals = sources.filter((source) => source.language === "ko");
const englishHome = fs.readFileSync("out/en/index.html", "utf8");
assert.match(englishHome, /<html[^>]*lang="en"/);
assert.match(englishHome, /All posts/);
if (!english.length)
  assert.match(englishHome, /English translations are coming soon/);

// JS를 실행하지 않은 실제 export HTML에서 읽기·언어 이동 링크를 확인한다.
// 문자열 includes는 Next의 직렬화 스크립트만 맞아도 통과할 수 있어 DOM을 사용한다.
function staticDocument(html) {
  return new JSDOM(html).window.document;
}
function assertLink(document, href) {
  assert.ok(
    Array.from(document.querySelectorAll("a")).some(
      (link) => link.getAttribute("href") === href,
    ),
    `Missing static link: ${href}`,
  );
}
assert.equal(
  staticDocument(englishHome).querySelector("h1")?.textContent,
  "All posts",
);
assertLink(
  staticDocument(fs.readFileSync("out/index.html", "utf8")),
  `${basePath}/en/`,
);

for (const language of ["ko", "en"]) {
  const expected = sources.filter((source) => source.language === language);
  const index = JSON.parse(
    fs.readFileSync(
      `out/search-index${language === "en" ? ".en" : ""}.json`,
      "utf8",
    ),
  );
  assert.deepEqual(
    index.map((doc) => doc.slug).sort(),
    expected.map((source) => source.slug).sort(),
  );
  for (const source of expected) {
    const prefix = language === "en" ? "en/" : "";
    const html = fs.readFileSync(
      `out/${prefix}posts/${source.slug}/index.html`,
      "utf8",
    );
    assert.ok(html.includes(`lang="${language}"`));
    const document = staticDocument(html);
    // 공유 미리보기: og:image는 절대 주소이고, 가리키는 PNG가 실제로 export돼 있어야 한다.
    const ogImage = document
      .querySelector('meta[property="og:image"]')
      ?.getAttribute("content");
    assert.ok(
      ogImage?.startsWith("https://") &&
        ogImage.endsWith(
          `${basePath}/og/${language}/${encodeURIComponent(source.slug)}.png`,
        ),
      `Missing og:image: ${language}/${source.slug} (${ogImage})`,
    );
    assert.equal(
      fs
        .readFileSync(`out/og/${language}/${source.slug}.png`)
        .subarray(1, 4)
        .toString(),
      "PNG",
    );
    if (language === "en") {
      assert.equal(
        document.querySelector("article h1")?.textContent,
        source.frontmatter.title,
      );
      assertLink(
        document,
        `${basePath}/posts/${encodeURIComponent(source.slug)}/`,
      );
      const legacy = fs.readFileSync(
        `out/posts/${source.slug}/en/index.html`,
        "utf8",
      );
      assert.ok(
        legacy.includes(
          `${basePath}/en/posts/${encodeURIComponent(source.slug)}/`,
        ),
      );
      assertLink(
        staticDocument(legacy),
        `${basePath}/en/posts/${encodeURIComponent(source.slug)}/`,
      );
      for (const [kind, names] of [
        ["category", [source.category]],
        ["tag", source.frontmatter.tags],
      ]) {
        for (const name of names)
          assert.ok(fs.existsSync(`out/en/${kind}/${name}/index.html`));
      }
    }
  }
}

for (const file of listPostFiles(postsDir)) {
  if (!english.some((source) => source.slug === file.slug)) {
    const englishPath = `out/en/posts/${file.slug}/index.html`;
    if (originals.some((source) => source.slug === file.slug)) {
      const notice = fs.readFileSync(englishPath, "utf8");
      assert.match(notice, /<html[^>]*lang="en"/);
      assert.match(notice, /data-testid="translation-unavailable"/);
      assert.match(notice, /<meta name="robots" content="noindex/);
      assert.doesNotMatch(notice, /<article\b/);
      assert.equal(fs.existsSync(`out/og/en/${file.slug}.png`), false);
      assert.ok(
        notice.includes(`${basePath}/posts/${encodeURIComponent(file.slug)}/`),
      );
    } else {
      assert.equal(fs.existsSync(englishPath), false);
    }
    assert.equal(fs.existsSync(`out/posts/${file.slug}/en/index.html`), false);
  }
}
assert.ok(fs.existsSync("out/404.html"));
assert.ok(fs.existsSync("out/og/ko/index.png"));
assert.ok(fs.existsSync("out/og/en/index.png"));
console.log(
  `[static-export] verified ${sources.length} pages, ${english.length} English posts, both indexes and legacy links.`,
);
