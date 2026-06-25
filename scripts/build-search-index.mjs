/**
 * 빌드타임 검색 인덱스 생성기.
 * content/posts 의 모든 글에서 제목 + 설명 + 본문 plaintext 를 뽑아
 * public/search-index.json 으로 쓴다. 클라이언트 검색이 이 파일을
 * (basePath 가 붙은 경로로) fetch 해 사용한다.
 *
 * 본문 렌더 파이프라인(shiki 등)과 무관하게 plaintext 만 추출하면 되므로,
 * 여기서는 remark 만으로 가볍게 본문 텍스트를 모은다.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";

// posts.ts 와 동일하게 POSTS_DIR 오버라이드 지원(E2E 고정 픽스처용).
const POSTS_DIR = process.env.POSTS_DIR
  ? path.resolve(process.env.POSTS_DIR)
  : path.join(process.cwd(), "content", "posts");
const OUT_FILE = path.join(process.cwd(), "public", "search-index.json");

function extractPlainText(markdown) {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  const parts = [];
  visit(tree, "text", (node) => parts.push(node.value));
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function build() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.warn(
      `[search-index] no posts dir at ${POSTS_DIR}, writing empty index.`,
    );
    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, "[]");
    return;
  }

  // 배포 빌드(OMIT_DRAFTS=true)에서는 draft 글을 검색 인덱스에서도 제외한다.
  const omitDrafts = process.env.OMIT_DRAFTS === "true";

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  const docs = files
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
      const { data, content } = matter(raw);
      if (omitDrafts && data.draft === true) return null;
      const plain = extractPlainText(content);
      // posts.ts 와 동일하게 category 를 string[] 로 정규화한다(단일 문자열도 허용).
      const categories = Array.isArray(data.category)
        ? data.category
        : [data.category];
      return {
        slug,
        title: data.title,
        description: data.description,
        categories,
        date: data.date,
        text: `${data.title} ${data.description} ${plain}`,
      };
    })
    .filter(Boolean);

  // 최신순으로 정렬해두면 클라이언트가 동점 결과를 자연스러운 순서로 보여줄 수 있다.
  docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(docs));
  console.log(`[search-index] wrote ${docs.length} docs to ${OUT_FILE}`);
}

build();
