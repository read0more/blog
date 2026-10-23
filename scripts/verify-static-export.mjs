import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { listPostFiles, readPostSources } from "../src/lib/post-files.mjs";

const postsDir = path.resolve(process.env.POSTS_DIR ?? "content/posts");
const basePath = process.env.BASE_PATH ?? "";
const sources = readPostSources(postsDir, process.env.OMIT_DRAFTS === "true");
const english = sources.filter((source) => source.language === "en");
const englishHome = fs.readFileSync("out/en/index.html", "utf8");
assert.match(englishHome, /<html[^>]*lang="en"/);
assert.match(englishHome, /All posts/);
if (!english.length)
  assert.match(englishHome, /English translations are coming soon/);

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
    if (language === "en") {
      const legacy = fs.readFileSync(
        `out/posts/${source.slug}/en/index.html`,
        "utf8",
      );
      assert.ok(
        legacy.includes(
          `${basePath}/en/posts/${encodeURIComponent(source.slug)}/`,
        ),
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
    assert.equal(fs.existsSync(`out/en/posts/${file.slug}/index.html`), false);
    assert.equal(fs.existsSync(`out/posts/${file.slug}/en/index.html`), false);
  }
}
assert.ok(fs.existsSync("out/404.html"));
console.log(
  `[static-export] verified ${sources.length} pages, ${english.length} English posts, both indexes and legacy links.`,
);
