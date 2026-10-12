import Link from "next/link";
import styles from "./TagChips.module.css";

interface TagChipsProps {
  tags: string[];
  /** 현재 보고 있는 태그(태그 페이지의 상단 태그 줄에서 강조). */
  activeTag?: string;
  className?: string;
}

/**
 * #태그 칩 묶음 — 목록 상단 태그 줄 / 글 카드 / 글 상세 공용.
 * 태그 slug 는 카테고리와 같이 한글 그대로 허용하므로 encodeURIComponent 로 링크를 만든다.
 */
export function TagChips({ tags, activeTag, className }: TagChipsProps) {
  if (tags.length === 0) return null;
  return (
    <div className={`${styles.chips} ${className ?? ""}`} data-testid="tags">
      {tags.map((t) => (
        <Link
          key={t}
          href={`/tag/${encodeURIComponent(t)}`}
          className={`${styles.chip} ${t === activeTag ? styles.active : ""}`}
          data-testid={`tag-chip-${t}`}
          aria-current={t === activeTag ? "page" : undefined}
        >
          #{t}
        </Link>
      ))}
    </div>
  );
}
