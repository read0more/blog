"use client";

import { useEffect, useRef } from "react";
import type { PostLanguage } from "@/lib/types";
import { getUiTranslator } from "@/lib/i18n";
import { SearchIcon } from "../layout/icons";
import { ResultList, EmptyState } from "./SearchResults";
import type { useSearch } from "./useSearch";
import styles from "./Search.module.css";

interface MobileSearchOverlayProps {
  language?: PostLanguage;
  search: ReturnType<typeof useSearch>;
  onClose: () => void;
}

/** 모바일 전체화면 검색 오버레이 — 유휴 안내 / 결과 / 결과 없음. */
export function MobileSearchOverlay({
  language = "ko",
  search,
  onClose,
}: MobileSearchOverlayProps) {
  const translate = getUiTranslator(language);
  const {
    query,
    setQuery,
    ensureIndex,
    results,
    hasQuery,
    hasResults,
    isEmpty,
  } = search;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ensureIndex();
    inputRef.current?.focus();
  }, [ensureIndex]);

  return (
    <div className={styles.mobileOverlay} data-testid="mobile-search-overlay">
      <div className={styles.mobileBar}>
        <div className={styles.mobileSearchField}>
          <SearchIcon size={17} />
          <input
            ref={inputRef}
            type="text"
            className={styles.mobileInput}
            placeholder={translate("searchPlaceholder")}
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
          {translate("cancel")}
        </button>
      </div>

      <div className={styles.mobileBody}>
        {hasResults && (
          <ResultList
            results={results}
            onSelect={onClose}
            language={language}
          />
        )}
        {isEmpty && <EmptyState query={query} language={language} />}
        {!hasQuery && (
          <div className={styles.mobileIdle} data-testid="mobile-search-idle">
            {translate("searchIdle")}
          </div>
        )}
      </div>
    </div>
  );
}
