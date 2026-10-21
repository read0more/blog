import { useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { LiveCodeFiles, LiveCodeView } from "@/lib/remark-live-code";

/**
 * 본문 라이브 코드 블록. remark-live-code 가 남긴 div[data-live-code] 마다 LiveCode(Sandpack)를 마운트한다.
 * useImageLightbox 와 같은 패턴: 마운트 후 본문 DOM 을 조회하고, 무거운 Sandpack 은
 * 라이브 블록이 있는 글에서만 동적 import 한다(LiveCode 모듈째로 분리된 청크).
 * - static 템플릿: 미리보기는 iframe 이라 데모의 100dvh·html 스크롤이 본문과 격리된다.
 * - Prose 가 memo 라 innerHTML 이 재적용되지 않으므로 마운트 대상 노드가 유지된다.
 */
export function useLiveCode(
  bodyRef: React.RefObject<HTMLDivElement | null>,
  contentHtml: string,
): void {
  useEffect(() => {
    const targets =
      bodyRef.current?.querySelectorAll<HTMLElement>("[data-live-code]");
    if (!targets?.length) return;

    const roots: Root[] = [];
    let cancelled = false;

    (async () => {
      const { LiveCode } = await import("./LiveCode");
      if (cancelled) return;
      targets.forEach((el) => {
        const files = JSON.parse(el.dataset.liveCode ?? "{}") as LiveCodeFiles;
        // remark-live-code 가 빌드 타임에 값을 검증해 넣는다.
        const initialView = (el.dataset.liveView ?? "both") as LiveCodeView;
        const root = createRoot(el);
        root.render(<LiveCode files={files} initialView={initialView} />);
        roots.push(root);
      });
    })();

    return () => {
      cancelled = true;
      // 이펙트 정리(커밋 단계) 중 동기 unmount 는 React 가 경고하므로 다음 틱으로 미룬다.
      setTimeout(() => roots.forEach((root) => root.unmount()));
    };
  }, [bodyRef, contentHtml]);
}
