import { afterEach, expect, test, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { render, screen, within } from "@testing-library/react";
import { GlobalNotFoundView } from "@/components/GlobalNotFoundView";
import type { PostMeta } from "@/lib/types";

// Next 라우터 입력만 대체하고 언어 선택·AppShell·404 표시는 실제 모듈을 쓴다.
vi.mock("next/navigation", () => ({
  usePathname: () => window.location.pathname,
}));

afterEach(() => {
  window.history.replaceState(null, "", "/");
  document.documentElement.removeAttribute("lang");
  vi.unstubAllEnvs();
});

test("공통 404의 한국어 HTML은 영어 URL에서 hydration하면 언어·복귀 링크·글을 바꾼다", async () => {
  vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/blog");
  window.history.replaceState(null, "", "/blog/en/missing/");
  document.documentElement.lang = "ko";
  const original: PostMeta = {
    slug: "original",
    title: "원문",
    description: "설명",
    date: "2026-10-23",
    categories: ["React"],
    tags: [],
    readingMinutes: 1,
  };
  const view = (
    <GlobalNotFoundView
      ko={{ posts: [original], categories: [], tags: [] }}
      en={{
        posts: [{ ...original, slug: "translated", title: "English article" }],
        categories: [],
        tags: [],
      }}
    />
  );
  const container = document.createElement("div");
  container.innerHTML = renderToString(view);
  document.body.appendChild(container);
  expect(within(container).getByTestId("not-found-home")).toHaveAttribute(
    "href",
    "/",
  );
  expect(within(container).getByRole("link", { name: "원문" })).toHaveAttribute(
    "href",
    "/posts/original",
  );

  const recoverableErrors: unknown[] = [];
  render(view, {
    container,
    hydrate: true,
    onRecoverableError: (error) => recoverableErrors.push(error),
  });
  expect(
    await screen.findByRole("link", { name: "English article" }),
  ).toHaveAttribute("href", "/en/posts/translated");
  expect(screen.queryByRole("link", { name: "원문" })).not.toBeInTheDocument();
  expect(screen.getByTestId("not-found-home")).toHaveAttribute("href", "/en");
  expect(document.documentElement).toHaveAttribute("lang", "en");
  expect(recoverableErrors).toEqual([]);
});
