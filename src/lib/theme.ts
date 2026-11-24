import { useLayoutEffect, useSyncExternalStore } from "react";
import { resolveTheme, THEME_STORAGE_KEY } from "./theme-script";

export type Theme = "light" | "dark";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * <html data-theme> 의 현재 값. 첫 페인트 전 스크립트가 붙인 값이 없으면 라이트로 본다.
 * hydration 직후 이펙트처럼 useTheme 이 아직 서버 값("light")일 때는 이것을 직접 읽는다.
 */
export function readTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

const readServerTheme = (): Theme => "light";

/** 현재 화면 테마. 서버 렌더와 hydration 중에는 "light" 를 돌려주고, 마운트 뒤 <html data-theme> 의 실제 값과 그 변화를 따라간다. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, readTheme, readServerTheme);
}

/** 저장값 그대로. 못 읽으면 null. 값이 맞는지는 resolveTheme 이 가린다. */
function readStoredTheme(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** 화면에 테마를 적용한다. */
function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/** 전환 버튼이 고른 테마를 적용하고 저장한다. 저장에 실패해도 지금 화면에는 적용된다. */
export function setTheme(theme: Theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // 사생활 보호 모드 등: 저장만 건너뛴다.
  }
}

/**
 * 마운트 때 테마를 다시 적용하고, 저장값이 없으면 시스템 설정 변화를 따라간다.
 * 개발 모드 Strict Mode 의 재마운트가 <html> 의 data-theme 을 지우는 경우도 이것이 되살린다.
 */
export function useThemeSync() {
  useLayoutEffect(() => {
    const query = window.matchMedia(DARK_QUERY);
    const sync = () =>
      applyTheme(resolveTheme(readStoredTheme(), query.matches));
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
}
