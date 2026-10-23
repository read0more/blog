import { createFormatter } from "use-intl/core";
import type { PostLanguage } from "./types";

const formatters = {
  ko: createFormatter({ locale: "ko", timeZone: "UTC" }),
  en: createFormatter({ locale: "en", timeZone: "UTC" }),
};

export function formatDate(iso: string, language: PostLanguage = "ko"): string {
  return formatters[language].dateTime(new Date(iso), {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
