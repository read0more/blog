/** 콘텐츠 파이프라인 공통 타입 */

/** .md frontmatter 스키마 (sample.md 기준) */
export interface PostFrontmatter {
  title: string;
  /** ISO 8601 문자열 */
  date: string;
  description: string;
  /**
   * frontmatter 의 category 는 문자열 하나 또는 문자열 배열로 쓸 수 있고,
   * 로드 시점에 항상 string[] 로 정규화된다(글 하나가 여러 카테고리에 속할 수 있음).
   */
  categories: string[];
  /** true면 OMIT_DRAFTS 빌드(배포)에서 제외된다. 없으면 공개 글. */
  draft?: boolean;
}

/** TOC 항목 — 본문 heading 에서 추출 */
export interface TocItem {
  /** heading 텍스트 */
  text: string;
  /** rehype-slug 가 부여한 id (앵커) */
  id: string;
  /** heading depth (2 = h2, 3 = h3, 4 = h4) */
  depth: number;
}

/** 목록/카드에서 쓰는 글 메타데이터 (본문 HTML 제외) */
export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  /** 글이 속한 카테고리들(최소 1개). */
  categories: string[];
  /** 읽는 데 걸리는 시간(분) */
  readingMinutes: number;
}

/** 글 상세 — 메타 + 렌더된 본문 HTML + TOC */
export interface Post extends PostMeta {
  /** 빌드타임에 렌더된 본문 HTML */
  contentHtml: string;
  toc: TocItem[];
  /** 검색 인덱스용 본문 plaintext (제목/설명 제외한 본문만) */
  plainText: string;
}

/** 카테고리 — 자동 수집된 이름 + 글 개수 + 결정적 색상 */
export interface Category {
  name: string;
  count: number;
  /** catColor() 로 산출된 iOS 시스템 컬러 */
  color: string;
}

/** 빌드타임에 생성되어 클라이언트 검색이 로드하는 인덱스 항목 */
export interface SearchDoc {
  slug: string;
  title: string;
  description: string;
  categories: string[];
  /** ISO 날짜(최신순 보장용). search-index.json 에만 포함. */
  date?: string;
  /** 제목 + 설명 + 본문 plaintext (검색 대상 전체) */
  text: string;
}
