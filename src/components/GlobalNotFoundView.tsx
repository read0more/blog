"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Category, PostMeta } from "@/lib/types";
import { languageFromPath } from "@/lib/i18n";
import { AppShell } from "./layout/AppShell";
import { NotFoundView } from "./NotFoundView";

type SiteData = { posts: PostMeta[]; categories: Category[]; tags: string[] };
const subscribe = () => () => {};
const getLanguage = () => languageFromPath(window.location.pathname);
const getServerLanguage = () => "ko" as const;

export function GlobalNotFoundView({ ko, en }: { ko: SiteData; en: SiteData }) {
  const language = useSyncExternalStore(
    subscribe,
    getLanguage,
    getServerLanguage,
  );
  const data = language === "en" ? en : ko;
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return (
    <AppShell
      key={language}
      language={language}
      categories={data.categories}
      tags={data.tags}
      totalCount={data.posts.length}
    >
      <NotFoundView language={language} recentPosts={data.posts.slice(0, 3)} />
    </AppShell>
  );
}
