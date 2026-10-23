import { Fragment } from "react";
import Link from "next/link";
import type { PostMeta, PostLanguage } from "@/lib/types";
import { sitePath, getUiTranslator } from "@/lib/i18n";
import { categoryLabel } from "@/lib/taxonomy.mjs";
import { categoryColor } from "@/lib/categories";
import { formatDate } from "@/lib/format";
import { TagChips } from "./TagChips";
import { PostTitleTransition } from "./PostTitleTransition";
import styles from "./PostList.module.css";

interface PostListProps {
  language?: PostLanguage;
  title: string;
  subtitle: string;
  posts: PostMeta[];
  /** 헤더 아래 태그 줄에 보여줄 태그(없으면 줄 자체를 그리지 않는다). */
  tags?: string[];
  activeTag?: string;
}

/**
 * 홈/카테고리/태그 공용 글 목록.
 * 헤더(제목 + 부제 + 태그 줄) + 글 카드(메타행 / 제목 / 설명 / 태그).
 * 카드 클릭 시 글 상세(/posts/[slug])로 이동.
 */
export function PostList({
  language = "ko",
  title,
  subtitle,
  posts,
  tags = [],
  activeTag,
}: PostListProps) {
  return (
    <div data-testid="post-list">
      <div className={styles.header}>
        <h1 className={styles.title} data-testid="list-title">
          {title}
        </h1>
        <div className={styles.subtitle} data-testid="list-subtitle">
          {subtitle}
        </div>
        <TagChips
          language={language}
          tags={tags}
          activeTag={activeTag}
          className={styles.headerTags}
        />
      </div>

      {posts.length === 0 && (
        <p data-testid="posts-empty">
          {getUiTranslator(language)("emptyPosts")}
        </p>
      )}

      <ul className={styles.list}>
        {posts.map((p) => (
          // 태그 칩도 링크라 카드 링크 안에 넣으면 <a> 가 중첩된다 — 형제로 둔다.
          <li key={p.slug} className={styles.card}>
            <Link
              href={sitePath(language, `/posts/${p.slug}`)}
              className={styles.cardLink}
              data-testid={`post-card-${p.slug}`}
            >
              <div className={styles.meta}>
                {p.categories.map((c, i) => (
                  <Fragment key={c}>
                    {i > 0 && <span className={styles.metaDot}>·</span>}
                    <span
                      className={styles.metaCategory}
                      style={{ color: categoryColor(c) }}
                    >
                      {categoryLabel(c, language)}
                    </span>
                  </Fragment>
                ))}
                <span className={styles.metaDot}>·</span>
                <span className={styles.metaText}>
                  {formatDate(p.date, language)}
                </span>
                {/* <span className={styles.metaDot}>·</span> */}
                {/* <span className={styles.metaText}>{p.readingMinutes}분</span> */}
              </div>
              <PostTitleTransition slug={p.slug} language={language}>
                <h2 className={styles.cardTitle}>{p.title}</h2>
              </PostTitleTransition>
              <p className={styles.cardDesc}>{p.description}</p>
            </Link>
            <TagChips
              tags={p.tags}
              className={styles.cardTags}
              language={language}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
