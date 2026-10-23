import { createTranslator } from "use-intl/core";
import { messages } from "../i18n/messages.mjs";

const translators = Object.fromEntries(
  Object.entries(messages).map(([locale, catalog]) => [
    locale,
    createTranslator({ locale, messages: catalog, namespace: "taxonomy" }),
  ]),
);

function label(namespace, name, language) {
  if (!Object.hasOwn(messages[language].taxonomy[namespace], name)) return name;
  return translators[language](`${namespace}.${name}`);
}

export function categoryLabel(name, language = "ko") {
  return label("categories", name, language);
}

export function tagLabel(name, language = "ko") {
  return label("tags", name, language);
}
