import { visit } from "unist-util-visit";
import type { Root, Element, ElementContent } from "hast";

// 빌드 시 주입되는 basePath(예: /blog). 마크다운 본문의 <img> 는 raw HTML 이라
// Next 가 자동으로 basePath 를 붙여주지 않으므로, 여기서 직접 prefix 해야
// GitHub Pages 프로젝트 페이지에서 404 가 안 난다. next.config.ts 의 basePath 와 동일.
const basePath = process.env.BASE_PATH ?? "";

/** 루트 절대경로(/img.png)에만 basePath 를 붙인다. 외부 URL(//, http)·상대경로는 건드리지 않는다. */
function withBasePath(src: string): string {
  if (!src.startsWith("/") || src.startsWith("//")) return src;
  return `${basePath}${src}`;
}

/** 공백만 있는 텍스트 노드인지 (remark 가 이미지 앞뒤에 남기는 개행 등). */
function isBlank(node: ElementContent): boolean {
  return node.type === "text" && node.value.trim() === "";
}

/**
 * 본문 이미지 렌더 플러그인. rehype-raw 이후에 실행한다.
 * 1) 모든 <img> 의 루트 절대경로 src 에 basePath 를 prefix 한다.
 * 2) 이미지 하나만 담은 문단(![alt](src))을 <figure> + <figcaption>(alt) 로 감싼다.
 *    → alt 텍스트가 캡션으로 화면에 노출된다. alt 가 비면 figcaption 은 생략.
 * 코드블록 figure(rehype-pretty-code)와 구분되도록 .md-figure 클래스를 준다.
 */
export function rehypeFigure() {
  return (tree: Root) => {
    // 1) 모든 img src 에 basePath prefix
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "img") return;
      const src = node.properties?.src;
      if (typeof src === "string") node.properties.src = withBasePath(src);
    });

    // 2) 이미지 단독 문단 → figure 로 승격
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "p" || index === undefined || !parent) return;
      const meaningful = node.children.filter((child) => !isBlank(child));
      if (meaningful.length !== 1) return;
      const img = meaningful[0];
      if (img.type !== "element" || img.tagName !== "img") return;

      const alt =
        typeof img.properties?.alt === "string" ? img.properties.alt : "";
      const caption: Element[] = alt
        ? [
            {
              type: "element",
              tagName: "figcaption",
              properties: { className: ["md-figcaption"] },
              children: [{ type: "text", value: alt }],
            },
          ]
        : [];

      const figure: Element = {
        type: "element",
        tagName: "figure",
        properties: { className: ["md-figure"] },
        children: [img, ...caption],
      };
      parent.children[index] = figure;
    });
  };
}
