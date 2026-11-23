import { afterEach, expect, test, vi } from "vitest";
import type { Element, Root } from "hast";

// basePath 는 모듈을 읽을 때 정해지므로, 환경변수를 바꾼 뒤 모듈을 새로 불러온다.
async function runWithBasePath(tree: Root, basePath: string) {
  vi.resetModules();
  vi.stubEnv("BASE_PATH", basePath);
  const { rehypeFigure } = await import("../../src/lib/rehype-figure");
  rehypeFigure()(tree);
  return tree;
}

function element(tagName: string, properties: Element["properties"]): Element {
  return { type: "element", tagName, properties, children: [] };
}

afterEach(() => vi.unstubAllEnvs());

test("본문 미디어의 루트 경로에만 basePath를 붙인다", async () => {
  const img = element("img", { src: "/post/a.png" });
  const video = element("video", { src: "/post/a.mp4", poster: "/post/a.jpg" });
  const source = element("source", { src: "/post/b.mp4" });
  const iframe = element("iframe", { src: "/post/demo.html" });
  const relative = element("video", { src: "../../post/c.mp4" });
  const external = element("iframe", { src: "https://example.com/x" });
  const protocolRelative = element("img", { src: "//cdn.example.com/x.png" });
  const tree: Root = {
    type: "root",
    children: [
      img,
      video,
      source,
      iframe,
      relative,
      external,
      protocolRelative,
    ],
  };

  await runWithBasePath(tree, "/blog");

  expect(img.properties.src).toBe("/blog/post/a.png");
  expect(video.properties.src).toBe("/blog/post/a.mp4");
  expect(video.properties.poster).toBe("/blog/post/a.jpg");
  expect(source.properties.src).toBe("/blog/post/b.mp4");
  expect(iframe.properties.src).toBe("/blog/post/demo.html");
  expect(relative.properties.src).toBe("../../post/c.mp4");
  expect(external.properties.src).toBe("https://example.com/x");
  expect(protocolRelative.properties.src).toBe("//cdn.example.com/x.png");
});

test("basePath가 없으면 경로를 그대로 둔다", async () => {
  const video = element("video", { src: "/post/a.mp4" });
  await runWithBasePath({ type: "root", children: [video] }, "");
  expect(video.properties.src).toBe("/post/a.mp4");
});
