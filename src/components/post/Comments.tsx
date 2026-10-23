"use client";

import { useEffect, useRef } from "react";
import type { PostLanguage } from "@/lib/types";
import { getUiTranslator } from "@/lib/i18n";
import styles from "./Comments.module.css";

/** giscus 설정(빌드타임 env). 미설정 시 안내만 표시한다. */
const GISCUS_REPO = process.env.NEXT_PUBLIC_GISCUS_REPO; // "owner/repo"
const GISCUS_REPO_ID = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
const GISCUS_CATEGORY_ID = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

const isConfigured = Boolean(
  GISCUS_REPO && GISCUS_REPO_ID && GISCUS_CATEGORY_ID,
);

function GitHubMark() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.85.09-.66.35-1.12.63-1.37-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.4 9.4 0 0 1 12 6.84c.85 0 1.71.12 2.51.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

/**
 * 댓글 — giscus(GitHub Discussions). PRD: pathname 매핑, 라이트 테마, 클라이언트 임베드.
 * 대상 repo 의 Discussions 활성화 + giscus 앱 설치 + repo/category ID 가
 * env(NEXT_PUBLIC_GISCUS_*)로 주입돼야 동작한다. 미설정 시 안내만 표시.
 */
export function Comments({ language = "ko" }: { language?: PostLanguage }) {
  const translate = getUiTranslator(language);
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isConfigured) return;
    const el = mountRef.current;
    if (!el) return;
    // 중복 마운트 방지(라우트 전환/리렌더).
    if (el.querySelector("script, iframe")) return;

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", GISCUS_REPO!);
    script.setAttribute("data-repo-id", GISCUS_REPO_ID!);
    script.setAttribute("data-category-id", GISCUS_CATEGORY_ID!);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", "light");
    script.setAttribute("data-loading", "lazy");
    script.setAttribute("data-lang", language);
    el.appendChild(script);
  }, [language]);

  return (
    <section className={styles.section} data-testid="comments">
      <div className={styles.head}>
        <h2 className={styles.heading}>{translate("comments")}</h2>
        <span className={styles.badge}>
          <GitHubMark />
          giscus · GitHub Discussions
        </span>
      </div>

      <div className={styles.loginBox}>
        <div className={styles.loginText}>{translate("loginRequired")}</div>
      </div>

      {isConfigured ? (
        <div
          ref={mountRef}
          className={styles.giscusMount}
          data-testid="giscus-mount"
        />
      ) : (
        <div className={styles.placeholder} data-testid="giscus-placeholder">
          {translate("commentsPlaceholder")}
        </div>
      )}
    </section>
  );
}
