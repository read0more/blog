"use client";

import Link from "next/link";
import type { Category } from "@/lib/types";
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
          <div
            className={styles.resultCategory}
            style={{ color: categoryColor(r.category) }}
          >
            {r.category}
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
  categories: Category[];
  /** 카테고리 칩 노출 여부(데스크톱 패널만). 모바일은 간단 안내. */
  showChips: boolean;
  onSelect?: () => void;
}

/** 결과 없음 — "OOO"에 대한 결과가 없습니다 + (데스크톱) 카테고리 칩. */
export function EmptyState({ query, categories, showChips, onSelect }: EmptyStateProps) {
  return (
    <div
      className={showChips ? styles.empty : styles.mobileEmpty}
      data-testid="search-empty"
    >
      <div className={styles.emptyTitle}>
        “{query}”에 대한 결과가 없습니다
      </div>
      <div className={styles.emptyDesc}>
        {showChips
          ? "다른 키워드로 검색하거나 카테고리를 둘러보세요."
          : "다른 키워드로 검색해 보세요."}
      </div>
      {showChips && (
        <div className={styles.emptyChips}>
          {categories.map((c) => (
            <Link
              key={c.name}
              href={`/category/${encodeURIComponent(c.name)}`}
              className={styles.emptyChip}
              style={{ color: c.color }}
              onClick={onSelect}
              data-testid={`search-empty-chip-${c.name}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
