import path from "node:path";
import { renderMarkdown } from "./markdown";
import { readingMinutes } from "./reading-time";
import { categoryColor } from "./categories";
import { readPostSources } from "./post-files.mjs";
import { tagLabel } from "./taxonomy.mjs";
import type {
  Post,
  PostMeta,
  PostLanguage,
  Category,
  SearchDoc,
} from "./types";

// 기본은 content/posts(실제 글). E2E 등에서 POSTS_DIR 로 고정 픽스처 디렉토리를 주입할 수 있다.
const POSTS_DIR = process.env.POSTS_DIR
  ? path.resolve(process.env.POSTS_DIR)
  : path.join(process.cwd(), "content", "posts");

/** 디자인의 카테고리 표시 순서. 목록에 없는 새 카테고리는 뒤에 가나다순으로 붙는다. */
const CATEGORY_ORDER = ["React", "CSS", "TypeScript", "성능", "빌드도구"];

/**
 * content/posts 의 카테고리 디렉토리 아래 .md 를 모두 읽어 렌더된 Post[] 를 만든다.
 * 빌드 중 여러 번 호출되므로 결과를 모듈 캐시에 보관한다.
 */
let cache: Post[] | null = null;

async function loadAllPosts(): Promise<Post[]> {
  // dev 에서는 캐시를 건너뛰어 md 수정이 새로고침마다 반영되게 한다.
  // (content/posts 는 webpack 모듈 그래프 밖이라 빌드타임 캐시가 그대로 남으면 변경이 안 보임)
  if (cache && process.env.NODE_ENV !== "development") return cache;

  // 배포(GitHub Actions) 빌드에서만 OMIT_DRAFTS=true 로 draft 글을 제외한다.
  // 로컬 dev/build/E2E 에서는 미설정이라 draft 글도 그대로 노출된다.
  const omitDrafts = process.env.OMIT_DRAFTS === "true";

  const sources = readPostSources(POSTS_DIR, omitDrafts);

  const loaded = await Promise.all(
    sources.map(
      async ({
        slug,
        category,
        language,
        hasEnglish,
        frontmatter: fm,
        content,
      }): Promise<Post> => {
        const { html, toc, plainText } = await renderMarkdown(content);

        // 읽는 시간은 제목 + 설명 + 본문 plaintext 기준(디자인 plainOf 와 동일 범위).
        const readingMin = readingMinutes(
          `${fm.title} ${fm.description} ${plainText}`,
        );

        return {
          slug,
          language,
          hasEnglish,
          title: fm.title,
          date: fm.date,
          description: fm.description,
          categories: [category],
          tags: fm.tags,
          readingMinutes: readingMin,
          contentHtml: html,
          toc,
          plainText,
        };
      },
    ),
  );

  const posts = loaded;

  // 최신순 정렬(date 내림차순).
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  cache = posts;
  return cache;
}

async function loadPosts(language: PostLanguage): Promise<Post[]> {
  return (await loadAllPosts()).filter((post) => post.language === language);
}

function toMeta(p: Post): PostMeta {
  const { slug, title, date, description, categories, tags, readingMinutes } =
    p;
  return { slug, title, date, description, categories, tags, readingMinutes };
}

/** 전체 글 메타(최신순). 목록/홈에서 사용. */
export async function getAllPostMeta(
  language: PostLanguage = "ko",
): Promise<PostMeta[]> {
  const posts = await loadPosts(language);
  return posts.map(toMeta);
}

/** slug 로 글 상세(본문 HTML + TOC 포함) 조회. */
export async function getPostBySlug(
  slug: string,
  language: PostLanguage = "ko",
): Promise<Post | null> {
  const posts = await loadAllPosts();
  return (
    posts.find((post) => post.slug === slug && post.language === language) ??
    null
  );
}

/** generateStaticParams 용 전체 slug. */
export async function getAllPostRoutes(): Promise<{ slug: string[] }[]> {
  const posts = await loadAllPosts();
  return posts.map((post) => ({
    slug: post.language === "en" ? [post.slug, "en"] : [post.slug],
  }));
}

/**
 * 카테고리 자동 수집 — 최상위 디렉토리 이름을 distinct 수집하고
 * 글 개수와 결정적 색상을 붙인다. CATEGORY_ORDER 우선, 나머지는 가나다순.
 */
export async function getCategories(
  language: PostLanguage = "ko",
): Promise<Category[]> {
  const posts = await loadPosts(language);
  const counts = new Map<string, number>();
  for (const p of posts) {
    for (const name of p.categories) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
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
export async function getPostsByCategory(
  category: string,
  language: PostLanguage = "ko",
): Promise<PostMeta[]> {
  const posts = await loadPosts(language);
  return posts.filter((p) => p.categories.includes(category)).map(toMeta);
}

/**
 * 주어진 글들에 달린 태그를 distinct 수집한다 — 글 수 내림차순, 동률은 가나다순.
 * 목록 상단의 태그 줄(홈/카테고리/태그 페이지)에 쓴다.
 */
export function tagsOf(posts: PostMeta[]): string[] {
  const counts = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.keys()].sort(
    (a, b) =>
      (counts.get(b) ?? 0) - (counts.get(a) ?? 0) || a.localeCompare(b, "ko"),
  );
}

/** 전체 태그. generateStaticParams 와 검색 빈 결과 칩에서 사용. */
export async function getAllTags(
  language: PostLanguage = "ko",
): Promise<string[]> {
  return tagsOf(await loadPosts(language));
}

/** 특정 태그의 글 메타(최신순). */
export async function getPostsByTag(
  tag: string,
  language: PostLanguage = "ko",
): Promise<PostMeta[]> {
  const posts = await loadPosts(language);
  return posts.filter((p) => p.tags.includes(tag)).map(toMeta);
}

/**
 * 검색 인덱스(클라이언트 검색용) — 제목 + 설명 + 본문 plaintext.
 * 빌드타임에 search-index.json 으로 직렬화한다.
 */
export async function getSearchDocs(
  language: PostLanguage = "ko",
): Promise<SearchDoc[]> {
  const posts = await loadPosts(language);
  return posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    categories: p.categories,
    tags: p.tags,
    // 태그명으로도 검색되도록 text 끝에 붙인다.
    text: `${p.title} ${p.description} ${p.plainText} ${p.tags.map((tag) => tagLabel(tag, language)).join(" ")}`,
  }));
}
