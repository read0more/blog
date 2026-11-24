import { describe, expect, test } from "vitest";
import { resolveTheme, THEME_SCRIPT } from "@/lib/theme-script";

describe("resolveTheme", () => {
  test("저장값이 있으면 시스템 설정보다 저장값을 따른다", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
  });

  test("저장값이 없거나 알 수 없는 값이면 시스템 설정을 따른다", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("light");
    expect(resolveTheme("sepia", true)).toBe("dark");
  });
});

/** 브라우저 대신 필요한 전역만 넘겨 <head> 스크립트를 실제로 실행하고 붙은 data-theme 을 돌려준다. */
function runThemeScript({
  stored,
  systemDark,
  storageBlocked = false,
}: {
  stored: string | null;
  systemDark: boolean;
  storageBlocked?: boolean;
}) {
  const attributes = new Map<string, string>();
  const document = {
    documentElement: {
      setAttribute: (name: string, value: string) =>
        attributes.set(name, value),
    },
  };
  const localStorage = {
    getItem: (key: string) => {
      if (storageBlocked) throw new Error("SecurityError");
      return key === "theme" ? stored : null;
    },
  };
  const matchMedia = (query: string) => ({
    matches: query === "(prefers-color-scheme: dark)" && systemDark,
  });
  new Function("document", "localStorage", "matchMedia", THEME_SCRIPT)(
    document,
    localStorage,
    matchMedia,
  );
  return attributes.get("data-theme");
}

describe("첫 페인트 전 스크립트", () => {
  test("저장값이 있으면 그 테마를 붙인다", () => {
    expect(runThemeScript({ stored: "dark", systemDark: false })).toBe("dark");
    expect(runThemeScript({ stored: "light", systemDark: true })).toBe("light");
  });

  test("저장값이 없으면 시스템 설정을 붙인다", () => {
    expect(runThemeScript({ stored: null, systemDark: true })).toBe("dark");
    expect(runThemeScript({ stored: null, systemDark: false })).toBe("light");
  });

  test("localStorage 를 못 쓰면 오류 없이 시스템 설정을 붙인다", () => {
    expect(
      runThemeScript({
        stored: "light",
        systemDark: true,
        storageBlocked: true,
      }),
    ).toBe("dark");
  });

  // 스크립트는 문자열로 따로 쓰므로 전환 버튼이 쓰는 resolveTheme 과 판단이 같은지 모든 경우를 맞춰 본다.
  test.each(
    [null, "light", "dark", "sepia", ""].flatMap((stored) =>
      [true, false].map((systemDark) => ({ stored, systemDark })),
    ),
  )(
    "저장값 $stored · 시스템 다크 $systemDark 에서 resolveTheme 과 같은 테마를 붙인다",
    ({ stored, systemDark }) => {
      expect(runThemeScript({ stored, systemDark })).toBe(
        resolveTheme(stored, systemDark),
      );
    },
  );
});
