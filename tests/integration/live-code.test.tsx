import type { CSSProperties, ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderMarkdown } from "@/lib/markdown";
import { ArticleClient } from "@/components/post/ArticleClient";

const { receiveFiles } = vi.hoisted(() => ({ receiveFiles: vi.fn() }));

// 외부 편집기·iframe 런타임 경계만 대체한다. 앱의 상태·모드 전환은 실제 코드다.
// 마크다운 → ArticleClient → useLiveCode의 동적 import → LiveCode는 실제 모듈이다.
vi.mock("@codesandbox/sandpack-react", () => ({
  SandpackProvider: ({ children, ...props }: { children: ReactNode }) => {
    receiveFiles(props);
    return children;
  },
  SandpackLayout: ({ children }: { children: ReactNode }) => children,
  SandpackCodeEditor: ({ style }: { style: CSSProperties }) => (
    <div style={style}>편집기</div>
  ),
  SandpackPreview: ({ style }: { style: CSSProperties }) => (
    <iframe title="미리보기 경계" style={style} />
  ),
}));

afterEach(async () => {
  // useLiveCode가 별도 React 루트의 unmount를 다음 틱으로 예약한다.
  await act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  vi.clearAllMocks();
});

test("연속 live 펜스는 파일·hidden·초기 보기 정보를 보존하고 일반 펜스는 분리한다", async () => {
  const { html } = await renderMarkdown(
    "```html live file=index.html hidden view=preview\n<button>실행</button>\n```\n\n```css live file=styles.css\nbutton { color: red; }\n```\n\n일반 본문\n\n```js\nconst normal = 1;\n```",
  );
  const root = document.createElement("div");
  root.innerHTML = html;
  const live = root.querySelectorAll<HTMLElement>("[data-live-code]");
  expect(live).toHaveLength(1);
  expect(live[0].dataset.liveView).toBe("preview");
  expect(JSON.parse(live[0].dataset.liveCode!)).toEqual({
    "/index.html": { code: "<button>실행</button>", hidden: true },
    "/styles.css": { code: "button { color: red; }" },
  });
  expect(root.querySelector("pre")).toHaveTextContent("const normal = 1;");
});

test("본문의 live 파일을 SDK에 전달하고 보기 전환 후에도 미리보기를 유지한다", async () => {
  const user = userEvent.setup();
  const result = await renderMarkdown(
    "```html live file=index.html hidden view=preview\n<p>미리보기</p>\n```\n\n```css live file=styles.css\np { color: red; }\n```",
  );
  render(
    <ArticleClient
      post={{
        slug: "live",
        language: "ko",
        hasEnglish: false,
        title: "라이브 글",
        description: "설명",
        date: "2026-10-23",
        categories: ["CSS"],
        tags: [],
        readingMinutes: 1,
        contentHtml: result.html,
        plainText: result.plainText,
        toc: result.toc,
      }}
    />,
  );
  const preview = await screen.findByTitle("미리보기 경계");
  expect(receiveFiles).toHaveBeenLastCalledWith(
    expect.objectContaining({
      template: "static",
      files: {
        "/index.html": { code: "<p>미리보기</p>", hidden: true },
        "/styles.css": { code: "p { color: red; }" },
      },
      options: { activeFile: "/styles.css" },
    }),
  );
  const editor = screen.getByText("편집기");
  expect(preview).toBeVisible();
  expect(editor).not.toBeVisible();
  await user.click(screen.getByRole("button", { name: "코드 + 미리보기" }));
  expect(editor).toBeVisible();
  expect(preview).toBeVisible();
  await user.click(screen.getByRole("button", { name: "코드" }));
  expect(screen.getByRole("button", { name: "코드" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(editor).toBeVisible();
  expect(preview).not.toBeVisible();
  await user.click(screen.getByRole("button", { name: "미리보기" }));
  expect(screen.getByTitle("미리보기 경계")).toBe(preview);
  expect(preview).toBeVisible();
});
