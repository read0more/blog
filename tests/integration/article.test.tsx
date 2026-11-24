import { StrictMode } from "react";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderMarkdown } from "@/lib/markdown";
import type { Post } from "@/lib/types";

beforeAll(() => {
  vi.stubEnv("NEXT_PUBLIC_GISCUS_REPO", "");
  vi.stubEnv("NEXT_PUBLIC_GISCUS_REPO_ID", "");
  vi.stubEnv("NEXT_PUBLIC_GISCUS_CATEGORY_ID", "");
});
afterAll(() => vi.unstubAllEnvs());
afterEach(() => {
  window.history.replaceState(null, "", "/");
  vi.restoreAllMocks();
});

async function article(markdown: string): Promise<Post> {
  const result = await renderMarkdown(markdown);
  return {
    slug: "example",
    language: "ko",
    hasEnglish: false,
    title: "본문 테스트",
    date: "2026-10-23",
    description: "설명",
    categories: ["React"],
    tags: ["Hooks"],
    readingMinutes: 1,
    contentHtml: result.html,
    plainText: result.plainText,
    toc: result.toc,
  };
}

test("마크다운은 읽을 수 있는 본문·앵커·코드로 렌더되고 코드는 검색 본문에서 제외된다", async () => {
  // user-event의 클립보드 대체는 OS 경계다. 복사할 본문을 고르는 앱 로직은 그대로 실행한다.
  const user = userEvent.setup();
  const post = await article(
    "## 소개\n\n본문 문장\n\n### 상세\n\n> 인용 문장\n\n- 목록 항목\n\n```js\nconst secretCodeToken = 1;\n```",
  );
  const { ArticleClient } = await import("@/components/post/ArticleClient");
  // 개발 서버처럼 effect를 두 번 실행해, 재실행 뒤에도 복사 버튼이 살아 있는지 본다.
  render(
    <StrictMode>
      <ArticleClient post={post} />
    </StrictMode>,
  );
  expect(screen.getByRole("heading", { name: "소개" })).toHaveAttribute(
    "id",
    post.toc[0].id,
  );
  expect(screen.getByRole("link", { name: "상세" })).toHaveAttribute(
    "href",
    `#${post.toc[1].id}`,
  );
  expect(screen.getByText("본문 문장")).toBeInTheDocument();
  expect(screen.getByRole("blockquote")).toHaveTextContent("인용 문장");
  expect(screen.getByRole("listitem")).toHaveTextContent("목록 항목");
  expect(screen.getByRole("code")).toHaveTextContent(
    "const secretCodeToken = 1;",
  );
  expect(post.plainText).toContain("본문 문장");
  expect(post.plainText).not.toContain("secretCodeToken");
  await user.click(screen.getByRole("button", { name: "복사" }));
  expect(await navigator.clipboard.readText()).toBe(
    "const secretCodeToken = 1;",
  );
  // 복사가 끝나면 버튼 문구로 결과를 알린다(1.5초 뒤 원복은 검사하지 않는다).
  expect(screen.getByRole("button", { name: "복사됨" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "#Hooks" })).toHaveAttribute(
    "href",
    "/tag/Hooks",
  );
});

test("코드 블록은 라이트·다크 구문 색을 함께 싣고 바탕은 칠하지 않는다", async () => {
  const { html } = await renderMarkdown(
    "```js\n// 주석\nconst token = 1;\n```",
  );
  const root = document.createElement("div");
  root.innerHTML = html;
  const pre = root.querySelector("pre")!;
  const token = (text: string) =>
    [...pre.querySelectorAll<HTMLElement>("span[style]")].find(
      (span) => span.textContent === text,
    )!;
  // 라이트는 기존 github-light 색 그대로, 다크는 github-dark 색이다. CSS 가 현재 테마 쪽을 고른다.
  expect(token("const").style.getPropertyValue("--shiki-light")).toBe(
    "#D73A49",
  );
  expect(token("const").style.getPropertyValue("--shiki-dark")).toBe("#F97583");
  // 다크 주석만 코드 바탕 대비 4.5:1 이 되도록 밝힌 색이고, 라이트 주석은 그대로다.
  expect(token("// 주석").style.getPropertyValue("--shiki-light")).toBe(
    "#6A737D",
  );
  expect(token("// 주석").style.getPropertyValue("--shiki-dark")).toBe(
    "#8B949E",
  );
  // 색 없는 일반 텍스트는 pre 의 기본 글자색 변수를 물려받는다.
  expect(pre.style.getPropertyValue("--shiki-light")).toBe("#24292e");
  expect(pre.style.getPropertyValue("--shiki-dark")).toBe("#e1e4e8");
  // 바탕은 figure 의 --paper-2 가 맡으므로 shiki 가 직접 칠하지 않는다.
  expect(pre.style.backgroundColor).toBe("");
});

test.each([2, 3])(
  "목차는 heading %i개일 때 임계값 3개에 따라 제공된다",
  async (count) => {
    const post = await article(
      ["## First", "## Second", "## Third"].slice(0, count).join("\n\n"),
    );
    const { ArticleClient } = await import("@/components/post/ArticleClient");
    render(<ArticleClient post={post} />);
    if (count === 2) {
      expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "목차" }),
      ).not.toBeInTheDocument();
      return;
    }
    expect(
      within(screen.getByRole("complementary")).getAllByRole("link"),
    ).toHaveLength(3);
    const user = userEvent.setup();
    const toggle = screen.getByRole("button", { name: "목차" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const mobile = toggle.parentElement!;
    expect(
      within(mobile)
        .getAllByRole("link")
        .map((link) => link.getAttribute("href")),
    ).toEqual(["#first", "#second", "#third"]);
    const heading = screen.getByRole("heading", { name: "Second" });
    const scrollIntoView = vi.fn();
    Object.defineProperty(heading, "scrollIntoView", { value: scrollIntoView });
    await user.click(within(mobile).getByRole("link", { name: "Second" }));
    // 좌표 자체는 데스크톱 E2E에서 보호한다. 모바일 고유 계약은 선택·해시·접힘이다.
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(window.location.hash).toBe("#second");
    expect(
      within(screen.getByRole("complementary")).getByRole("link", {
        name: "Second",
      }),
    ).toHaveAttribute("aria-current", "true");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(within(mobile).queryByRole("link")).not.toBeInTheDocument();
  },
);

test("댓글 설정이 없으면 안내를 제공한다", async () => {
  const { Comments } = await import("@/components/post/Comments");
  render(<Comments />);
  expect(screen.getByRole("heading", { name: "댓글" })).toBeInTheDocument();
  expect(screen.getByText("댓글은 아직 준비 중입니다.")).toBeInTheDocument();
});
