import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root as MdastRoot } from "mdast";
import { rehypeExtractToc } from "./rehype-extract-toc";
import type { TocItem } from "./types";

export interface RenderedMarkdown {
  html: string;
  toc: TocItem[];
  /** 검색 인덱스용 본문 plaintext (제목/설명 제외) */
  plainText: string;
}

/**
 * 본문 마크다운에서 검색용 plaintext 를 추출한다.
 * heading/문단/인용/리스트의 텍스트만 모으고 코드블록은 제외한다
 * (코드 토큰은 검색 노이즈가 크고 읽는 시간 계산에도 부적절).
 */
function extractPlainText(markdown: string): string {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(markdown) as MdastRoot;
  const parts: string[] = [];
  visit(tree, "text", (node) => {
    parts.push(node.value);
  });
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * 빌드타임 마크다운 → HTML 렌더.
 * remark-parse → gfm → rehype(raw HTML 허용) → raw → slug → autolink → pretty-code(shiki) → stringify.
 * rehype-raw 가 본문 속 raw HTML(<details> 등)을 실제 엘리먼트로 파싱한다.
 * rehype-slug 직후 TOC 를 추출해 anchor id 와 정확히 일치시킨다.
 */
export async function renderMarkdown(
  markdown: string,
): Promise<RenderedMarkdown> {
  const toc: TocItem[] = [];

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeExtractToc, toc)
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: { className: ["heading-anchor"] },
    })
    .use(rehypePrettyCode, {
      theme: "github-light",
      keepBackground: true,
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return {
    html: String(file),
    toc,
    plainText: extractPlainText(markdown),
  };
}
