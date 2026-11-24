"use client";

import { useEffect, useRef } from "react";
import type { TocItem, PostLanguage } from "@/lib/types";
import { getUiTranslator } from "@/lib/i18n";
import styles from "./Article.module.css";

interface TocProps {
  language?: PostLanguage;
  items: TocItem[];
  activeId: string | null;
  /** 항목 클릭 시 호출 — active 고정용(scroll-spy 잠금). */
  onSelect: (id: string) => void;
}

/** 오른쪽 sticky 목차(데스크톱). scroll-spy 로 현재 섹션을 강조. */
export function Toc({ items, activeId, onSelect, language = "ko" }: TocProps) {
  const ref = useRef<HTMLElement>(null);

  // 목차가 창보다 길어 넘칠 때만 표시를 남긴다. CSS 가 이 표시가 있을 때만 스크롤을 가둬서,
  // 짧은 목차 위에서 휠을 굴리면 페이지가 그대로 스크롤된다.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () =>
      el.toggleAttribute("data-overflowing", el.scrollHeight > el.clientHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  // 스크롤바를 숨겼으므로, 현재 항목이 보이는 범위를 벗어나면 목차를 따라 움직인다.
  // scrollIntoView 는 페이지까지 움직일 수 있어 목차의 scrollTop 만 직접 맞춘다.
  useEffect(() => {
    const el = ref.current;
    const link = el?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!el || !link) return;
    const labelHeight =
      el.firstElementChild instanceof HTMLElement
        ? el.firstElementChild.offsetHeight
        : 0;
    const top = link.offsetTop;
    const bottom = top + link.offsetHeight;
    if (top < el.scrollTop + labelHeight) el.scrollTop = top - labelHeight;
    else if (bottom > el.scrollTop + el.clientHeight)
      el.scrollTop = bottom - el.clientHeight;
  }, [activeId]);

  return (
    <aside className={styles.tocCol} data-testid="toc" ref={ref}>
      <div className={styles.tocLabel}>{getUiTranslator(language)("toc")}</div>
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
