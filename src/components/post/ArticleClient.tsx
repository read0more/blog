"use client";

import { Fragment, memo, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Post } from "@/lib/types";
import { categoryColor } from "@/lib/categories";
import { formatDate } from "@/lib/format";
import { Toc } from "./Toc";
import { MobileToc } from "./MobileToc";
import { Comments } from "./Comments";
import "photoswipe/style.css";
import { useImageLightbox } from "./useImageLightbox";
import styles from "./Article.module.css";

interface ArticleClientProps {
  post: Post;
}

const COPY_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>`;

/**
 * 본문 HTML. activeId(scroll-spy) 변경으로 ArticleClient 가 리렌더돼도
 * 이 컴포넌트는 props(html)가 그대로면 리렌더되지 않는다.
 * → React 가 dangerouslySetInnerHTML 을 다시 적용해 enhance(코드 헤더)된 DOM 을
 *   지우고 heading 노드를 detach 시키는 문제를 막는다(목차 고정 버그의 근본 원인).
 */
const Prose = memo(function Prose({
  html,
  innerRef,
}: {
  html: string;
  innerRef: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={innerRef}
      className={styles.prose}
      data-testid="article-body"
      // 본문은 빌드타임에 신뢰된 .md 로부터 렌더된 HTML.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

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
  // 목차 클릭/해시로 active 를 고른 직후엔 scroll-spy 가 덮어쓰지 못하게 잠근다.
  // 사용자가 직접 스크롤(휠/터치/스크롤키)하면 해제된다.
  const lockRef = useRef(false);

  // 목차 항목 클릭(클릭 이벤트 핸들러): active 고정 + 잠금.
  const selectFromToc = (id: string) => {
    lockRef.current = true;
    setActiveId(id);
  };

  // ---- 본문 이미지 라이트박스 ----
  useImageLightbox(bodyRef, post.contentHtml);

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

    // 해시로 직접 진입한 경우, 첫 recompute 에서 해당 항목을 강제 active 로 잡고 잠근다.
    // 안 그러면 브라우저가 앵커(바닥 근처)로 점프한 뒤 scroll-spy 가 마지막 heading 을 잡는다.
    let pendingHash = (() => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      return hash && toc.some((t) => t.id === hash) ? hash : null;
    })();

    const recompute = () => {
      if (pendingHash) {
        const id = pendingHash;
        pendingHash = null;
        lockRef.current = true;
        setActiveId((prev) => (prev === id ? prev : id));
        return;
      }
      // 목차 클릭/해시 선택으로 잠긴 동안엔 active 를 그대로 유지한다.
      if (lockRef.current) return;
      // heading 노드는 매번 새로 조회한다. 한 번 캡처해 두면 본문 DOM 이 교체될 때
      // detach 되어 getBoundingClientRect 가 모두 0 → 항상 마지막이 활성되는 버그가 생긴다.
      const headings = toc
        .map((t) => root.querySelector<HTMLElement>(`#${CSS.escape(t.id)}`))
        .filter((el): el is HTMLElement => el !== null);
      if (!headings.length) return;

      // 헤더(57px) + 여유를 둔 기준선. 이 선 위로 올라온 마지막 heading 이 활성.
      const lineY = 96;
      const scrollY = window.scrollY;
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );

      // heading 별 활성화 scrollY 임계값(= 절대 top - lineY).
      const thresholds = headings.map(
        (h) => h.getBoundingClientRect().top + scrollY - lineY,
      );
      // 페이지가 짧아 기준선까지 끌어올릴 수 없는 말단 heading 들은 영원히 활성되지
      // 않는다(맨 아래로 스크롤해도 직전 heading 에 멈춤). 도달 불가한 임계값들을
      // [직전 도달 가능 임계값, maxScroll] 구간에 균등 배분해 끝까지 추적되게 한다.
      const firstUnreachable = thresholds.findIndex((t) => t > maxScroll);
      if (firstUnreachable !== -1 && maxScroll > 0) {
        const base =
          firstUnreachable === 0 ? 0 : thresholds[firstUnreachable - 1];
        const count = headings.length - firstUnreachable;
        for (let i = firstUnreachable; i < headings.length; i++) {
          const ratio = (i - firstUnreachable + 1) / count;
          thresholds[i] = base + (maxScroll - base) * ratio;
        }
      }

      let current = headings[0].id;
      for (let i = 0; i < headings.length; i++) {
        // -1: 바닥에서의 부동소수/서브픽셀 오차 보정.
        if (scrollY >= thresholds[i] - 1) current = headings[i].id;
      }
      setActiveId((prev) => (prev === current ? prev : current));
    };

    // 사용자가 직접 스크롤하면 잠금 해제. recompute 는 부르지 않고 잠금만 풀어,
    // 뒤이어 발생하는 실제 scroll 이벤트가 자연히 active 를 갱신하게 한다
    // (바닥에서 무의미한 아래 휠로 active 가 튀는 것을 방지).
    const unlock = () => {
      lockRef.current = false;
    };
    const SCROLL_KEYS = new Set([
      "ArrowDown",
      "ArrowUp",
      "PageDown",
      "PageUp",
      "Home",
      "End",
      " ",
    ]);
    const onKey = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) lockRef.current = false;
    };

    recompute();
    window.addEventListener("scroll", recompute, { passive: true });
    window.addEventListener("resize", recompute);
    window.addEventListener("wheel", unlock, { passive: true });
    window.addEventListener("touchmove", unlock, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", recompute);
      window.removeEventListener("resize", recompute);
      window.removeEventListener("wheel", unlock);
      window.removeEventListener("touchmove", unlock);
      window.removeEventListener("keydown", onKey);
    };
  }, [toc, showToc]);

  return (
    <div className={`${styles.detailWrap} ${showToc ? "" : styles.noToc}`}>
      <article className={styles.article} data-testid="article">
        <div className={styles.category}>
          {post.categories.map((c, i) => (
            <Fragment key={c}>
              {i > 0 && <span className={styles.metaDot}>·</span>}
              <Link
                href={`/category/${encodeURIComponent(c)}`}
                className={styles.categoryLink}
                style={{ color: categoryColor(c) }}
              >
                {c}
              </Link>
            </Fragment>
          ))}
        </div>

        <h1 className={styles.title} data-testid="article-title">
          {post.title}
        </h1>

        <div className={styles.metaRow}>
          <span>{formatDate(post.date)}</span>
          {/* <span>·</span>
          <span>{post.readingMinutes}분 읽기</span> */}
        </div>

        {showToc && (
          <MobileToc items={toc} activeId={activeId} onSelect={selectFromToc} />
        )}

        <Prose html={post.contentHtml} innerRef={bodyRef} />

        <Comments />
      </article>

      {showToc && (
        <Toc items={toc} activeId={activeId} onSelect={selectFromToc} />
      )}
    </div>
  );
}
