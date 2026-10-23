"use client";

import { useEffect } from "react";
import { getUiTranslator } from "@/lib/i18n";

export function LegacyEnglishRedirect({ slug }: { slug: string }) {
  const translate = getUiTranslator("en");
  const destination = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/en/posts/${encodeURIComponent(slug)}/`;
  useEffect(() => {
    window.location.replace(
      `${destination}${window.location.search}${window.location.hash}`,
    );
  }, [destination]);
  return (
    <section lang="en">
      <h1>{translate("legacyTitle")}</h1>
      <p>
        <a href={destination} data-testid="legacy-english-link">
          {translate("legacyContinue")}
        </a>
      </p>
    </section>
  );
}
