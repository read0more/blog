"use client";

import { useState } from "react";
import { flushSync } from "react-dom";
import type { TocItem, PostLanguage } from "@/lib/types";
import { getUiTranslator } from "@/lib/i18n";
import { handleTocClick, depthClass } from "./Toc";
import styles from "./Article.module.css";

interface MobileTocProps {
  language?: PostLanguage;
  items: TocItem[];
  activeId: string | null;
  /** 항목 클릭 시 호출 — active 고정용(scroll-spy 잠금). */
  onSelect: (id: string) => void;
}

/** 모바일 목차: 접이식 토글. 데스크톱에선 왼쪽 TOC 가 대신하므로 숨긴다(CSS). */
export function MobileToc({
  items,
  activeId,
  onSelect,
  language = "ko",
}: MobileTocProps) {
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
        <span>{getUiTranslator(language)("mobileToc")}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
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
                // 패널이 본문 위에 자리를 차지하므로 먼저 닫아 레이아웃을 확정한 뒤 스크롤한다.
                // 나중에 닫으면 스크롤 목표가 패널 높이만큼 어긋나 제목이 화면 위로 지나간다.
                flushSync(() => setOpen(false));
                handleTocClick(e, t.id);
                onSelect(t.id);
              }}
              className={`${styles.mobileTocItem} ${depthClass(t.depth)} ${
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
