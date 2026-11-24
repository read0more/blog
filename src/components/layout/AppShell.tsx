"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category, PostLanguage } from "@/lib/types";
import { sitePath, getUiTranslator } from "@/lib/i18n";
import { SidebarNav } from "./SidebarNav";
import { LanguageSwitch } from "./LanguageSwitch";
import { HamburgerIcon, SearchIcon, CloseIcon } from "./icons";
import { useSearch } from "../search/useSearch";
import { DesktopSearch } from "../search/DesktopSearch";
import { MobileSearchOverlay } from "../search/MobileSearchOverlay";
import styles from "./AppShell.module.css";

interface AppShellProps {
  language?: PostLanguage;
  originalSlugs?: string[];
  translatedSlugs?: string[];
  categories: Category[];
  /** 검색 빈 결과 화면의 태그 칩용. */
  tags: string[];
  totalCount: number;
  children: ReactNode;
}

export function AppShell({
  language = "ko",
  originalSlugs = [],
  translatedSlugs = [],
  categories,
  tags,
  totalCount,
  children,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

  const translate = getUiTranslator(language);
  const search = useSearch(language);

  const openMobileSearch = () => {
    search.clear();
    setMobileSearchOpen(true);
  };
  const closeMobileSearch = () => {
    setMobileSearchOpen(false);
    search.clear();
  };

  const pathname = usePathname();

  // 위로가기 버튼: 400px 이상 스크롤 시 노출.
  const [showBackTop, setShowBackTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const scrollToTop = () => {
    // prefers-reduced-motion: 감소 모션 선호 시 즉시 이동, 아니면 smooth scroll.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReduced ? "instant" : "smooth",
    });
  };

  return (
    <div className={styles.shell}>
      {/* ---- Header: 워드마크 / 카테고리 내비 / 검색 / 언어 전환, 아래 3px 괘선 ---- */}
      <header className={styles.header} data-testid="app-header">
        <div className={styles.headerInner}>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.mobileOnly}`}
            aria-label={translate("menu")}
            onClick={() => setSidebarOpen((v) => !v)}
            data-testid="header-hamburger"
          >
            <HamburgerIcon />
          </button>

          <Link
            href={sitePath(language)}
            className={styles.wordmark}
            data-testid="header-wordmark"
          >
            read0more
          </Link>

          {/* 데스크톱 카테고리 내비(예전 좌측 사이드바). 900px 이하에서는 햄버거 메뉴로 대신한다. */}
          <div
            className={`${styles.headerNav} ${styles.desktopOnly}`}
            data-testid="sidebar-desktop"
          >
            <SidebarNav
              categories={categories}
              totalCount={totalCount}
              language={language}
            />
          </div>

          {/* Desktop search (box + result panel) */}
          <div className={`${styles.headerSearchSlot} ${styles.desktopOnly}`}>
            <DesktopSearch search={search} tags={tags} language={language} />
          </div>

          <LanguageSwitch
            language={language}
            pathname={pathname}
            originalSlugs={originalSlugs}
            translatedSlugs={translatedSlugs}
          />

          {/* Mobile search button */}
          <button
            type="button"
            className={`${styles.iconButton} ${styles.mobileOnly}`}
            aria-label={translate("search")}
            onClick={openMobileSearch}
            data-testid="header-mobile-search"
          >
            <SearchIcon size={20} />
          </button>
        </div>
      </header>

      {/* ---- Content: --page-max 가운데 정렬 단일 컬럼. 글 상세의 2열 배치는 글 컴포넌트가 맡는다. ---- */}
      <div className={styles.contentWrap} data-testid="content-wrap">
        <main className={styles.main} data-testid="main">
          {children}
        </main>
      </div>

      {/* ---- Mobile slide-in sidebar + scrim ---- */}
      <div
        className={`${styles.scrim} ${sidebarOpen ? styles.open : ""}`}
        onClick={closeSidebar}
        data-testid="sidebar-scrim"
        aria-hidden="true"
      />
      <aside
        className={`${styles.mobileSidebar} ${sidebarOpen ? styles.open : ""}`}
        data-testid="sidebar-mobile"
        aria-hidden={!sidebarOpen}
      >
        <div className={styles.mobileSidebarHead}>
          <span className={styles.drawerHeading}>
            {translate("categories")}
          </span>
          <button
            type="button"
            className={styles.closeButton}
            aria-label={translate("close")}
            onClick={closeSidebar}
            data-testid="sidebar-mobile-close"
          >
            <CloseIcon size={16} />
          </button>
        </div>
        <div className={styles.mobileSidebarBody}>
          <SidebarNav
            language={language}
            categories={categories}
            totalCount={totalCount}
            onNavigate={closeSidebar}
          />
        </div>
      </aside>

      {/* ---- Mobile search overlay ---- */}
      {mobileSearchOpen && (
        <MobileSearchOverlay
          search={search}
          tags={tags}
          onClose={closeMobileSearch}
          language={language}
        />
      )}

      {/* ---- Back to top (400px 스크롤 후 노출) ---- */}
      <button
        type="button"
        className={`${styles.backToTop} ${showBackTop ? styles.backToTopVisible : ""}`}
        onClick={scrollToTop}
        aria-label={translate("backTop")}
        data-testid="back-to-top"
      >
        {/* Chevron up */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
    </div>
  );
}
