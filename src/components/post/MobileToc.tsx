"use client";

import { useState } from "react";
import type { TocItem } from "@/lib/types";
import { handleTocClick } from "./Toc";
import styles from "./Article.module.css";

interface MobileTocProps {
  items: TocItem[];
  activeId: string | null;
}

/** 모바일 목차 — 접이식 토글. 데스크톱에선 우측 TOC 가 대신하므로 숨긴다(CSS). */
export function MobileToc({ items, activeId }: MobileTocProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.mobileToc} data-testid="mobile-toc">
      <button
        type="button"
        className={styles.mobileTocButton}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-testid="mobile-toc-toggle"
      >
        <span>목차</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--label-secondary)"
          strokeWidth="2.4"
          strokeLinecap="round"
          className={`${styles.mobileTocChevron} ${open ? styles.open : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className={styles.mobileTocPanel}>
          {items.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              onClick={(e) => {
                handleTocClick(e, t.id);
                setOpen(false);
              }}
              className={`${styles.mobileTocItem} ${t.depth === 3 ? styles.sub : ""} ${
                activeId === t.id ? styles.active : ""
              }`}
            >
              {t.text}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
