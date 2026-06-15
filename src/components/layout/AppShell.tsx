"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/types";
import { SidebarNav } from "./SidebarNav";
import { HamburgerIcon, SearchIcon, CloseIcon } from "./icons";
import { useSearch } from "../search/useSearch";
import { DesktopSearch } from "../search/DesktopSearch";
import { MobileSearchOverlay } from "../search/MobileSearchOverlay";
import styles from "./AppShell.module.css";

interface AppShellProps {
  categories: Category[];
  totalCount: number;
  children: ReactNode;
}

export function AppShell({ categories, totalCount, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

  const search = useSearch();

  const openMobileSearch = () => {
    search.clear();
    setMobileSearchOpen(true);
  };
  const closeMobileSearch = () => {
    setMobileSearchOpen(false);
    search.clear();
  };

  // 글 상세(/posts/...)는 기본 maxW 900(TOC 없음), 우측 TOC 가 실제 렌더될 때만
  // maxW 1140 으로 넓힌다(CSS :has). dc.html 689-694 명세.
  const pathname = usePathname();
  const isPost = pathname.startsWith("/posts/");
  const contentWrapClass = `${styles.contentWrap} ${isPost ? styles.post : ""}`;

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
      {/* ---- Header ---- */}
      <header className={styles.header} data-testid="app-header">
        <button
          type="button"
          className={`${styles.iconButton} ${styles.mobileOnly}`}
          aria-label="메뉴"
          onClick={() => setSidebarOpen((v) => !v)}
          data-testid="header-hamburger"
        >
          <HamburgerIcon />
        </button>

        <Link
          href="/"
          className={styles.wordmark}
          data-testid="header-wordmark"
        >
          read0more
        </Link>

        {/* Desktop search (box + result panel) */}
        <div className={`${styles.headerSearchSlot} ${styles.desktopOnly}`}>
          <DesktopSearch search={search} categories={categories} />
        </div>

        {/* Mobile search button */}
        <button
          type="button"
          className={`${styles.iconButton} ${styles.mobileOnly}`}
          style={{ marginLeft: "auto" }}
          aria-label="검색"
          onClick={openMobileSearch}
          data-testid="header-mobile-search"
        >
          <SearchIcon size={20} stroke="currentColor" />
        </button>
      </header>

      {/* ---- Content: sidebar + main ---- */}
      <div className={contentWrapClass} data-testid="content-wrap">
        <aside className={styles.sidebar} data-testid="sidebar-desktop">
          <SidebarNav categories={categories} totalCount={totalCount} />
        </aside>

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
          <span className={styles.sidebarHeading} style={{ padding: 0 }}>
            카테고리
          </span>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="닫기"
            onClick={closeSidebar}
            data-testid="sidebar-mobile-close"
          >
            <CloseIcon />
          </button>
        </div>
        <div className={styles.mobileSidebarBody}>
          <SidebarNav
            categories={categories}
            totalCount={totalCount}
            onNavigate={closeSidebar}
            showHeading={false}
          />
        </div>
      </aside>

      {/* ---- Mobile search overlay ---- */}
      {mobileSearchOpen && (
        <MobileSearchOverlay
          search={search}
          categories={categories}
          onClose={closeMobileSearch}
        />
      )}

      {/* ---- Back to top (플로팅 FAB, 400px 스크롤 후 노출) ---- */}
      <button
        type="button"
        className={`${styles.backToTop} ${showBackTop ? styles.backToTopVisible : ""}`}
        onClick={scrollToTop}
        aria-label="맨 위로"
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
