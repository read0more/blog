import { useEffect } from "react";
import type PhotoSwipeLightbox from "photoswipe/lightbox";

/**
 * 본문 이미지 라이트박스.
 * ArticleClient 의 코드블록 enhance 와 동일하게, 마운트 후 본문 DOM 을 조회해
 * figure.md-figure > img 를 <a.pswp-anchor> 로 감싸고 PhotoSwipe(v5) lightbox 를 건다.
 * - 클릭/탭 → 라이트박스. 안에서 클릭/탭으로 fit↔100% 토글, 드래그 팬, 모바일 핀치 줌.
 * - 이미지 치수는 열 때 naturalWidth/Height 를 읽어 넘긴다(원본 파일이 곧 풀사이즈).
 * - figcaption(=alt) 텍스트를 라이트박스 캡션으로도 노출한다.
 * PhotoSwipe 는 window 에 의존하므로 이펙트 안에서 동적 import 한다(정적 export 호환).
 */
export function useImageLightbox(
  bodyRef: React.RefObject<HTMLDivElement | null>,
  contentHtml: string,
): void {
  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;

    // 1) 각 본문 이미지를 앵커로 감싼다(중복 실행 가드).
    const figures = root.querySelectorAll<HTMLElement>("figure.md-figure");
    figures.forEach((figure) => {
      if (figure.dataset.lightbox === "true") return;
      figure.dataset.lightbox = "true";

      const img = figure.querySelector("img");
      if (!img) return;

      const anchor = document.createElement("a");
      anchor.className = "pswp-anchor";
      // href 는 PhotoSwipe 가 요구하는 형식상 채워두고, 실제 src/치수는 아래 filter 로 넘긴다.
      anchor.href = img.getAttribute("src") ?? img.src;

      const caption = figure.querySelector("figcaption");
      if (caption?.textContent)
        anchor.dataset.pswpCaption = caption.textContent;

      img.parentNode?.insertBefore(anchor, img);
      anchor.appendChild(img);
    });

    // 2) PhotoSwipe lightbox 초기화(동적 import).
    let lightbox: PhotoSwipeLightbox | undefined;
    let cancelled = false;

    (async () => {
      const { default: PhotoSwipeLightboxCtor } =
        await import("photoswipe/lightbox");
      if (cancelled) return;

      // gallery 를 '문자열 셀렉터'로 주면 PhotoSwipe 가 매칭되는 figure 마다
      // '독립 갤러리'를 만든다 → 각 라이트박스는 그 이미지 1장만 담아 좌우
      // 네비게이션이 생기지 않는다(스펙: 이미지 간 이동 없음). element 를 넘기면
      // 모든 앵커가 한 갤러리로 묶여 화살표가 생기므로 안 된다.
      // 코드블록 figure 는 .md-figure 가 아니라 자연히 제외된다.
      lightbox = new PhotoSwipeLightboxCtor({
        gallery: "figure.md-figure",
        children: "a.pswp-anchor",
        pswpModule: () => import("photoswipe"),
        // PhotoSwipe 는 열기 애니메이션(기본 333ms)이 끝난 뒤에야 키보드(Esc 등) 리스너를
        // 바인딩한다(openingAnimationEnd → bindEvents). 그런데 .pswp 루트는 애니메이션
        // 시작과 동시에 DOM에 붙어 즉시 '보임' 상태가 되므로, 열자마자 Esc를 누르면
        // 리스너가 아직 안 걸려 있어 무시된다. 여는 애니메이션만 꺼서 이 경합을 없앤다
        // (닫는 애니메이션은 그대로 유지).
        showAnimationDuration: 0,
      });

      // 열 때 img 의 실제 픽셀 치수/원본 src 를 슬라이드 데이터로 넣는다.
      lightbox.addFilter("domItemData", (itemData, element) => {
        const img = element.querySelector("img");
        if (img) {
          itemData.src = img.currentSrc || img.src;
          itemData.width = img.naturalWidth;
          itemData.height = img.naturalHeight;
          itemData.msrc = img.currentSrc || img.src;
          itemData.alt = img.alt;
        }
        return itemData;
      });

      // figcaption 텍스트를 라이트박스 하단 캡션으로 렌더한다.
      lightbox.on("uiRegister", () => {
        lightbox?.pswp?.ui?.registerElement({
          name: "blog-caption",
          order: 9,
          isButton: false,
          appendTo: "root",
          onInit: (el, pswp) => {
            el.className = "pswp-blog-caption";
            const update = () => {
              const element = pswp.currSlide?.data?.element;
              const text =
                element instanceof HTMLElement
                  ? (element.dataset.pswpCaption ?? "")
                  : "";
              el.textContent = text;
              el.style.display = text ? "" : "none";
            };
            pswp.on("change", update);
            update();
          },
        });
      });

      lightbox.init();
    })();

    return () => {
      cancelled = true;
      lightbox?.destroy();
    };
  }, [bodyRef, contentHtml]);
}
