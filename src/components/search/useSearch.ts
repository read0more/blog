"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchDoc } from "@/lib/types";
import { searchDocs, type SearchResult } from "@/lib/search";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * 클라이언트 검색 훅.
 * - search-index.json 을 처음 검색이 활성화될 때 lazy fetch(basePath prefix).
 * - query 입력을 디바운스(120ms)해 결과를 계산한다.
 *
 * (현재는 빌드타임 JSON 인덱스 기반. Pagefind 전환은 후속 과제.)
 */
export function useSearch() {
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fetchedRef = useRef(false);

  /** 인덱스를 한 번만 받아온다. 검색이 처음 열릴 때 호출. */
  const ensureIndex = useCallback(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch(`${BASE_PATH}/search-index.json`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: SearchDoc[]) => setDocs(data))
      .catch(() => setDocs([]));
  }, []);

  // query 변경 → 디바운스 후 검색. 빈 입력/미로드는 디바운스 콜백 안에서 비운다
  // (effect 본문에서 직접 setState 하지 않는다).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    debounceRef.current = setTimeout(() => {
      setResults(!q || !docs ? [] : searchDocs(docs, q));
    }, 120);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, docs]);

  const clear = useCallback(() => setQuery(""), []);

  const trimmed = query.trim();
  return {
    query,
    setQuery,
    clear,
    ensureIndex,
    results,
    /** 인덱스 로딩 여부(아직 null 이면 미로드). */
    ready: docs !== null,
    hasQuery: trimmed.length > 0,
    hasResults: trimmed.length > 0 && results.length > 0,
    isEmpty: trimmed.length > 0 && docs !== null && results.length === 0,
  };
}
