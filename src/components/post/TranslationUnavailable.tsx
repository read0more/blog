import Link from "next/link";
import { getUiTranslator } from "@/lib/i18n";

export function TranslationUnavailable({ slug }: { slug: string }) {
  const translate = getUiTranslator("en");
  return (
    <section lang="en" data-testid="translation-unavailable">
      <h1>{translate("translationUnavailable")}</h1>
      <p>{translate("translationUnavailableMessage")}</p>
      <Link href={`/posts/${encodeURIComponent(slug)}/`} hrefLang="ko">
        {translate("readOriginal")}
      </Link>
    </section>
  );
}
