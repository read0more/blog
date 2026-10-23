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
  const [posts, tags, categories] = await Promise.all([
    getAllPostMeta(language),
    getAllTags(language),
    getCategories(language),
  ]);
  return (
    <html lang={language}>
      <body>
        <AppShell
          language={language}
          categories={categories}
          tags={tags}
          totalCount={posts.length}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
