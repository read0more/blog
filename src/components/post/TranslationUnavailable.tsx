import Link from "next/link";
import { getUiTranslator } from "@/lib/i18n";
import styles from "./Article.module.css";

export function TranslationUnavailable({ slug }: { slug: string }) {
  const translate = getUiTranslator("en");
  return (
    <section
      lang="en"
      className={styles.notice}
      data-testid="translation-unavailable"
    >
      <h1>{translate("translationUnavailable")}</h1>
      <p>{translate("translationUnavailableMessage")}</p>
      <Link href={`/posts/${encodeURIComponent(slug)}/`} hrefLang="ko">
        {translate("readOriginal")}
      </Link>
    </section>
  );
}
