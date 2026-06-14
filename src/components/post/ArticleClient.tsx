"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Post } from "@/lib/types";
import { categoryColor } from "@/lib/categories";
import { formatDate } from "@/lib/format";
import { Toc } from "./Toc";
import { MobileToc } from "./MobileToc";
import { Comments } from "./Comments";
import styles from "./Article.module.css";

interface ArticleClientProps {
  post: Post;
}

const COPY_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>`;

/**
 * 글 상세 레이아웃 + 인터랙션.
 * - 좌측 카테고리 사이드바는 AppShell 이 제공. 여기서는 [본문][우측 TOC] 2컬럼.
 * - 코드블록 enhance(헤더 lang + 복사버튼, 복사→복사됨 1.5s).
 * - scroll-spy(현재 heading 추적) → 우측/모바일 TOC active.
 */
export function ArticleClient({ post }: ArticleClientProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const { toc } = post;
  // TOC 노출 임계값: h2/h3 합산 3개 이상(디자인 hasToc).
  const showToc = toc.length >= 3;
  const [activeId, setActiveId] = useState<string | null>(toc[0]?.id ?? null);

  // ---- 코드블록 enhance ----
  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;

    const figures = root.querySelectorAll<HTMLElement>(
      "figure[data-rehype-pretty-code-figure]",
    );
    const cleanups: Array<() => void> = [];

    figures.forEach((figure) => {
      if (figure.dataset.enhanced === "true") return;
      figure.dataset.enhanced = "true";

      const pre = figure.querySelector("pre");
      if (!pre) return;
      const lang = pre.getAttribute("data-language") || "code";
      const rawCode = pre.textContent ?? "";

      const header = document.createElement("div");
      header.className = styles.codeHeader;

      const langEl = document.createElement("span");
      langEl.className = styles.codeLang;
      langEl.textContent = lang;

      const button = document.createElement("button");
      button.type = "button";
      button.className = styles.copyButton;
      button.setAttribute("data-testid", "code-copy");
      const setLabel = (text: string) => {
        button.innerHTML = `${COPY_ICON}<span>${text}</span>`;
      };
      setLabel("복사");

      let timer: ReturnType<typeof setTimeout> | undefined;
      const onClick = () => {
        try {
          navigator.clipboard?.writeText(rawCode);
        } catch {
          /* clipboard 미지원 환경은 조용히 무시 */
        }
        button.classList.add(styles.copied);
        setLabel("복사됨");
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          button.classList.remove(styles.copied);
          setLabel("복사");
        }, 1500);
      };
      button.addEventListener("click", onClick);

      header.appendChild(langEl);
      header.appendChild(button);
      figure.insertBefore(header, figure.firstChild);

      cleanups.push(() => {
        button.removeEventListener("click", onClick);
        if (timer) clearTimeout(timer);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [post.contentHtml]);

  // ---- scroll-spy ----
  useEffect(() => {
    if (!showToc) return;
    const root = bodyRef.current;
    if (!root) return;

    const headings = toc
      .map((t) => root.querySelector<HTMLElement>(`#${CSS.escape(t.id)}`))
      .filter((el): el is HTMLElement => el !== null);
    if (!headings.length) return;

    const recompute = () => {
      // 헤더(57px) + 여유를 둔 기준선보다 위에 있는 마지막 heading 이 활성.
      const lineY = 96;
      let current = headings[0].id;
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= lineY) current = h.id;
      }
      setActiveId((prev) => (prev === current ? prev : current));
    };

    recompute();
    window.addEventListener("scroll", recompute, { passive: true });
    window.addEventListener("resize", recompute);
    return () => {
      window.removeEventListener("scroll", recompute);
      window.removeEventListener("resize", recompute);
    };
  }, [toc, showToc]);

  const catColor = categoryColor(post.category);

  return (
    <div className={`${styles.detailWrap} ${showToc ? "" : styles.noToc}`}>
      <article className={styles.article} data-testid="article">
        <div className={styles.category}>
          <Link
            href={`/category/${encodeURIComponent(post.category)}`}
            className={styles.categoryLink}
            style={{ color: catColor }}
          >
            {post.category}
          </Link>
        </div>

        <h1 className={styles.title} data-testid="article-title">
          {post.title}
        </h1>

        <div className={styles.metaRow}>
          <span>{formatDate(post.date)}</span>
          <span>·</span>
          <span>{post.readingMinutes}분 읽기</span>
        </div>

        {showToc && <MobileToc items={toc} activeId={activeId} />}

        <div
          ref={bodyRef}
          className={styles.prose}
          data-testid="article-body"
          // 본문은 빌드타임에 신뢰된 .md 로부터 렌더된 HTML.
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        <Comments />
      </article>

      {showToc && <Toc items={toc} activeId={activeId} />}
    </div>
  );
}
