import { ViewTransition, type ReactNode } from "react";
import type { PostLanguage } from "@/lib/types";

/** 목록과 상세에서 같은 글의 제목을 연결한다. DOM 래퍼는 추가하지 않는다. */
export function PostTitleTransition({
  slug,
  language,
  children,
}: {
  slug: string;
  language: PostLanguage;
  children: ReactNode;
}) {
  // 한글·공백·구두점이 있는 파일명도 충돌 없는 CSS 식별자로 만든다.
  const id = Array.from(slug, (char) => char.codePointAt(0)?.toString(16)).join(
    "-",
  );

  return (
    <ViewTransition
      name={`post-title-${language}-${id}`}
      share="post-title"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
