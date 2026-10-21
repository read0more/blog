import { useState } from "react";
import {
  SandpackCodeEditor,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from "@codesandbox/sandpack-react";
import type { LiveCodeFiles, LiveCodeView } from "@/lib/remark-live-code";
import styles from "./LiveCode.module.css";

const VIEW_LABELS: Record<LiveCodeView, string> = {
  both: "코드 + 결과",
  preview: "결과",
  code: "코드",
};

const PANEL_HEIGHT = 480;

/**
 * 라이브 코드 블록 1개. 상단 버튼으로 코드 + 결과 / 결과만 / 코드만 을 오간다.
 * 모드 전환은 패널을 언마운트하지 않고 display 로만 숨긴다 → 미리보기 상태(카운트 등)와
 * 에디터에서 고친 코드가 전환 후에도 유지된다.
 * Sandpack 프리셋에는 모드 전환이 없어 Provider + Editor + Preview 를 직접 조합한다.
 */
export function LiveCode({
  files,
  initialView,
}: {
  files: LiveCodeFiles;
  initialView: LiveCodeView;
}) {
  const [view, setView] = useState(initialView);
  // 기본 activeFile 은 템플릿 진입점(/index.html)이라, hidden 이어도 탭에 끼어든다.
  // 처음 보이는 파일을 활성으로 지정해 hidden 이 실제로 숨겨지게 한다.
  const activeFile = Object.keys(files).find((path) => !files[path].hidden);
  const panel = (visible: boolean) => ({
    height: PANEL_HEIGHT,
    flex: "1 1 0",
    overflow: "hidden",
    display: visible ? undefined : "none",
  });

  return (
    <div className={styles.liveCode} data-view={view}>
      <div className={styles.toolbar} role="group" aria-label="보기 모드">
        {(Object.keys(VIEW_LABELS) as LiveCodeView[]).map((value) => (
          <button
            key={value}
            type="button"
            className={styles.viewButton}
            aria-pressed={view === value}
            onClick={() => setView(value)}
          >
            {VIEW_LABELS[value]}
          </button>
        ))}
      </div>
      <SandpackProvider
        template="static"
        files={files}
        options={{ activeFile }}
      >
        <SandpackLayout>
          <SandpackCodeEditor style={panel(view !== "preview")} />
          <SandpackPreview style={panel(view !== "code")} />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}
