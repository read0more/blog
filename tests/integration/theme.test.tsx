import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const root = document.documentElement;

/**
 * 시스템 다크 설정(matchMedia) 대역. change 로 설정 변경 이벤트를 보낸다.
 * useTheme 은 MutationObserver(마이크로태스크)로 data-theme 변화를 받으므로 비동기 act 로 기다린다.
 */
function stubSystemTheme(dark: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    matches: dark,
    media: "(prefers-color-scheme: dark)",
    addEventListener: (_type: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) =>
      listeners.delete(listener),
  };
  vi.stubGlobal("matchMedia", (media: string) =>
    media === query.media ? query : { ...query, matches: false },
  );
  return {
    async change(next: boolean) {
      query.matches = next;
      await act(async () => listeners.forEach((listener) => listener()));
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  root.removeAttribute("data-theme");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("누르면 테마를 바꾸고 저장하며 라벨이 다음 동작을 말한다", async () => {
  stubSystemTheme(false);
  const user = userEvent.setup();
  render(<ThemeToggle language="ko" />);

  const toggle = screen.getByTestId("theme-toggle");
  expect(root).toHaveAttribute("data-theme", "light");
  expect(toggle).toHaveAccessibleName("다크 모드로 전환");

  await user.click(toggle);
  expect(root).toHaveAttribute("data-theme", "dark");
  expect(localStorage.getItem("theme")).toBe("dark");
  expect(toggle).toHaveAccessibleName("라이트 모드로 전환");

  await user.click(toggle);
  expect(root).toHaveAttribute("data-theme", "light");
  expect(localStorage.getItem("theme")).toBe("light");
  expect(toggle).toHaveAccessibleName("다크 모드로 전환");
});

test("저장값이 있으면 그 테마로 시작하고 시스템 설정이 바뀌어도 유지한다", async () => {
  localStorage.setItem("theme", "dark");
  const system = stubSystemTheme(false);
  render(<ThemeToggle language="ko" />);

  expect(root).toHaveAttribute("data-theme", "dark");
  expect(screen.getByTestId("theme-toggle")).toHaveAccessibleName(
    "라이트 모드로 전환",
  );

  await system.change(true);
  await system.change(false);
  expect(root).toHaveAttribute("data-theme", "dark");
});

test("저장값이 없으면 시스템 설정을 따르고 바뀌면 바로 따라간다", async () => {
  const system = stubSystemTheme(true);
  render(<ThemeToggle language="ko" />);
  const toggle = screen.getByTestId("theme-toggle");

  expect(root).toHaveAttribute("data-theme", "dark");
  expect(toggle).toHaveAccessibleName("라이트 모드로 전환");

  await system.change(false);
  expect(root).toHaveAttribute("data-theme", "light");
  expect(toggle).toHaveAccessibleName("다크 모드로 전환");
  expect(localStorage.getItem("theme")).toBeNull();
});

test("영어 화면은 영어 라벨을 쓴다", async () => {
  stubSystemTheme(false);
  const user = userEvent.setup();
  render(<ThemeToggle language="en" />);
  const toggle = screen.getByRole("button", { name: "Switch to dark mode" });

  await user.click(toggle);
  expect(toggle).toHaveAccessibleName("Switch to light mode");
});

test("localStorage 를 못 쓰면 시스템 설정으로 시작하고 전환도 된다", async () => {
  stubSystemTheme(true);
  const blocked = () => {
    throw new DOMException("blocked", "SecurityError");
  };
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);
  const user = userEvent.setup();
  render(<ThemeToggle language="ko" />);
  expect(root).toHaveAttribute("data-theme", "dark");

  await user.click(screen.getByTestId("theme-toggle"));
  expect(root).toHaveAttribute("data-theme", "light");
  expect(screen.getByTestId("theme-toggle")).toHaveAccessibleName(
    "다크 모드로 전환",
  );
});

test("서버 HTML 은 테마를 몰라도 hydration 경고 없이 저장된 다크 테마에 라벨을 맞춘다", async () => {
  stubSystemTheme(false);
  const view = <ThemeToggle language="ko" />;
  const container = document.createElement("div");
  container.innerHTML = renderToString(view);
  document.body.appendChild(container);
  // 첫 페인트 전 스크립트가 하는 일: 저장값으로 <html data-theme> 을 붙인다.
  localStorage.setItem("theme", "dark");
  root.setAttribute("data-theme", "dark");

  const consoleError = vi.spyOn(console, "error");
  const recoverableErrors: unknown[] = [];
  render(view, {
    container,
    hydrate: true,
    onRecoverableError: (error) => recoverableErrors.push(error),
  });
  expect(screen.getByTestId("theme-toggle")).toHaveAccessibleName(
    "라이트 모드로 전환",
  );
  expect(root).toHaveAttribute("data-theme", "dark");
  expect(recoverableErrors).toEqual([]);
  expect(consoleError).not.toHaveBeenCalled();
});
