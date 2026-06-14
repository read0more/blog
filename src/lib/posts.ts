import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { renderMarkdown } from "./markdown";
import { readingMinutes } from "./reading-time";
import { categoryColor } from "./categories";
import type {
  Post,
  PostMeta,
  PostFrontmatter,
  Category,
  SearchDoc,
} from "./types";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

/** 디자인의 카테고리 표시 순서. 목록에 없는 새 카테고리는 뒤에 가나다순으로 붙는다. */
const CATEGORY_ORDER = ["React", "CSS", "TypeScript", "성능", "빌드도구"];

function frontmatterOf(data: Record<string, unknown>, slug: string): PostFrontmatter {
  const { title, date, description, category } = data;
  if (
    typeof title !== "string" ||
    typeof date !== "string" ||
    typeof description !== "string" ||
    typeof category !== "string"
  ) {
    throw new Error(
      `Invalid frontmatter in "${slug}.md": title/date/description/category are all required strings.`,
    );
  }
  if (typeof data.draft !== "undefined" && typeof data.draft !== "boolean") {
    throw new Error(`Invalid frontmatter in "${slug}.md": draft must be a boolean.`);
  }
  return {
    title,
    date,
    description,
    category,
    ...(typeof data.draft === "boolean" ? { draft: data.draft } : {}),
  };
}

/**
 * content/posts/*.md 를 모두 읽어 렌더된 Post[] 를 만든다.
 * 빌드 중 여러 번 호출되므로 결과를 모듈 캐시에 보관한다.
 */
let cache: Post[] | null = null;

async function loadAllPosts(): Promise<Post[]> {
  if (cache) return cache;

  if (!fs.existsSync(POSTS_DIR)) {
    cache = [];
    return cache;
  }

  // 배포(GitHub Actions) 빌드에서만 OMIT_DRAFTS=true 로 draft 글을 제외한다.
  // 로컬 dev/build/E2E 에서는 미설정이라 draft 글도 그대로 노출된다.
  const omitDrafts = process.env.OMIT_DRAFTS === "true";

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));

  const loaded = await Promise.all(
    files.map(async (file): Promise<Post | null> => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
      const { data, content } = matter(raw);
      const fm = frontmatterOf(data, slug);
      // draft 판정은 렌더 전에 — 제외 대상이면 마크다운 렌더도 건너뛴다.
      if (omitDrafts && fm.draft) return null;
      const { html, toc, plainText } = await renderMarkdown(content);

      // 읽는 시간은 제목 + 설명 + 본문 plaintext 기준(디자인 plainOf 와 동일 범위).
      const readingMin = readingMinutes(`${fm.title} ${fm.description} ${plainText}`);

      return {
        slug,
        title: fm.title,
        date: fm.date,
        description: fm.description,
        category: fm.category,
        readingMinutes: readingMin,
        contentHtml: html,
        toc,
        plainText,
      };
    }),
  );

  const posts = loaded.filter((p): p is Post => p !== null);

  // 최신순 정렬(date 내림차순).
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  cache = posts;
  return cache;
}

function toMeta(p: Post): PostMeta {
  const { slug, title, date, description, category, readingMinutes } = p;
  return { slug, title, date, description, category, readingMinutes };
}

/** 전체 글 메타(최신순). 목록/홈에서 사용. */
export async function getAllPostMeta(): Promise<PostMeta[]> {
  const posts = await loadAllPosts();
  return posts.map(toMeta);
}

/** slug 로 글 상세(본문 HTML + TOC 포함) 조회. */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await loadAllPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

/** generateStaticParams 용 전체 slug. */
export async function getAllSlugs(): Promise<string[]> {
  const posts = await loadAllPosts();
  return posts.map((p) => p.slug);
}

/**
 * 카테고리 자동 수집 — frontmatter category 를 distinct 수집하고
 * 글 개수와 결정적 색상을 붙인다. CATEGORY_ORDER 우선, 나머지는 가나다순.
 */
export async function getCategories(): Promise<Category[]> {
  const posts = await loadAllPosts();
  const counts = new Map<string, number>();
  for (const p of posts) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }

  const names = [...counts.keys()].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b, "ko");
  });

  return names.map((name) => ({
    name,
    count: counts.get(name) ?? 0,
    color: categoryColor(name),
  }));
}

/** 특정 카테고리의 글 메타(최신순). */
export async function getPostsByCategory(category: string): Promise<PostMeta[]> {
  const posts = await loadAllPosts();
  return posts.filter((p) => p.category === category).map(toMeta);
}

/**
 * 검색 인덱스(클라이언트 검색용) — 제목 + 설명 + 본문 plaintext.
 * 빌드타임에 search-index.json 으로 직렬화한다.
 */
export async function getSearchDocs(): Promise<SearchDoc[]> {
  const posts = await loadAllPosts();
  return posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    category: p.category,
    text: `${p.title} ${p.description} ${p.plainText}`,
  }));
}
