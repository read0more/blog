import Link from "next/link";
import type { PostMeta } from "@/lib/types";
import { categoryColor } from "@/lib/categories";
import { formatDate } from "@/lib/format";
import styles from "./PostList.module.css";

interface PostListProps {
  title: string;
  subtitle: string;
  posts: PostMeta[];
}

/**
 * 홈/카테고리 공용 글 목록.
 * 헤더(제목 + 부제) + 글 카드(메타행 / 제목 / 설명).
 * 카드 클릭 시 글 상세(/posts/[slug])로 이동.
 */
export function PostList({ title, subtitle, posts }: PostListProps) {
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

      <ul className={styles.list}>
        {posts.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/posts/${p.slug}`}
              className={styles.card}
              data-testid={`post-card-${p.slug}`}
            >
              <div className={styles.meta}>
                <span
                  className={styles.metaCategory}
                  style={{ color: categoryColor(p.category) }}
                >
                  {p.category}
                </span>
                <span className={styles.metaDot}>·</span>
                <span className={styles.metaText}>{formatDate(p.date)}</span>
                <span className={styles.metaDot}>·</span>
                <span className={styles.metaText}>{p.readingMinutes}분</span>
              </div>
              <h2 className={styles.cardTitle}>{p.title}</h2>
              <p className={styles.cardDesc}>{p.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
