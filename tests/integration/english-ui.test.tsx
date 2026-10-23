import { useState } from "react";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { PostList } from "@/components/posts/PostList";
import { ArticleClient } from "@/components/post/ArticleClient";
import { MobileSearchOverlay } from "@/components/search/MobileSearchOverlay";
import { useSearch } from "@/components/search/useSearch";
import type { Post, PostMeta } from "@/lib/types";

const article: PostMeta = {
  slug: "example",
  title: "English article",
  description: "Rendering explained",
  date: "2026-10-21",
  categories: ["생각들"],
  tags: ["렌더링"],
  readingMinutes: 1,
};

const server = setupServer(
  http.get("http://localhost/search-index.en.json", () =>
    HttpResponse.json([{ ...article, text: "Rendering explained" }]),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("영어 목록은 번역된 표시명과 영어 링크를 제공한다", () => {
  render(
    <PostList language="en" title="Articles" subtitle="" posts={[article]} />,
  );
  expect(screen.getByRole("link", { name: /English article/ })).toHaveAttribute(
    "href",
    "/en/posts/example",
  );
  expect(screen.getByRole("link", { name: "#Rendering" })).toHaveAttribute(
    "href",
    `/en/tag/${encodeURIComponent("렌더링")}`,
  );
  expect(screen.getByText("Thoughts")).toBeInTheDocument();
});

test("영어 글이 없으면 빈 상태 안내를 보여주고 글 링크는 없다", () => {
  render(<PostList language="en" title="Articles" subtitle="" posts={[]} />);
  expect(
    screen.getByText("English translations are coming soon."),
  ).toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

test("번역이 있는 글에만 영어로 읽기 링크를 제공한다", () => {
  const post: Post = {
    ...article,
    language: "ko",
    hasEnglish: false,
    contentHtml: "<p>원문</p>",
    plainText: "원문",
    toc: [],
  };
  const { rerender } = render(<ArticleClient post={post} />);
  expect(
    screen.queryByRole("link", { name: "Read in English" }),
  ).not.toBeInTheDocument();
  rerender(<ArticleClient post={{ ...post, hasEnglish: true }} />);
  expect(
    screen.getByRole("link", { name: "Read in English" }).getAttribute("href"),
  ).toMatch(/^\/en\/posts\/example\/?$/);
});

function SearchScreen() {
  const search = useSearch("en");
  const [open, setOpen] = useState(false);
  return open ? (
    <MobileSearchOverlay
      language="en"
      search={search}
      onClose={() => setOpen(false)}
    />
  ) : (
    <button onClick={() => setOpen(true)}>Search</button>
  );
}

test("영어 검색은 입력에 따라 결과·빈 상태를 바꾸고 취소하면 닫힌다", async () => {
  const user = userEvent.setup();
  render(<SearchScreen />);
  await user.click(screen.getByRole("button", { name: "Search" }));
  const input = screen.getByPlaceholderText("Search titles and content");
  await user.type(input, "Rendering");
  expect(
    await screen.findByRole("link", { name: /English article/ }),
  ).toHaveAttribute("href", "/en/posts/example");
  await user.clear(input);
  await user.type(input, "missing");
  expect(
    await screen.findByText("No results for “missing”"),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /English article/ }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
});
