import type { Paragraph, Root, RootContent } from "mdast";

/** Sandpack files 형식: 경로 → { code, hidden } */
export type LiveCodeFiles = Record<string, { code: string; hidden?: boolean }>;

/** 보기 모드: 코드 + 결과 / 결과만 / 코드만 */
export const LIVE_CODE_VIEWS = ["both", "preview", "code"] as const;
export type LiveCodeView = (typeof LIVE_CODE_VIEWS)[number];

const hasFlag = (meta: string, flag: string) =>
  new RegExp(`(^|\\s)${flag}(\\s|$)`).test(meta);

const isView = (value: string): value is LiveCodeView =>
  (LIVE_CODE_VIEWS as readonly string[]).includes(value);

/**
 * 라이브 코드 블록 플러그인. meta 에 `live` 가 붙은 "연속된" 펜스들을 하나의 데모로 묶는다.
 *
 *   ```html live file=index.html hidden view=preview
 *   ```css live file=styles.css
 *
 * - file=: 필수. Sandpack 파일 경로.
 * - hidden: 탭에서 숨김(보일러플레이트용).
 * - view=both|preview|code: 처음 보기 모드(기본 both). 묶음 안 아무 펜스에 적어도 된다.
 *   독자는 블록 위 버튼으로 언제든 모드를 바꿀 수 있다.
 *
 * 묶인 펜스는 빈 div[data-live-code=<파일맵 JSON>][data-live-view] 로 치환되고, 클라이언트
 * (useLiveCode)가 그 자리에 Sandpack(static 템플릿)을 마운트한다.
 * remark 단계에서 처리하는 이유: rehype-raw 가 hast 의 data.meta 를 버려서 rehype 단계에선
 * 펜스 meta 를 읽을 수 없다(hProperties 는 실제 속성이 되므로 살아남는다).
 * ponytail: 최상위 펜스만 본다(리스트/인용 안 펜스는 무시). 필요해지면 visit 로 확장.
 */
export function remarkLiveCode() {
  return (tree: Root) => {
    const children: RootContent[] = [];
    let files: LiveCodeFiles = {};
    let view: LiveCodeView = "both";
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
        view = "both";
        placeholder = { type: "paragraph", children: [] };
        children.push(placeholder);
      }

      const viewMeta = meta.match(/(?:^|\s)view=(\S+)/)?.[1];
      if (viewMeta !== undefined) {
        if (!isView(viewMeta)) {
          throw new Error(
            `live 펜스의 view= 는 ${LIVE_CODE_VIEWS.join("|")} 중 하나여야 합니다: "${meta}"`,
          );
        }
        view = viewMeta;
      }

      files[`/${file.replace(/^\//, "")}`] = {
        code: node.value,
        ...(hasFlag(meta, "hidden") ? { hidden: true } : {}),
      };
      placeholder.data = {
        hName: "div",
        hProperties: {
          dataLiveCode: JSON.stringify(files),
          dataLiveView: view,
        },
      };
    }

    tree.children = children;
  };
}
