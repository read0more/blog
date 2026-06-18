import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import type { Root, Element } from "hast";
import type { TocItem } from "./types";

/** heading 태그 → TOC depth. 여기 없는 태그(h1/h5/h6)는 TOC 에서 제외된다. */
const HEADING_DEPTH: Record<string, number> = { h2: 2, h3: 3, h4: 4 };

/**
 * rehype-slug 가 heading 에 id 를 부여한 뒤 실행되어야 하는 플러그인.
 * h2/h3/h4 를 순회해 { text, id, depth } 를 모아 전달받은 배열에 채운다.
 *
 * 같은 id 중복 시 rehype-slug 가 suffix(-1, -2…)를 붙이므로,
 * TOC 의 id 도 실제 anchor 와 정확히 일치한다(별도 슬러그 계산 불필요).
 */
export function rehypeExtractToc(toc: TocItem[]) {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      const depth = HEADING_DEPTH[node.tagName];
      if (!depth) return;
      const id =
        typeof node.properties?.id === "string" ? node.properties.id : "";
      if (!id) return;
      toc.push({
        text: toString(node),
        id,
        depth,
      });
    });
  };
}
