import { useEffect } from "react";
import type PhotoSwipeLightbox from "photoswipe/lightbox";

/**
 * 본문 이미지 라이트박스.
 * ArticleClient 의 코드블록 enhance 와 동일하게, 마운트 후 본문 DOM 을 조회해
 * figure.md-figure > img 를 <a.pswp-anchor> 로 감싸고 PhotoSwipe(v5) lightbox 를 건다.
 * - 클릭/탭 → 라이트박스. 안에서 클릭/탭으로 fit↔100% 토글, 드래그 팬, 모바일 핀치 줌.
 * - 이미지 치수는 naturalWidth/Height 를 읽어 넘긴다(원본 파일이 곧 풀사이즈). 로드 전
 *   클릭 시 0 이 되는 문제를 막기 위해 enhance 시점에 로드 완료를 확인/대기해
 *   앵커 dataset 에 미리 심어두고, 열 때는 여러 소스를 폴백해 사용한다.
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
    // load 이벤트로 등록한 리스너가 이펙트 정리 시점까지 안 불렸다면 제거해야 하므로 추적한다.
    const loadCleanups: Array<() => void> = [];
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

      // 클릭 시점에 img.naturalWidth/Height 를 그대로 읽으면, 로드가 끝나기 전에
      // 클릭된 경우 둘 다 0 이라 PhotoSwipe 슬라이드가 사이즈를 못 갖고(줌/팬 불가)
      // 열려버린다. 이미 로드됐으면 즉시, 아니면 load 를 한 번만 기다렸다가 앵커의
      // dataset 에 치수를 심어 둔다(아래 domItemData filter 에서 우선 사용).
      const setDimensions = () => {
        anchor.dataset.pswpWidth = String(img.naturalWidth);
        anchor.dataset.pswpHeight = String(img.naturalHeight);
      };
      if (img.complete && img.naturalWidth > 0) {
        setDimensions();
      } else {
        img.addEventListener("load", setDimensions, { once: true });
        loadCleanups.push(() => img.removeEventListener("load", setDimensions));
      }

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
        // 열자마자 zoom 버튼을 누른 상태(확대)로 시작한다. 넓은 스샷을 fit 로 열면
        // 글씨가 작아 한 번 더 확대해야 하므로, PhotoSwipe 기본 secondary 공식
        // (Math.min(1, fit*3) — 사실상 원본 100% 근처)을 초기 줌으로 쓴다.
        // fit 는 항상 ≤ 1 로 캡되므로 작은 이미지는 그대로 원본 크기로 열린다.
        // zoom 버튼/더블탭은 반대로 fit(전체 보기)로 토글되고, 확대 상태에서
        // 드래그(모바일 팬)로 좌우를 훑어 읽는다.
        initialZoomLevel: (zoomLevel) => Math.min(1, zoomLevel.fit * 3),
        secondaryZoomLevel: "fit",
      });

      // 열 때 img 의 실제 픽셀 치수/원본 src 를 슬라이드 데이터로 넣는다.
      // element 는 children: "a.pswp-anchor" 로 매칭된 앵커 그 자체다.
      lightbox.addFilter("domItemData", (itemData, element) => {
        const img = element.querySelector("img");
        if (img) {
          itemData.src = img.currentSrc || img.src;
          itemData.msrc = img.currentSrc || img.src;
          itemData.alt = img.alt;

          // naturalWidth/Height 는 로드 전이면 0 이라(위 enhance 단계 참고) 그대로
          // 넘기면 PhotoSwipe 가 사이즈를 못 잡아 줌/팬이 죽는다. naturalWidth/Height
          // → enhance 시 심어둔 dataset → 렌더된 img 크기 순으로 폴백하고, 그래도
          // 0/NaN 이면 실제 화면에 그려진 bounding box 로 최종 폴백해 0 이 절대
          // PhotoSwipe 로 넘어가지 않게 한다.
          let width =
            img.naturalWidth ||
            Number(element.dataset.pswpWidth) ||
            img.width ||
            img.clientWidth;
          let height =
            img.naturalHeight ||
            Number(element.dataset.pswpHeight) ||
            img.height ||
            img.clientHeight;

          if (!width || !height) {
            const rect = img.getBoundingClientRect();
            width = width || Math.round(rect.width);
            height = height || Math.round(rect.height);
          }

          itemData.width = width;
          itemData.height = height;
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
      // 아직 안 불린 load 리스너만 정리한다. 앵커로 감싼 DOM 자체와
      // figure.dataset.lightbox 가드 플래그는 여기서 되돌리지 않는다 — contentHtml 이
      // 바뀌면 prose innerHTML 이 통째로 교체되며 자연히 사라지고, 그 교체 자체가 곧
      // 이 이펙트를 재실행시키는 트리거이기도 하다.
      loadCleanups.forEach((cleanup) => cleanup());
    };
  }, [bodyRef, contentHtml]);
}
