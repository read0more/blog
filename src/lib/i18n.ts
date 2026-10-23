import { createTranslator } from "use-intl/core";
import { messages } from "@/i18n/messages.mjs";
import type { PostLanguage } from "./types";

export function sitePath(language: PostLanguage, pathname = "/"): string {
  return language === "en" ? `/en${pathname}` : pathname;
}

export function languageFromPath(pathname: string): PostLanguage {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const localPath =
    basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))
      ? pathname.slice(basePath.length)
      : pathname;
  return localPath === "/en" || localPath.startsWith("/en/") ? "en" : "ko";
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
