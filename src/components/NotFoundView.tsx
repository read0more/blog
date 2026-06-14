import Link from "next/link";
import type { PostMeta } from "@/lib/types";
import styles from "./NotFoundView.module.css";

/** 최근 글 행의 우측 chevron 아이콘. */
function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--label-tertiary)" strokeWidth="2.2" strokeLinecap="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

interface NotFoundViewProps {
  /** 최근 글(최신순 상위 N개). */
  recentPosts: PostMeta[];
}

/**
 * 404 화면 — 큰 404 + 안내 + 홈 버튼 + 최근 글.
 * 디자인 read0more.dc.html 의 404 블록을 재현한다.
 */
export function NotFoundView({ recentPosts }: NotFoundViewProps) {
  return (
    <div className={styles.wrap} data-testid="not-found">
      <div className={styles.code}>404</div>
      <h1 className={styles.heading}>페이지를 찾을 수 없습니다</h1>
      <p className={styles.message}>
        주소가 바뀌었거나 삭제된 글일 수 있어요.
        <br />
        아래에서 다시 시작해 보세요.
      </p>

      <div className={styles.homeButtonWrap}>
        <Link href="/" className={styles.homeButton} data-testid="not-found-home">
          홈으로 돌아가기
        </Link>
      </div>

      {recentPosts.length > 0 && (
        <>
          <div className={styles.recentLabel}>최근 글</div>
          <div className={styles.recentList}>
            {recentPosts.map((p) => (
              <Link
                key={p.slug}
                href={`/posts/${p.slug}`}
                className={styles.recentRow}
                data-testid={`not-found-recent-${p.slug}`}
              >
                <span className={styles.recentTitle}>{p.title}</span>
                <ChevronRight />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
