"use client";

import type { TocItem } from "@/lib/types";
import styles from "./Article.module.css";

interface TocProps {
  items: TocItem[];
  activeId: string | null;
  /** 항목 클릭 시 호출 — active 고정용(scroll-spy 잠금). */
  onSelect: (id: string) => void;
}

/** 우측 sticky 목차(데스크톱). scroll-spy 로 현재 섹션을 강조. */
export function Toc({ items, activeId, onSelect }: TocProps) {
  return (
    <aside className={styles.tocCol} data-testid="toc">
      <div className={styles.tocLabel}>이 글의 목차</div>
      <div className={styles.tocList}>
        {items.map((t) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            onClick={(e) => {
              handleTocClick(e, t.id);
              onSelect(t.id);
            }}
            className={`${styles.tocItem} ${depthClass(t.depth)} ${
              activeId === t.id ? styles.active : ""
            }`}
            data-testid={`toc-item-${t.id}`}
            aria-current={activeId === t.id ? "true" : undefined}
          >
            {t.text}
          </a>
        ))}
      </div>
    </aside>
  );
}

/** TOC depth → 들여쓰기 클래스. h2(2)=없음, h3(3)=sub, h4(4)=sub2. */
export function depthClass(depth: number): string {
  if (depth >= 4) return styles.sub2;
  if (depth === 3) return styles.sub;
  return "";
}

/** 부드러운 스크롤 + 해시 갱신. scroll-margin-top 은 globals.css 가 보정. */
export function handleTocClick(
  e: React.MouseEvent<HTMLAnchorElement>,
  id: string,
) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}
