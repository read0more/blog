"use client";

import type { PostLanguage } from "@/lib/types";
import { getUiTranslator } from "@/lib/i18n";
import { setTheme, useTheme, useThemeSync } from "@/lib/theme";
import { MoonIcon, SunIcon } from "./icons";
import styles from "./AppShell.module.css";

/**
 * 라이트·다크 전환 버튼. 라벨은 지금 누르면 일어날 일을 말한다.
 * 정적 HTML 은 테마를 모르므로 두 아이콘을 다 그려 두고 <html data-theme> 에 맞는 하나를 CSS 로 보인다.
 * 라벨은 hydration 동안 라이트 기준이었다가 마운트 뒤 실제 테마로 바뀐다(useTheme).
 */
export function ThemeToggle({ language }: { language: PostLanguage }) {
  useThemeSync();
  const next = useTheme() === "dark" ? "light" : "dark";
  const translate = getUiTranslator(language);
  return (
    <button
      type="button"
      className={`${styles.iconButton} ${styles.themeToggle}`}
      aria-label={translate(next === "dark" ? "switchToDark" : "switchToLight")}
      onClick={() => setTheme(next)}
      data-testid="theme-toggle"
    >
      <MoonIcon className={styles.moonIcon} />
      <SunIcon className={styles.sunIcon} />
    </button>
  );
}
