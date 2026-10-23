"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category, PostLanguage } from "@/lib/types";
import { sitePath, getUiTranslator } from "@/lib/i18n";
import { categoryLabel } from "@/lib/taxonomy.mjs";
import styles from "./AppShell.module.css";

interface SidebarNavProps {
  language?: PostLanguage;
  categories: Category[];
  totalCount: number;
  /** 행 클릭 시 호출(모바일 사이드바 닫기 등). */
  onNavigate?: () => void;
  /** "카테고리" 헤딩 표시 여부(모바일 사이드바는 자체 헤딩이 있어 false). */
  showHeading?: boolean;
}

/**
 * 카테고리 목록 — "전체 글"(홈) + 카테고리별 행(컬러칩 + 카운트).
 * 현재 경로를 보고 active 행을 강조한다. 데스크톱/모바일 사이드바 공용.
 *
 * 카테고리 slug 는 한글 그대로 허용(PRD §3)하므로 링크는 encodeURIComponent 로 만든다.
 */
export function SidebarNav({
  language = "ko",
  categories,
  totalCount,
  onNavigate,
  showHeading = true,
}: SidebarNavProps) {
  const pathname = usePathname();

  // "전체 글"은 홈(/)에서만 active.
  const home = sitePath(language);
  const homeActive = pathname === home || pathname === home.slice(0, -1);

  const categoryActive = (name: string) => {
    const slug = encodeURIComponent(name);
    return (
      pathname === sitePath(language, `/category/${slug}`) ||
      pathname === sitePath(language, `/category/${slug}/`) ||
      pathname === sitePath(language, `/category/${name}`) ||
      pathname === sitePath(language, `/category/${name}/`)
    );
  };

  return (
    <nav>
      {showHeading && (
        <div className={styles.sidebarHeading}>
          {getUiTranslator(language)("categories")}
        </div>
      )}

      <Link
        href={home}
        onClick={onNavigate}
        className={`${styles.catRow} ${homeActive ? styles.active : ""}`}
        data-testid="sidebar-all"
        aria-current={homeActive ? "page" : undefined}
      >
        <span>{getUiTranslator(language)("allPosts")}</span>
        <span className={styles.catCount}>{totalCount}</span>
      </Link>

      {categories.map((c) => {
        const active = categoryActive(c.name);
        return (
          <Link
            key={c.name}
            href={sitePath(language, `/category/${encodeURIComponent(c.name)}`)}
            onClick={onNavigate}
            className={`${styles.catRow} ${active ? styles.active : ""}`}
            data-testid={`sidebar-category-${c.name}`}
            aria-current={active ? "page" : undefined}
          >
            <span className={styles.catName}>
              <span className={styles.catDot} style={{ background: c.color }} />
              {categoryLabel(c.name, language)}
            </span>
            <span className={styles.catCount}>{c.count}</span>
          </Link>
        );
      })}
    </nav>
  );
}
