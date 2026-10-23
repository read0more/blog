import type { ReactNode } from "react";
import type { PostLanguage } from "@/lib/types";
import { getAllPostMeta, getAllTags, getCategories } from "@/lib/posts";
import { AppShell } from "./AppShell";

export async function SiteLayout({
  children,
  language,
}: {
  children: ReactNode;
  language: PostLanguage;
}) {
  const [originals, translations, tags, categories] = await Promise.all([
    getAllPostMeta("ko"),
    getAllPostMeta("en"),
    getAllTags(language),
    getCategories(language),
  ]);
  return (
    <html lang={language}>
      <body>
        <AppShell
          language={language}
          originalSlugs={originals.map((post) => post.slug)}
          translatedSlugs={translations.map((post) => post.slug)}
          categories={categories}
          tags={tags}
          totalCount={
            language === "ko" ? originals.length : translations.length
          }
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
