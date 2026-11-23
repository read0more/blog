import { visit } from "unist-util-visit";
import type { Root, Element, ElementContent } from "hast";

// 빌드 시 주입되는 basePath(예: /blog). 마크다운 본문의 <img>·<video> 등은 raw HTML 이라
// Next 가 자동으로 basePath 를 붙여주지 않으므로, 여기서 직접 prefix 해야
// GitHub Pages 프로젝트 페이지에서 404 가 안 난다. next.config.ts 의 basePath 와 동일.
const basePath = process.env.BASE_PATH ?? "";

// basePath 를 붙일 태그별 속성. 본문에서 미디어는 상대경로(../../) 대신 루트 절대경로로 쓴다.
// 상대경로는 클라이언트 이동 때 이전 페이지 주소를 기준으로 풀려 /blog 가 빠질 수 있다.
const PATH_ATTRIBUTES: Record<string, string[]> = {
  img: ["src"],
  video: ["src", "poster"],
  source: ["src"],
  iframe: ["src"],
};

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
 * 1) <img>·<video>·<source>·<iframe> 의 루트 절대경로 src(와 poster)에 basePath 를 prefix 한다.
 * 2) 이미지 하나만 담은 문단(![alt](src))을 <figure> + <figcaption>(alt) 로 감싼다.
 *    → alt 텍스트가 캡션으로 화면에 노출된다. alt 가 비면 figcaption 은 생략.
 * 코드블록 figure(rehype-pretty-code)와 구분되도록 .md-figure 클래스를 준다.
 */
export function rehypeFigure() {
  return (tree: Root) => {
    // 1) 미디어 경로에 basePath prefix
    visit(tree, "element", (node: Element) => {
      const attributes = PATH_ATTRIBUTES[node.tagName];
      if (!attributes) return;
      for (const name of attributes) {
        const value = node.properties?.[name];
        if (typeof value === "string")
          node.properties[name] = withBasePath(value);
      }
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

    // 3) HTML 로 직접 쓴 <figure><img> 도 .md-figure 로 표시해 라이트박스 대상에 넣는다.
    //    코드블록 figure 는 img 를 담지 않고, <video> 만 담은 figure 도 제외된다.
    //    인라인 style 은 클래스 규칙보다 우선하므로 글에서 지정한 여백·모서리는 유지된다.
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "figure") return;
      const hasImg = node.children.some(
        (child) => child.type === "element" && child.tagName === "img",
      );
      if (!hasImg) return;
      const className = node.properties.className;
      const classes = Array.isArray(className) ? className : [];
      if (!classes.includes("md-figure"))
        node.properties.className = [...classes, "md-figure"];
    });
  };
}
