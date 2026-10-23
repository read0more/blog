import { ViewTransition, type ReactNode } from "react";
import type { PostLanguage } from "@/lib/types";

/** 목록과 상세에서 같은 글의 제목·카테고리·날짜를 연결한다. */
export function PostElementTransition({
  slug,
  language,
  element,
  category = "",
  children,
}: {
  slug: string;
  language: PostLanguage;
  element: "title" | "category" | "date";
  category?: string;
  children: ReactNode;
}) {
  // 같은 카테고리/날짜를 가진 다른 글과 섞이지 않도록 slug를 포함한다.
  // 각 부분을 인코딩해 한글·공백·구두점도 유효한 CSS 식별자로 만든다.
  const id = [slug, category]
    .map((value) =>
      Array.from(value, (char) => char.codePointAt(0)?.toString(16)).join("-"),
    )
    .join("--");

  return (
    <ViewTransition
      name={`post-${element}-${language}-${id}`}
      share="post-element"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
