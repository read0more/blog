"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { Category } from "@/lib/types";
import { SearchIcon } from "../layout/icons";
import { ResultList, EmptyState } from "./SearchResults";
import type { useSearch } from "./useSearch";
import styles from "./Search.module.css";

interface DesktopSearchProps {
  search: ReturnType<typeof useSearch>;
  categories: Category[];
}

/** 데스크톱 헤더 검색박스 + 결과 패널(560px). */
export function DesktopSearch({ search, categories }: DesktopSearchProps) {
  const { query, setQuery, clear, ensureIndex, results, hasQuery, hasResults, isEmpty } =
    search;
  const pathname = usePathname();

  // 라우트 이동 시 검색어 초기화(결과 클릭 후 패널이 남지 않도록).
  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const header = hasResults ? `${results.length}개의 결과` : "검색";

  return (
    <>
      <div className={styles.searchBox} data-testid="header-search">
        <SearchIcon />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="제목 · 본문 검색"
          value={query}
          onFocusCapture={ensureIndex}
          onChange={(e) => {
            ensureIndex();
            setQuery(e.target.value);
          }}
          data-testid="search-input"
        />
        {hasQuery && (
          <button
            type="button"
            className={styles.clearButton}
            aria-label="지우기"
            onClick={clear}
            data-testid="search-clear"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        )}
      </div>

      {hasQuery && (
        <>
          <div
            className={styles.panelScrim}
            onClick={clear}
            aria-hidden="true"
          />
          <div className={styles.panel} data-testid="search-panel">
            <div className={styles.panelHeader}>{header}</div>
            <div className={styles.panelBody}>
              {hasResults && <ResultList results={results} onSelect={clear} />}
              {isEmpty && (
                <EmptyState
                  query={query}
                  categories={categories}
                  showChips
                  onSelect={clear}
                />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
