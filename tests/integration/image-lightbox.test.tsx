import { afterEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ArticleClient } from "@/components/post/ArticleClient";
import { renderMarkdown } from "@/lib/markdown";

type ImageData = Record<string, unknown>;
const { filters } = vi.hoisted(() => ({
  filters: new Map<
    string,
    (data: ImageData, element: HTMLElement) => ImageData
  >(),
}));

// PhotoSwipe의 개폐·포커스 대신 우리가 작성한 이미지 데이터 변환을 SDK 경계에서 관측한다.
vi.mock("photoswipe/lightbox", () => ({
  default: class {
    addFilter(
      name: string,
      filter: (data: ImageData, element: HTMLElement) => ImageData,
    ) {
      filters.set(name, filter);
    }
    on() {}
    init() {}
    destroy() {}
  },
}));

afterEach(() => filters.clear());

test("이미지 로드 전에는 표시 크기를, 로드 후에는 원본 크기를 라이트박스에 전달한다", async () => {
  const result = await renderMarkdown("![다이어그램](/diagram.png)");
  render(
    <ArticleClient
      post={{
        slug: "image",
        language: "ko",
        hasEnglish: false,
        title: "이미지 글",
        description: "설명",
        date: "2026-10-23",
        categories: ["성능"],
        tags: [],
        readingMinutes: 1,
        contentHtml: result.html,
        plainText: result.plainText,
        toc: result.toc,
      }}
    />,
  );
  const image = screen.getByRole("img", { name: "다이어그램" });
  const anchor = screen.getByRole("link", { name: "다이어그램" });
  // jsdom에는 이미지 로딩·레이아웃 엔진이 없다. 그 입력만 제어하고 앱의 필터를 실행한다.
  Object.defineProperties(image, {
    width: { value: 320 },
    height: { value: 180 },
  });
  await waitFor(() => expect(filters.has("domItemData")).toBe(true));
  const imageData = () => filters.get("domItemData")!({}, anchor);
  expect(imageData()).toMatchObject({
    src: "http://localhost/diagram.png",
    alt: "다이어그램",
    width: 320,
    height: 180,
  });
  Object.defineProperties(image, {
    naturalWidth: { value: 1600 },
    naturalHeight: { value: 900 },
  });
  fireEvent.load(image);
  expect(imageData()).toMatchObject({ width: 1600, height: 900 });
  expect(anchor).toHaveAttribute("data-pswp-width", "1600");
  expect(anchor).toHaveAttribute("data-pswp-height", "900");
});
