import { createTranslator } from "use-intl/core";
import { messages } from "@/i18n/messages.mjs";
import type { PostLanguage } from "./types";

export function sitePath(language: PostLanguage, pathname = "/"): string {
  return language === "en" ? `/en${pathname}` : pathname;
}

function withoutBasePath(pathname: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return basePath &&
    (pathname === basePath || pathname.startsWith(`${basePath}/`))
    ? pathname.slice(basePath.length)
    : pathname;
}

export function languageFromPath(pathname: string): PostLanguage {
  const localPath = withoutBasePath(pathname);
  return localPath === "/en" || localPath.startsWith("/en/") ? "en" : "ko";
}

export function languageSwitchTarget(
  language: PostLanguage,
  pathname: string,
  originalSlugs: readonly string[],
  translatedSlugs: readonly string[],
) {
  const targetLanguage: PostLanguage = language === "ko" ? "en" : "ko";
  const prefix = sitePath(language, "/posts/");
  const localPath = withoutBasePath(pathname);
  const segment = localPath.startsWith(prefix)
    ? localPath.slice(prefix.length).replace(/\/$/, "")
    : "";
  let slug = "";
  try {
    if (!segment.includes("/")) slug = decodeURIComponent(segment);
  } catch {
    slug = "";
  }
  const isPost = originalSlugs.includes(slug);
  const hasCounterpart =
    isPost && (language === "en" || translatedSlugs.includes(slug));
  return {
    language: targetLanguage,
    href: hasCounterpart
      ? sitePath(targetLanguage, `/posts/${encodeURIComponent(slug)}/`)
      : sitePath(targetLanguage),
    label: getUiTranslator(targetLanguage)(
      isPost && !hasCounterpart ? "languageHome" : "languageName",
    ),
  };
}

const translators = {
  ko: createTranslator({
    locale: "ko",
    messages: messages.ko,
    namespace: "ui",
  }),
  en: createTranslator({
    locale: "en",
    messages: messages.en,
    namespace: "ui",
  }),
};

export function getUiTranslator(language: PostLanguage) {
  return translators[language];
}
