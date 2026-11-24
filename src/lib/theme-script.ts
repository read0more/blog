import type { Theme } from "./theme";

/*
 * 서버 컴포넌트(루트 레이아웃)도 가져다 쓰는 테마 공용 값과 첫 페인트 전 스크립트.
 * React 훅이 없어야 서버에서 불러올 수 있으므로 useTheme 이 있는 theme.ts 와 나눈다.
 */

/** 전환 버튼이 고른 테마를 저장하는 localStorage 키. */
export const THEME_STORAGE_KEY = "theme";

/** 테마별 브라우저 상단 색(theme-color). colors.css 의 --paper 와 같은 값으로 맞춘다. */
export const THEME_COLORS: Record<Theme, string> = {
  light: "#ffffff",
  dark: "#111113",
};

/** 저장값이 "light"·"dark" 면 그 값을, 아니면 시스템 설정을 따른다. */
export function resolveTheme(
  stored: string | null,
  prefersDark: boolean,
): Theme {
  return stored === "light" || stored === "dark"
    ? stored
    : prefersDark
      ? "dark"
      : "light";
}

/**
 * <head> 에 그대로 넣는 첫 페인트 전 스크립트. 저장값(없으면 시스템 설정)으로 <html data-theme> 를 붙인다.
 * localStorage 를 못 쓰는 환경(사생활 보호 모드 등)에서는 시스템 설정으로 정한다.
 * 컴파일러를 거치지 않고 HTML 에 그대로 들어가므로 ES5 문자열로 직접 쓴다.
 * resolveTheme 과 같은 판단인지는 tests/unit/theme.test.ts 가 모든 경우를 실행해 맞춰 본다.
 */
export const THEME_SCRIPT = `(function(){var t;try{t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})}catch(e){}if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)})()`;
