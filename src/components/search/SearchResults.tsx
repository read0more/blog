"use client";

import Link from "next/link";
import type { SearchResult } from "@/lib/search";
import { categoryColor } from "@/lib/categories";
import styles from "./Search.module.css";

interface ResultListProps {
  results: SearchResult[];
  onSelect?: () => void;
}

/** 검색 결과 카드 목록(데스크톱 패널 / 모바일 오버레이 공용). */
export function ResultList({ results, onSelect }: ResultListProps) {
  return (
    <>
      {results.map((r) => (
        <Link
          key={r.slug}
          href={`/posts/${r.slug}`}
          className={styles.result}
          onClick={onSelect}
          data-testid={`search-result-${r.slug}`}
        >
          <div className={styles.resultCategory}>
            {r.categories.map((c, i) => (
              <span key={c}>
                {i > 0 && <span className={styles.resultCategoryDot}> · </span>}
                <span style={{ color: categoryColor(c) }}>{c}</span>
              </span>
            ))}
          </div>
          <div className={styles.resultTitle}>{r.title}</div>
          <div className={styles.resultSnippet}>
            {r.snippet.map((part, i) =>
              part.isMark ? (
                <mark key={i}>{part.text}</mark>
              ) : (
                <span key={i}>{part.text}</span>
              ),
            )}
          </div>
        </Link>
      ))}
    </>
  );
}

interface EmptyStateProps {
  query: string;
  /** 태그 칩(데스크톱 패널만 넘긴다). 없으면 모바일용 간단 안내. */
  tags?: string[];
  onSelect?: () => void;
}

/** 결과 없음 — "OOO"에 대한 결과가 없습니다 + (데스크톱) 태그 칩. */
export function EmptyState({ query, tags, onSelect }: EmptyStateProps) {
  return (
    <div
      className={tags ? styles.empty : styles.mobileEmpty}
      data-testid="search-empty"
    >
      <div className={styles.emptyTitle}>“{query}”에 대한 결과가 없습니다</div>
      <div className={styles.emptyDesc}>
        {tags
          ? "다른 키워드로 검색하거나 태그를 둘러보세요."
          : "다른 키워드로 검색해 보세요."}
      </div>
      {tags && (
        <div className={styles.emptyChips}>
          {tags.map((t) => (
            <Link
              key={t}
              href={`/tag/${encodeURIComponent(t)}`}
              className={styles.emptyChip}
              onClick={onSelect}
              data-testid={`search-empty-chip-${t}`}
            >
              #{t}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
