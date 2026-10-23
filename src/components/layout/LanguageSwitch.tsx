import Link from "next/link";
import { languageSwitchTarget } from "@/lib/i18n";
import type { PostLanguage } from "@/lib/types";
import styles from "./AppShell.module.css";

export function LanguageSwitch({
  language,
  pathname,
  originalSlugs,
  translatedSlugs,
}: {
  language: PostLanguage;
  pathname: string;
  originalSlugs: readonly string[];
  translatedSlugs: readonly string[];
}) {
  const target = languageSwitchTarget(
    language,
    pathname,
    originalSlugs,
    translatedSlugs,
  );
  return (
    <Link
      href={target.href}
      className={styles.languageLink}
      lang={target.language}
      hrefLang={target.language}
      data-testid="site-language-switch"
    >
      {target.label}
    </Link>
  );
}
