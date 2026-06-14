"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/types";
import styles from "./AppShell.module.css";

interface SidebarNavProps {
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
  categories,
  totalCount,
  onNavigate,
  showHeading = true,
}: SidebarNavProps) {
  const pathname = usePathname();

  // "전체 글"은 홈(/)에서만 active.
  const homeActive = pathname === "/";

  const categoryActive = (name: string) => {
    const slug = encodeURIComponent(name);
    return (
      pathname === `/category/${slug}` ||
      pathname === `/category/${slug}/` ||
      pathname === `/category/${name}` ||
      pathname === `/category/${name}/`
    );
  };

  return (
    <nav>
      {showHeading && <div className={styles.sidebarHeading}>카테고리</div>}

      <Link
        href="/"
        onClick={onNavigate}
        className={`${styles.catRow} ${homeActive ? styles.active : ""}`}
        data-testid="sidebar-all"
        aria-current={homeActive ? "page" : undefined}
      >
        <span>전체 글</span>
        <span className={styles.catCount}>{totalCount}</span>
      </Link>

      {categories.map((c) => {
        const active = categoryActive(c.name);
        return (
          <Link
            key={c.name}
            href={`/category/${encodeURIComponent(c.name)}`}
            onClick={onNavigate}
            className={`${styles.catRow} ${active ? styles.active : ""}`}
            data-testid={`sidebar-category-${c.name}`}
            aria-current={active ? "page" : undefined}
          >
            <span className={styles.catName}>
              <span className={styles.catDot} style={{ background: c.color }} />
              {c.name}
            </span>
            <span className={styles.catCount}>{c.count}</span>
          </Link>
        );
      })}
    </nav>
  );
}
