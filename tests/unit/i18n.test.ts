import { test, expect, vi } from "vitest";
import { getUiTranslator, languageSwitchTarget } from "../../src/lib/i18n";
import { formatDate } from "../../src/lib/format";
import { categoryLabel, tagLabel } from "../../src/lib/taxonomy.mjs";
import { messages } from "../../src/i18n/messages.mjs";
import { validateMessages } from "../../src/i18n/validate-messages.mjs";

test("번역 카탈로그는 동일한 키와 ICU 변수를 갖는다", () => {
  expect(validateMessages(messages)).toBeGreaterThan(0);
  expect(() => validateMessages({ ko: { title: "제목" }, en: {} })).toThrow();
  expect(() =>
    validateMessages({ ko: { title: "{query}" }, en: { title: "{name}" } }),
  ).toThrow(/ICU arguments/);
  expect(() =>
    validateMessages({ ko: { title: "제목" }, en: { title: "" } }),
  ).toThrow(/Empty message/);
  expect(() =>
    validateMessages({
      ko: { title: "제목" },
      en: { title: "{count, plural," },
    }),
  ).toThrow();
});

test("ICU는 0·1·복수 개수와 사용자 검색어를 처리한다", () => {
  const english = getUiTranslator("en");
  expect(english("postCount", { count: 0 })).toBe("0 posts");
  expect(english("postCount", { count: 1 })).toBe("1 post");
  expect(english("postCount", { count: 2 })).toBe("2 posts");
  expect(english("resultCount", { count: 1 })).toBe("1 result");
  expect(english("resultCount", { count: 2 })).toBe("2 results");
  expect(english("noResults", { query: "<script>{count}</script>" })).toBe(
    "No results for “<script>{count}</script>”",
  );
  expect(getUiTranslator("ko")("postCount", { count: 2 })).toBe("2개의 글");
});

test("날짜 포맷은 명시적인 UTC 날짜를 사용한다", () => {
  const instant = "2026-10-21T23:30:00Z";
  expect(formatDate(instant, "ko")).toBe("2026년 10월 21일");
  expect(formatDate(instant, "en")).toBe("October 21, 2026");
});

test("분류 번역은 같은 카탈로그를 사용하고 미등록 식별자는 유지한다", () => {
  expect(categoryLabel("생각들", "en")).toBe("Thoughts");
  expect(categoryLabel("생각들", "ko")).toBe("생각들");
  expect(tagLabel("렌더링", "en")).toBe("Rendering");
  expect(tagLabel("React.js", "en")).toBe("React.js");
});

test.each([
  ["ko", "/posts/translated/", "/en/posts/translated/", "English"],
  ["en", "/en/posts/translated/", "/posts/translated/", "한국어"],
  ["ko", "/posts/korean-only/", "/en/", "English home"],
  ["en", "/en/posts/korean-only/", "/posts/korean-only/", "한국어"],
  ["ko", "/", "/en/", "English"],
  ["en", "/en/category/React/", "/", "한국어"],
  ["en", "/en/posts/unknown/", "/", "한국어"],
  ["ko", "/posts/%ZZ/", "/en/", "English"],
] as const)("헤더 전환 %s %s → %s", (language, pathname, href, label) => {
  expect(
    languageSwitchTarget(
      language,
      pathname,
      ["translated", "korean-only"],
      ["translated"],
    ),
  ).toMatchObject({ href, label });
});

test("헤더 전환은 basePath와 인코딩된 글 식별자를 처리한다", () => {
  vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/blog");
  try {
    expect(
      languageSwitchTarget(
        "ko",
        "/blog/posts/%ED%95%9C%EA%B8%80/",
        ["한글"],
        ["한글"],
      ).href,
    ).toBe("/en/posts/%ED%95%9C%EA%B8%80/");
  } finally {
    vi.unstubAllEnvs();
  }
});
