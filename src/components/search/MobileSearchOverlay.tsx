"use client";

import { useEffect, useRef } from "react";
import type { Category } from "@/lib/types";
import { SearchIcon } from "../layout/icons";
import { ResultList, EmptyState } from "./SearchResults";
import type { useSearch } from "./useSearch";
import styles from "./Search.module.css";

interface MobileSearchOverlayProps {
  search: ReturnType<typeof useSearch>;
  categories: Category[];
  onClose: () => void;
}

/** 모바일 전체화면 검색 오버레이 — 유휴 안내 / 결과 / 결과 없음. */
export function MobileSearchOverlay({ search, categories, onClose }: MobileSearchOverlayProps) {
  const { query, setQuery, ensureIndex, results, hasQuery, hasResults, isEmpty } = search;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ensureIndex();
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.mobileOverlay} data-testid="mobile-search-overlay">
      <div className={styles.mobileBar}>
        <div className={styles.mobileSearchField}>
          <SearchIcon size={17} />
          <input
            ref={inputRef}
            type="text"
            className={styles.mobileInput}
            placeholder="제목 · 본문 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="mobile-search-input"
          />
        </div>
        <button
          type="button"
          className={styles.mobileCancel}
          onClick={onClose}
          data-testid="mobile-search-cancel"
        >
          취소
        </button>
      </div>

      <div className={styles.mobileBody}>
        {hasResults && <ResultList results={results} onSelect={onClose} />}
        {isEmpty && (
          <EmptyState query={query} categories={categories} showChips={false} />
        )}
        {!hasQuery && (
          <div className={styles.mobileIdle} data-testid="mobile-search-idle">
            키워드를 입력하면 본문까지 검색합니다.
          </div>
        )}
      </div>
    </div>
  );
}
