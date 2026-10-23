import assert from "node:assert/strict";
import { parse, TYPE } from "@formatjs/icu-messageformat-parser";

function flatten(catalog, prefix = "") {
  return Object.fromEntries(
    Object.entries(catalog).flatMap(([key, value]) => {
      assert(!key.includes("."), `Message keys must not contain dots: ${key}`);
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "object" && value !== null) {
        return Object.entries(flatten(value, path));
      }
      assert(
        typeof value === "string" && value.trim(),
        `Empty message: ${path}`,
      );
      return [[path, value]];
    }),
  );
}

function argumentsOf(message) {
  const argumentsFound = new Set();
  function visit(elements) {
    for (const element of elements) {
      if (element.type !== TYPE.literal && element.type !== TYPE.pound) {
        argumentsFound.add(element.value);
      }
      if ("options" in element) {
        for (const option of Object.values(element.options))
          visit(option.value);
      }
      if ("children" in element) visit(element.children);
    }
  }
  visit(parse(message));
  return [...argumentsFound].sort();
}

export function validateMessages(catalogs) {
  const [referenceLocale, referenceCatalog] = Object.entries(catalogs)[0];
  const reference = flatten(referenceCatalog);
  const keys = Object.keys(reference).sort();
  for (const [locale, catalog] of Object.entries(catalogs)) {
    const translated = flatten(catalog);
    assert.deepEqual(
      Object.keys(translated).sort(),
      keys,
      `${locale}: message keys differ from ${referenceLocale}`,
    );
    for (const key of keys) {
      assert.deepEqual(
        argumentsOf(translated[key]),
        argumentsOf(reference[key]),
        `${locale}.${key}: ICU arguments differ from ${referenceLocale}`,
      );
    }
  }
  return keys.length;
}
