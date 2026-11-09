import type { Metadata } from "next";
import { sitePath } from "./i18n";
import { tagLabel } from "./taxonomy.mjs";
import type { Post, PostLanguage } from "./types";

// ponytail: 배포 주소 상수. 커스텀 도메인으로 옮기면 여기만 바꾼다.
const SITE_ORIGIN = "https://read0more.github.io";

export const SITE_NAME = "read0more's Blog";
export const SITE_DESCRIPTION: Record<PostLanguage, string> = {
  ko: "개인 기술 블로그",
  en: "Selected articles on frontend development, translated into English.",
};

/** 썸네일 PNG 경로. `src/app/og/[language]/[file]/route.tsx`가 빌드 때 만든다. */
export function ogImagePath(language: PostLanguage, name: string): string {
  return `/og/${language}/${name}.png`;
}

/**
 * 언어 루트 레이아웃 공통 메타데이터. 카톡 등은 상대 주소를 읽지 못하므로
 * metadataBase에 basePath까지 넣어 og:url·og:image를 절대 주소로 만든다.
 * 홈·카테고리·태그 페이지는 여기의 기본 썸네일을 물려받는다.
 */
export function siteMetadata(language: PostLanguage): Metadata {
  return {
    metadataBase: new URL(`${SITE_ORIGIN}${process.env.BASE_PATH ?? ""}/`),
    description: SITE_DESCRIPTION[language],
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      images: [
        { url: ogImagePath(language, "index"), width: 1200, height: 630 },
      ],
    },
    twitter: { card: "summary_large_image" },
  };
}

/** 글 상세 메타데이터. 자식의 openGraph는 레이아웃 것을 통째로 덮으므로 전부 채운다. */
export function postMetadata(post: Post): Metadata {
  return {
    title: `${post.title} · read0more`,
    description: post.description,
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title: post.title,
      description: post.description,
      url: sitePath(post.language, `/posts/${post.slug}/`),
      publishedTime: post.date,
      tags: post.tags.map((tag) => tagLabel(tag, post.language)),
      images: [
        {
          url: ogImagePath(post.language, post.slug),
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
  };
}
