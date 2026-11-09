import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { categoryColor } from "@/lib/categories";
import { formatDate } from "@/lib/format";
import { getAllPostMeta, getPostBySlug } from "@/lib/posts";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { categoryLabel, tagLabel } from "@/lib/taxonomy.mjs";
import type { PostLanguage } from "@/lib/types";

// 정적 export: 빌드 때 아래 params마다 out/og/<language>/<file> PNG 파일로 굳는다.
export const dynamic = "force-static";
export const dynamicParams = false;

const LANGUAGES: PostLanguage[] = ["ko", "en"];

/** 언어별 기본 카드(index.png) + 그 언어로 공개된 글마다 <slug>.png. */
export async function generateStaticParams() {
  const params = [];
  for (const language of LANGUAGES) {
    params.push({ language, file: "index.png" });
    for (const post of await getAllPostMeta(language))
      params.push({ language, file: `${post.slug}.png` });
  }
  return params;
}

const LABEL = "#000000";
const SECONDARY = "rgba(60, 60, 67, 0.6)";
const FILL = "#f2f2f7";
const LOGO_BLUE = "#2196f3";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ language: string; file: string }> },
) {
  const { language: rawLanguage, file } = await params;
  const language: PostLanguage = rawLanguage === "en" ? "en" : "ko";
  const slug = decodeURIComponent(file).replace(/\.png$/, "");
  const post = slug === "index" ? null : await getPostBySlug(slug, language);
  const accent = post ? categoryColor(post.categories[0]) : LOGO_BLUE;
  const title = post?.title ?? SITE_NAME;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#ffffff",
        fontFamily: "Pretendard",
      }}
    >
      <div style={{ width: 16, height: "100%", background: accent }} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px 64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: LOGO_BLUE,
              color: "#ffffff",
              fontSize: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            R
          </div>
          <span style={{ fontSize: 30, color: LABEL }}>read0more</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {post && (
            <span style={{ fontSize: 30, color: accent }}>
              {categoryLabel(post.categories[0], language)}
            </span>
          )}
          <div
            style={{
              // ponytail: 길이로만 크기를 고른다. 3줄을 넘으면 말줄임.
              fontSize: title.length > 32 ? 60 : 72,
              lineHeight: 1.25,
              letterSpacing: -1.5,
              color: LABEL,
              wordBreak: "keep-all",
              display: "block",
              lineClamp: 3,
            }}
          >
            {title}
          </div>
          {!post && (
            <span style={{ fontSize: 32, color: SECONDARY }}>
              {SITE_DESCRIPTION[language]}
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            color: SECONDARY,
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            {post?.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "8px 18px",
                  borderRadius: 999,
                  background: FILL,
                }}
              >
                #{tagLabel(tag, language)}
              </span>
            ))}
          </div>
          {post && <span>{formatDate(post.date, language)}</span>}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Pretendard",
          data: await readFile(
            join(process.cwd(), "src/fonts/Pretendard-Bold.otf"),
          ),
          weight: 700,
        },
      ],
    },
  );
}
