import type { SearchDoc } from "./types";

/** 스니펫 조각 — 일반 텍스트 또는 매칭(하이라이트) 텍스트. */
export interface SnippetPart {
  text: string;
  isMark: boolean;
}

/** 검색 결과 한 건. */
export interface SearchResult {
  slug: string;
  title: string;
  categories: string[];
  snippet: SnippetPart[];
}

/**
 * 스니펫 생성 — 디자인(read0more.dc.html)의 snippet() 과 동일한 ±46/66자 로직.
 * 매칭 위치 앞 46자 / 매칭어 / 뒤 66자(+…). 매칭이 없으면 앞 110자(+…).
 */
export function makeSnippet(plain: string, query: string): SnippetPart[] {
  const idx = plain.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) {
    return [{ text: plain.slice(0, 110) + "…", isMark: false }];
  }
  const start = Math.max(0, idx - 46);
  const pre = (start > 0 ? "…" : "") + plain.slice(start, idx);
  const match = plain.slice(idx, idx + query.length);
  const post = plain.slice(idx + query.length, idx + query.length + 66) + "…";
  return [
    { text: pre, isMark: false },
    { text: match, isMark: true },
    { text: post, isMark: false },
  ];
}

/**
 * 클라이언트 검색 — text(제목+설명+본문)에 query 가 포함된 글을 찾는다.
 * 인덱스 순서(최신순)를 유지한다. 디자인의 includes 기반 필터와 동일.
 */
export function searchDocs(docs: SearchDoc[], query: string): SearchResult[] {
  const q = query.trim();
  if (!q) return [];
  const ql = q.toLowerCase();
  return docs
    .filter((d) => d.text.toLowerCase().includes(ql))
    .map((d) => ({
      slug: d.slug,
      title: d.title,
      categories: d.categories,
      snippet: makeSnippet(d.text, q),
    }));
}
