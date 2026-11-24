import type { Metadata } from "next";
import { getAllPostMeta, getAllTags, getCategories } from "@/lib/posts";
import { GlobalNotFoundView } from "@/components/GlobalNotFoundView";
import { getUiTranslator } from "@/lib/i18n";
import { siteViewport } from "@/lib/site";
import { fontVariables } from "./fonts";
import { ThemeHead } from "./theme-head";
import "./globals.css";

export const metadata: Metadata = { title: "404 · read0more" };
export const viewport = siteViewport;

export default async function GlobalNotFound() {
  const [koPosts, enPosts, koCategories, enCategories, koTags, enTags] =
    await Promise.all([
      getAllPostMeta(),
      getAllPostMeta("en"),
      getCategories(),
      getCategories("en"),
      getAllTags(),
      getAllTags("en"),
    ]);
  return (
    <html lang="ko" className={fontVariables} suppressHydrationWarning>
      <ThemeHead />
      <body suppressHydrationWarning>
        <noscript>
          <p lang="en">
            {getUiTranslator("en")("notFoundTitle")}.{" "}
            <a href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/en/`}>
              {getUiTranslator("en")("englishHome")}
            </a>
          </p>
        </noscript>
        <GlobalNotFoundView
          ko={{ posts: koPosts, categories: koCategories, tags: koTags }}
          en={{ posts: enPosts, categories: enCategories, tags: enTags }}
        />
      </body>
    </html>
  );
}
