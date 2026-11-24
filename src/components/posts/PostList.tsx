import { Fragment, useId } from "react";
import Link from "next/link";
import type { PostMeta, PostLanguage } from "@/lib/types";
import { sitePath, getUiTranslator } from "@/lib/i18n";
import { categoryLabel } from "@/lib/taxonomy.mjs";
import { formatDate } from "@/lib/format";
import { TagChips } from "./TagChips";
import { PostElementTransition } from "./PostElementTransition";
import styles from "./PostList.module.css";

interface PostListProps {
  language?: PostLanguage;
  title: string;
  subtitle: string;
  posts: PostMeta[];
  /** 목록 아래 태그 줄에 보여줄 태그(없으면 줄 자체를 그리지 않는다). */
  tags?: string[];
  activeTag?: string;
}

type ItemProps = { post: PostMeta; language: PostLanguage };

/** 카테고리 표시(여러 개면 가운뎃점으로 잇는다). 색은 감싸는 줄에서 물려받는다. */
function Categories({ post, language }: ItemProps) {
  return post.categories.map((c, i) => (
    <Fragment key={c}>
      {i > 0 && <span aria-hidden="true">·</span>}
      <PostElementTransition
        slug={post.slug}
        language={language}
        element="category"
        category={c}
      >
        <span>{categoryLabel(c, language)}</span>
      </PostElementTransition>
    </Fragment>
  ));
}

function PostDate({ post, language }: ItemProps) {
  return (
    <PostElementTransition slug={post.slug} language={language} element="date">
      <time className={styles.date} dateTime={post.date}>
        {formatDate(post.date, language)}
      </time>
    </PostElementTransition>
  );
}

function PostTitle({
  post,
  language,
  className,
}: ItemProps & { className: string }) {
  return (
    <PostElementTransition slug={post.slug} language={language} element="title">
      <h2 className={className}>{post.title}</h2>
    </PostElementTransition>
  );
}

/**
 * 최신 글과 그리드 카드. 태그도 링크라 카드 링크 안에 넣으면 <a> 가 중첩되므로
 * 카드 링크의 형제로 둔다.
 */
function Card({
  post,
  language,
  variant,
  kicker,
}: ItemProps & { variant: "lead" | "grid"; kicker?: string }) {
  return (
    <li>
      <Link
        href={sitePath(language, `/posts/${post.slug}`)}
        className={styles.cardLink}
        data-testid={`post-card-${post.slug}`}
      >
        <div className={styles.kicker}>
          <Categories post={post} language={language} />
          {kicker && (
            <>
              <span aria-hidden="true">·</span>
              <span>{kicker}</span>
            </>
          )}
        </div>
        <PostTitle
          post={post}
          language={language}
          className={styles[`${variant}Title`]}
        />
        <p className={styles[`${variant}Desc`]}>{post.description}</p>
        <PostDate post={post} language={language} />
      </Link>
      <TagChips
        tags={post.tags}
        language={language}
        className={styles.cardTags}
      />
    </li>
  );
}

/**
 * 홈/카테고리/태그 공용 글 목록.
 * 작은 머리줄(제목 + 부제) 아래에 최신 글 1개, 2~5번째 글의 `이어서 읽기` 순번 목록,
 * 6번째부터의 3단 그리드, 태그 줄을 차례로 놓고 있는 구역만 그린다.
 */
export function PostList({
  language = "ko",
  title,
  subtitle,
  posts,
  tags = [],
  activeTag,
}: PostListProps) {
  const t = getUiTranslator(language);
  // 태그 줄과 이어서 읽기 목록의 이름을 보이는 라벨에 연결한다.
  const id = useId();
  const [lead, ...others] = posts;
  const next = others.slice(0, 4);
  const rest = others.slice(4);

  return (
    <div data-testid="post-list">
      <div className={styles.header}>
        <h1 className={styles.title} data-testid="list-title">
          {title}
        </h1>
        <div className={styles.subtitle} data-testid="list-subtitle">
          {subtitle}
        </div>
      </div>

      {posts.length === 0 && <p data-testid="posts-empty">{t("emptyPosts")}</p>}

      {lead && (
        <div className={styles.top}>
          <ul className={styles.leadList}>
            <Card
              post={lead}
              language={language}
              variant="lead"
              kicker={t("latestPost")}
            />
          </ul>
          {next.length > 0 && (
            <div className={styles.next}>
              <p id={`${id}-next`} className={styles.label}>
                {t("readNext")}
              </p>
              <ol className={styles.nextList} aria-labelledby={`${id}-next`}>
                {next.map((p, i) => (
                  <li key={p.slug} className={styles.nextItem}>
                    <Link
                      href={sitePath(language, `/posts/${p.slug}`)}
                      className={styles.nextLink}
                      data-testid={`post-card-${p.slug}`}
                    >
                      <span className={styles.nextNum} aria-hidden="true">
                        {i + 2}
                      </span>
                      <div className={styles.nextBody}>
                        <PostTitle
                          post={p}
                          language={language}
                          className={styles.nextTitle}
                        />
                        <div className={styles.nextMeta}>
                          <Categories post={p} language={language} />
                          <span aria-hidden="true">·</span>
                          <PostDate post={p} language={language} />
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {rest.length > 0 && (
        <ul className={styles.grid}>
          {rest.map((p) => (
            <Card key={p.slug} post={p} language={language} variant="grid" />
          ))}
        </ul>
      )}

      {tags.length > 0 && (
        <div
          className={styles.tagFooter}
          role="group"
          aria-labelledby={`${id}-tags`}
        >
          <span id={`${id}-tags`} className={styles.label}>
            {t("tags")}
          </span>
          <TagChips
            language={language}
            tags={tags}
            activeTag={activeTag}
            className={styles.footerTags}
          />
        </div>
      )}
    </div>
  );
}
