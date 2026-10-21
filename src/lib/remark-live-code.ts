import type { Paragraph, Root, RootContent } from "mdast";

/** Sandpack files 형식: 경로 → { code, hidden } */
export type LiveCodeFiles = Record<string, { code: string; hidden?: boolean }>;

const hasFlag = (meta: string, flag: string) =>
  new RegExp(`(^|\\s)${flag}(\\s|$)`).test(meta);

/**
 * 라이브 코드 블록 플러그인. meta 에 `live` 가 붙은 "연속된" 펜스들을 하나의 데모로 묶는다.
 *
 *   ```html live file=index.html hidden   ← file= 필수, hidden 은 탭에서 숨김(보일러플레이트용)
 *   ```css live file=styles.css
 *
 * 묶인 펜스는 빈 div[data-live-code=<파일맵 JSON>] 로 치환되고, 클라이언트(useLiveCode)가
 * 그 자리에 Sandpack(static 템플릿)을 마운트한다.
 * remark 단계에서 처리하는 이유: rehype-raw 가 hast 의 data.meta 를 버려서 rehype 단계에선
 * 펜스 meta 를 읽을 수 없다(hProperties 는 실제 속성이 되므로 살아남는다).
 * ponytail: 최상위 펜스만 본다(리스트/인용 안 펜스는 무시). 필요해지면 visit 로 확장.
 */
export function remarkLiveCode() {
  return (tree: Root) => {
    const children: RootContent[] = [];
    let files: LiveCodeFiles = {};
    let placeholder: Paragraph | null = null;

    for (const node of tree.children) {
      if (node.type !== "code" || !hasFlag(node.meta ?? "", "live")) {
        placeholder = null;
        children.push(node);
        continue;
      }

      const meta = node.meta ?? "";
      const file = meta.match(/(?:^|\s)file=(\S+)/)?.[1];
      if (!file) throw new Error(`live 펜스에 file= 이 없습니다: "${meta}"`);

      if (!placeholder) {
        files = {};
        placeholder = { type: "paragraph", children: [] };
        children.push(placeholder);
      }
      files[`/${file.replace(/^\//, "")}`] = {
        code: node.value,
        ...(hasFlag(meta, "hidden") ? { hidden: true } : {}),
      };
      placeholder.data = {
        hName: "div",
        hProperties: { dataLiveCode: JSON.stringify(files) },
      };
    }

    tree.children = children;
  };
}
