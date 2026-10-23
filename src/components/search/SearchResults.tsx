"use client";

import Link from "next/link";
import type { SearchResult } from "@/lib/search";
import type { PostLanguage } from "@/lib/types";
import { sitePath, getUiTranslator } from "@/lib/i18n";
import { categoryLabel, tagLabel } from "@/lib/taxonomy.mjs";
import { categoryColor } from "@/lib/categories";
import styles from "./Search.module.css";

interface ResultListProps {
  language?: PostLanguage;
  results: SearchResult[];
  onSelect?: () => void;
}

/** 검색 결과 카드 목록(데스크톱 패널 / 모바일 오버레이 공용). */
export function ResultList({
  results,
  onSelect,
  language = "ko",
}: ResultListProps) {
  return (
    <>
      {results.map((r) => (
        <Link
          key={r.slug}
          href={sitePath(language, `/posts/${r.slug}`)}
          className={styles.result}
          onClick={onSelect}
          data-testid={`search-result-${r.slug}`}
        >
          <div className={styles.resultCategory}>
            {r.categories.map((c, i) => (
              <span key={c}>
                {i > 0 && <span className={styles.resultCategoryDot}> · </span>}
                <span style={{ color: categoryColor(c) }}>
                  {categoryLabel(c, language)}
                </span>
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
  language?: PostLanguage;
  query: string;
  /** 태그 칩(데스크톱 패널만 넘긴다). 없으면 모바일용 간단 안내. */
  tags?: string[];
  onSelect?: () => void;
}

/** 결과 없음 — "OOO"에 대한 결과가 없습니다 + (데스크톱) 태그 칩. */
export function EmptyState({
  query,
  tags,
  onSelect,
  language = "ko",
}: EmptyStateProps) {
  const translate = getUiTranslator(language);
  return (
    <div
      className={tags ? styles.empty : styles.mobileEmpty}
      data-testid="search-empty"
    >
      <div className={styles.emptyTitle}>
        {translate("noResults", { query })}
      </div>
      <div className={styles.emptyDesc}>
        {tags ? translate("tryTags") : translate("trySearch")}
      </div>
      {tags && (
        <div className={styles.emptyChips}>
          {tags.map((t) => (
            <Link
              key={t}
              href={sitePath(language, `/tag/${encodeURIComponent(t)}`)}
              className={styles.emptyChip}
              onClick={onSelect}
              data-testid={`search-empty-chip-${t}`}
            >
              #{tagLabel(t, language)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
