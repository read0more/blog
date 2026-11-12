---
title: "CSS로 만드는 네이티브 같은 바텀시트 1편: 터치 이벤트 없이 스크롤 스냅으로 여닫기"
date: "2026-11-03T09:00:00.000Z"
description: "React Aria의 Sheet 글을 빌드 도구 없이 따라 만든 시리즈의 첫 글입니다. 손가락을 따라 내려오는 시트를 터치 이벤트 대신 200dvh 높이의 scroller와 스냅 마커 두 개로 만들고, JS에는 열 때 scrollTo 한 번과 IntersectionObserver로 숨기는 일만 남겼습니다."
tags: ["CSS"]
---

이번 글부터 **CSS로 만드는 네이티브 같은 바텀시트** 시리즈를 시작하려고 합니다. React Aria 팀의 글 [Scrolling is All You Need: Building a Swipeable Sheet](https://react-aria.adobe.com/blog/sheet)를 보고 같은 시트를 직접 따라 만든 과정을 여섯 편에 나눠 정리합니다.

> **시리즈 목차**
>
> 1. 터치 이벤트 없이 스크롤 스냅으로 여닫기 (이 글)
> 2. [iOS Safari 툴바 뒤에서 시트가 덜 사라질 때](../css-bottom-sheet-2-ios-safari/)
> 3. [지도 앱처럼 중간에 멈추고, 스와이프로는 닫히지 않게](../css-bottom-sheet-3-snap-points/)
> 4. 손가락을 따라오는 backdrop과 뒤로 밀리는 시트 (준비 중)
> 5. 키보드가 시트를 가릴 때 (준비 중)
> 6. 키보드 애니메이션에 시트를 맞추기 (준비 중)

## 시트를 끌어내리는데 터치 이벤트가 없다

바텀시트를 직접 만든다면 보통 터치 이벤트부터 붙입니다. `touchstart`에서 시작점을 잡고, `touchmove`마다 손가락이 움직인 만큼 시트를 `transform`으로 옮기고, 손을 떼면 속도를 계산해 열림 위치나 닫힘 위치로 애니메이션을 돌립니다. 손가락을 따라오게 하는 데까지는 금방이지만, 놓은 뒤 미끄러지는 관성과 끝에서 늘어났다 돌아오는 탄성은 전부 직접 계산해야 합니다.

React Aria의 Sheet는 이 일을 브라우저 스크롤에 넘깁니다. 원문은 이 구조를 이렇게 설명합니다.

> This means swipe gestures run off the main thread at the native display refresh rate without any JavaScript touch handling

스와이프를 JS 터치 처리 없이, 메인 스레드 밖에서 화면 주사율 그대로 처리한다는 뜻입니다. 손가락을 따라 움직이는 것, 놓은 뒤의 관성, 끝에서의 탄성은 원래 브라우저가 스크롤에 해 주던 일입니다. 이 시트가 네이티브 앱처럼 느껴지는 이유도 여기 있습니다. 물리를 흉내 내는 것이 아니라, 브라우저가 플랫폼에 맞춰 이미 구현해 둔 스크롤 물리를 그대로 씁니다.

그래서 이 시리즈는 대부분 CSS 이야기입니다. 1편에서 JS가 맡는 일은 두 가지뿐입니다. 열 때 스크롤을 한 번 시키고, 시트가 뷰포트에서 사라지면 숨깁니다.

## 실습 방식

React Aria의 Sheet 컴포넌트를 참고해서 만들었습니다.

글 끝 데모에는 확인용 패널 두 개를 띄웠습니다. 왼쪽 위 **시트 상태**는 지금 상태(`closed`, `moving`, `open`)와 `scrollTop`을 숫자로 보여 주고, 오른쪽 위 **시트 구조 지도**는 scroller 안의 전체 콘텐츠를 축소해 지금 어디가 뷰포트에 보이는지 그립니다.

## 구조: 뷰포트 두 배 높이의 scroller

시트를 끌어내리는 동작의 정체는 뷰포트 두 배 높이의 scroller를 스크롤하는 것입니다. 이 글에서 쓰는 이름은 아래 구조를 기준으로 합니다.

```text
.sheet-overlay            overlay: 시트 전체를 감싸는 틀
├ .sheet-backdrop         backdrop: 시트 뒤를 어둡게 덮는 층
└ .sheet-scroller         scroller: 높이 200dvh, 스와이프의 정체
   ├ .snap-marker--exit   exit 마커: 전체 콘텐츠 맨 위, scrollTop 0 (닫힘)
   ├ .sheet-stage         stage: 뷰포트 크기, 시트를 바닥에 붙임
   │  └ .sheet            시트
   │     └ .sheet-content 시트 콘텐츠: IntersectionObserver가 지켜보는 대상
   └ .snap-marker--enter  enter 마커: 전체 콘텐츠 맨 아래, scrollTop 100dvh (열림)
```

scroller 안의 전체 콘텐츠는 뷰포트 높이의 세 배입니다. 위에서부터 비어 있는 exit 마커, 시트를 담은 stage, enter 마커가 각각 뷰포트 높이만큼 차례로 놓입니다. scroller 높이는 뷰포트의 두 배라서 한 번에 전체 콘텐츠의 3분의 2만 담을 수 있는데, 이 부분을 **scroller가 보는 구간**이라고 부르겠습니다. 시트를 열 때 scroller 윗변을 뷰포트 맨 위에 맞추기 때문에, scroller가 보는 구간 중 뷰포트에 실제로 보이는 것은 위쪽 절반입니다.

- `scrollTop`이 0이면 뷰포트에는 빈 exit 마커가 보이고 stage는 뷰포트 아래에 숨어 있습니다. 닫힌 상태입니다.
- `scrollTop`이 뷰포트 높이(`100dvh`)만큼이면 stage가 뷰포트에 들어옵니다. 열린 상태입니다.

React Aria 코드 주석도 이 구조를 같은 그림으로 설명합니다.

> The container is always 2 viewports along the axis; a fixed 1-viewport window (the actual browser viewport) looks onto it.

CSS로 보면 다음과 같습니다.

```css
.sheet-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: max(var(--page-width), 100vw);
  height: max(var(--page-height), 100dvh);
  overflow: clip;
  z-index: 10;
}

.sheet-scroller {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 200dvh;                  /* 위 절반 = 뷰포트, 아래 절반 = 뷰포트 밖 */
  overflow-x: hidden;
  overflow-y: auto;                /* 전체 콘텐츠가 scroller보다 길어서 스크롤된다 */
  scroll-snap-type: y mandatory;   /* 손을 떼면 반드시 가장 가까운 스냅 마커로 끌려간다 */
  overscroll-behavior-y: contain;  /* 끝에 닿아도 뒤 페이지로 스크롤을 넘기지 않는다 */
  scrollbar-width: none;
}
```

overlay가 `fixed`가 아니라 `absolute`인 것은 iOS Safari에서 `fixed` 요소가 잘리는 문제를 피하려는 선택입니다(React Aria에서도 동일한 선택을 했습니다). 그래서 overlay를 페이지 전체 크기로 깔고, 시트를 열 때 scroller의 `top`을 `window.scrollY`로 바꿔 현재 뷰포트 위치에 놓습니다. 이 부분은 2편에서 자세히 다루려고 합니다.

`scroll-snap-type: y mandatory`가 있으면 스크롤은 손을 뗀 뒤 반드시 스냅 마커가 정한 위치 중 하나에 멈춥니다. 시트를 반쯤 내리다 놓으면 중간에 서지 않고 열림 위치나 닫힘 위치 중 가까운 쪽으로 붙습니다. 붙는 애니메이션도 브라우저가 맡습니다.

`overscroll-behavior-y: contain`은 스크롤이 scroller 끝에 닿았을 때 뒤 페이지로 넘어가지 않게 막습니다. 이 줄이 없으면 시트를 끝까지 민 뒤에 남은 스크롤이 뒤 페이지로 넘어갑니다. 시트가 열려 있는 동안에는 `html.sheet-open { overflow: hidden; }`으로 뒤 페이지 스크롤도 잠급니다.

스크롤바는 숨깁니다. 사용자에게는 스크롤이 아니라 시트를 끄는 동작으로 보여야 하기 때문입니다.

## 스냅 마커: 열림과 닫힘 두 자리

```css
.snap-marker {
  position: absolute;
  left: 0;
  width: 1px;
  height: 100dvh;
  pointer-events: none;
}

/* 마커 윗변 = scroller 윗변 → scrollTop 0 (닫힘) */
.snap-marker--exit {
  top: 0;
  scroll-snap-align: start;
}

/* 마커 아랫변 = scroller 아랫변 → scrollTop 100dvh (열림) */
.snap-marker--enter {
  top: calc(200dvh + var(--viewport-padding));
  scroll-snap-align: end;
}
```

스냅 마커는 높이가 뷰포트와 같은 투명한 요소입니다. 보이는 내용은 없고 스크롤이 멈출 자리만 정합니다. `--viewport-padding`은 iOS Safari에서만 값이 생기고 다른 브라우저에서는 `0px`입니다.

자석에 비유하면 `scroll-snap-type: y mandatory`는 scroller에서 세로 방향의 자석을 켜 손을 뗐을 때 스냅 위치에 붙도록 하는 설정입니다. 마커의 `scroll-snap-align`은 자석이 붙을 기준점을 정합니다. 이 예제의 `start`는 마커 윗변과 scroller 윗변을, `end`는 두 아랫변을 맞춥니다.

뷰포트 높이(`100dvh`)를 400px로 가정해 보겠습니다. scroller 높이가 `200dvh`라서 scroller가 보는 구간은 800px입니다. 전체 콘텐츠는 exit 마커, stage, enter 마커가 400px씩 차례로 쌓여 1200px이 됩니다. 그래서 `scrollTop`은 최대 400px(1200px − 800px)입니다. enter 마커는 전체 콘텐츠의 800px에서 1200px 사이에 있습니다. `end`로 맞추면 마커 아랫변 1200px이 scroller 아랫변에 닿는 자리, 곧 `scrollTop` 400px에서 멈춥니다. 이때 뷰포트에는 전체 콘텐츠의 400px에서 800px 구간, 곧 stage가 보입니다.

![뷰포트는 400px, scroller는 800px, 전체 콘텐츠는 1200px입니다. 파란 실선은 scroller, 검은 점선은 실제 뷰포트를 나타냅니다. end 정렬로 scrollTop 400px에서 enter 마커 아랫변이 scroller 아랫변에 닿으면, 실제 뷰포트에는 400–800px 구간의 stage가 보입니다](/css-bottom-sheet-1-scroll-snap/snap-start-end-limit.png)

## stage: 시트를 바닥에 붙이는 무대

```css
.sheet-stage {
  position: absolute;
  top: calc(100dvh + var(--viewport-padding));
  left: 0;
  width: 100vw;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;  /* 세로 맨 아래 */
  align-items: center;
}
```

스크롤로 움직이는 것은 항상 뷰포트 크기의 stage입니다. 시트는 그 안에서 flex로 바닥에 붙어 있을 뿐입니다. 그래서 시트 높이가 얼마든 열림 위치와 닫힘 위치는 stage 기준 그대로입니다. 시트가 짧으면 stage 위쪽이 투명하게 비는데, 그 빈 곳도 scroller 안이라 어디를 쓸어내려도 시트가 따라 내려갑니다.

## JS는 열고, 사라지면 숨긴다

열기는 스크롤 한 번입니다.

```js
function open() {
  // overlay에 페이지 전체 크기를 알려주고, scroller를 현재 뷰포트 맨 위에 맞춘다.
  overlay.style.setProperty('--page-width', `${document.documentElement.scrollWidth}px`);
  overlay.style.setProperty('--page-height', `${document.documentElement.scrollHeight}px`);
  scroller.style.top = `${window.scrollY}px`;

  overlay.hidden = false;
  updatePageScrollLock();
  startCloseObserver();

  requestAnimationFrame(() => {
    overlay.dataset.open = '';
    scroller.scrollTo({top: getFullyOpenScrollTop(), behavior: 'smooth'});
  });
}

// 열림 위치 = enter 마커 아랫변이 scroller 아랫변에 닿는 scrollTop
function getFullyOpenScrollTop() {
  const marker = overlay.querySelector('.snap-marker--enter');
  return marker.offsetTop + marker.offsetHeight - scroller.clientHeight;
}
```

시트가 올라오는 애니메이션은 따로 만들지 않았습니다. `scrollTop` 0에서 열림 위치까지 `smooth`로 스크롤하는 모습이 곧 시트가 올라오는 모습입니다. `data-open`은 backdrop을 `transition`으로 어둡게 하는 데만 씁니다.

닫힘은 터치 이벤트로 잡지 않습니다. 시트 콘텐츠가 뷰포트에서 완전히 사라졌는지만 `IntersectionObserver`로 확인합니다.

```js
function startCloseObserver() {
  const paddingPx = getViewportPadding(scroller, stage);

  let hasEntered = false;
  observer = new IntersectionObserver(
    ([entry]) => {
      hasEntered ||= entry.isIntersecting;
      if (hasEntered && !entry.isIntersecting) {
        hide();
      }
    },
    {rootMargin: `0px 0px ${paddingPx}px 0px`}
  );

  observer.observe(content);
}

function hide() {
  observer.disconnect();
  delete overlay.dataset.open;
  overlay.hidden = true;
  updatePageScrollLock();
}
```

손가락을 어떻게 움직였는지는 묻지 않고 결과만 봅니다. 시트 콘텐츠가 뷰포트 밖으로 나갔으면 overlay를 `hidden`으로 숨깁니다. `rootMargin`에 들어가는 `paddingPx`는 앞의 `--viewport-padding`을 px로 바꾼 값이라 iOS Safari가 아니면 0입니다.

`hasEntered`가 필요한 이유는 관찰을 시작하는 시점에 있습니다. `observe()`를 부를 때 시트 콘텐츠는 아직 뷰포트 아래에 있어서 첫 콜백이 `isIntersecting: false`로 옵니다. 이 조건이 없으면 시트가 열리자마자 닫힙니다. 그래서 한 번이라도 뷰포트에 들어온 뒤에 사라졌을 때만 닫도록 막았습니다.

✕ 버튼도 시트를 직접 숨기지 않습니다.

```js
function close() {
  delete overlay.dataset.open;
  scroller.scrollTo({top: 0, behavior: 'smooth'});
}
```

0으로 스크롤만 시키면 스와이프로 닫을 때처럼 observer가 사라짐을 감지하고 `hide()`를 부릅니다. 닫히는 길이 하나뿐이라 버튼으로 닫을 때와 손으로 닫을 때 정리 코드가 갈라지지 않습니다.

## overscrollPadding: 끝까지 올린 뒤 더 당길 때

시트를 끝까지 올린 상태에서 손가락으로 더 밀어 올리면, 탄성 스크롤이 있는 환경(iOS 등)에서는 scroller가 끝을 넘어 살짝 늘어났다 돌아옵니다. 이때 시트도 같이 위로 들리면서 시트 아래 빈틈으로 backdrop이 드러납니다. React Aria는 이 빈틈을 `overscrollPadding` 옵션으로 가립니다.

```css
.sheet.overscroll-padding {
  padding-bottom: 100vh;   /* 시트 배경색을 뷰포트 높이만큼 아래로 늘리고 */
  margin-bottom: -100vh;   /* 배치에는 영향 없게 상쇄 */
}
```

`padding-bottom`은 시트 배경색이 칠해지는 영역을 아래로 늘리고, 음수 `margin-bottom`은 늘어난 공간이 시트 콘텐츠를 위로 밀어 올리지 않게 상쇄합니다. 시트 콘텐츠는 제자리에 두고 시트 배경색만 아래로 길게 이어 붙이는 셈입니다.

직접 iPhone Safari로 열어 보니 이 옵션은 가만히 열려 있을 때도 차이를 만들었습니다. 하단 툴바 뒤로도 페이지가 비쳐 보여서, 옵션을 끄면 툴바 뒤에 backdrop이 회색 띠처럼 드러났습니다. 옵션을 켜면 시트 배경색이 그 아래까지 이어져서 띠가 사라집니다.

닫힘 감지에서 `.sheet`가 아니라 시트 콘텐츠(`.sheet-content`)를 관찰하는 것도 이 옵션 때문입니다. `.sheet`의 높이는 옵션에 따라 뷰포트 높이만큼 달라지지만 시트 콘텐츠는 그대로라, 옵션과 상관없이 같은 기준으로 판단할 수 있습니다.

데모의 체크박스 값은 시트를 열 때 읽습니다. 바꾼 뒤에는 닫았다가 다시 열어야 적용됩니다.

## 직접 해 보기

아래 데모에서 이 글의 시트를 직접 움직여 볼 수 있습니다. 앞에서 말한 시트 상태 패널과 시트 구조 지도도 함께 떠 있습니다. 처음에는 미리보기만 보이고, 블록 위 버튼으로 코드를 열 수 있습니다.

"장바구니 열기"를 누른 뒤 시트를 내려 보면 됩니다. 모바일은 손가락으로, PC는 시트 위에서 휠이나 트랙패드로 내리면 됩니다. 마우스로 클릭한 채 끌어내리는 동작은 되지 않습니다. 브라우저는 마우스 드래그를 스크롤로 바꿔 주지 않고, 이 예제에도 그것을 대신할 JS가 없기 때문입니다.

```css live file=sheet.css view=preview height=720
/* ==========================================================================
   sheet.css: 실습 핵심
   블로그 "Setting up the viewport"에 해당하는 코드만 있어요.
   [공통 배치]는 모든 브라우저에 적용돼요. [iOS 대응]은 도입 이유를 뜻하며 조건부 실행 표시는 아니에요.
   ========================================================================== */


/* [iOS Safari 조건] 툴바 뒤로 비쳐 보이는 높이 ──────────────────────────────────────────
   원래는 필요 없는 값(0)이에요.
   iOS Safari는 하단 툴바 뒤로도 페이지가 비쳐 보여서, 실제로 보이는 높이가 100dvh보다 길어요.
   원본 Sheet.tsx의 VIEWPORT_PADDING과 같은 값이고, sheet.js가 iOS Safari일 때만 html.ios-safari를 붙여요.
   (원본 주석: "More content than 100lvh is actually visible on iOS, even when the toolbar is collapsed.") */
:root {
  --viewport-padding: 0px;
}
html.ios-safari {
  /* 100svh = 주소창·툴바가 펼쳐졌다고 가정한 페이지 높이,
     100lvh = 주소창·툴바가 접혔다고 가정한 페이지 높이.
     둘의 차이는 브라우저 UI가 접히면서 확보되는 높이예요.
     iOS Safari는 툴바가 접혀도 100lvh 밖의 콘텐츠가 툴바 뒤로 비쳐 보일 수 있어,
     원본 React Aria의 VIEWPORT_PADDING은 이 차이에 58px을 추가로 더해요.
     58px은 원본이 지정한 보정 상수이고, 정확한 산출 근거는 원본에 설명돼 있지 않아요.
     모든 iPhone의 툴바 높이가 58px이라는 뜻은 아니에요.
     이 값은 시트 높이가 아니라 stage·열림 마커의 top과 닫힘 감지 범위에 사용해,
     시트가 툴바 뒤에서도 완전히 사라질 때까지 내려가도록 해요. */
  --viewport-padding: calc(100lvh - 100svh + 58px);
}


/* ① overlay ─ 시트 전체를 감싸는 틀 ───────────────────────────────────────── */
.sheet-overlay {
  /* [공통 배치] 모든 브라우저에서 문서 기준 absolute로 페이지 전체를 덮어요.
     이 구조를 택한 이유는 iOS Safari에서 fixed 요소가 잘리는 문제를 피하기 위해서예요.
     (원본 주석: "absolute rather than fixed so the modal is not clipped by iOS Safari")
     iOS가 아닌 브라우저에서도 fixed로 전환하지 않아요.
     overlay는 문서 맨 위에 두고, 안쪽 scroller를 열 때의 scrollY 위치에 놓아요.
     --page-width / --page-height는 sheet.js가 열 때 넣어줘요.(자식들도 absolute라 필요) */
  position: absolute;
  top: 0;
  left: 0;
  width: max(var(--page-width), 100vw);
  height: max(var(--page-height), 100dvh);
  overflow: clip;
  z-index: 10;
}
.sheet-overlay[hidden] {
  display: none;
}

.sheet-backdrop {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 0.4);
  opacity: 0;
  transition: opacity 0.3s;
}
.sheet-overlay[data-open] .sheet-backdrop {
  opacity: 1;
}


/* ② scroller ─ 200dvh. 스와이프의 정체 ───────────────────────────────── */
.sheet-scroller {
  position: absolute;
  /* 모든 브라우저에서 시트를 열 때 JS가 top을 window.scrollY로 바꿔 현재 화면에 맞춰요.
     예: 페이지를 500px 스크롤한 상태라면 top: 500px. */
  top: 0;
  left: 0;
  width: 100vw;
  height: 200dvh;                  /* 위 절반 = 화면, 아래 절반 = 화면 밖 */
  overflow-x: hidden;
  overflow-y: auto;                /* 전체 콘텐츠가 scroller보다 길어서 스크롤된다 */
  scroll-snap-type: y mandatory;   /* 손을 떼면 반드시 가장 가까운 스냅 마커로 끌려간다 */
  overscroll-behavior-y: contain;  /* 끝에 닿아도 뒤 페이지로 스크롤을 넘기지 않는다 */
  scrollbar-width: none;
}
.sheet-scroller::-webkit-scrollbar {
  display: none;
}


/* ③ 스냅 마커 ─ 높이가 화면 1칸인 투명 div. 부모 스크롤을 끌어당기는 자석 ─── */
.snap-marker {
  position: absolute;
  left: 0;
  width: 1px;
  height: 100dvh;
  pointer-events: none;
}

/* 콘텐츠 맨 위. "내 윗변 = scroller 윗변"이 되는 scrollTop = 0 → 닫힘 */
.snap-marker--exit {
  top: 0;
  scroll-snap-align: start;
}

/* 콘텐츠 맨 아래. "내 아랫변 = scroller 아랫변"이 되는 scrollTop = (200 + 100) − 200 = 100dvh → 열림
   원래는 top: 200dvh.
   [iOS 대응] stage를 툴바 높이만큼 내렸으니(④) 이 마커도 같이 내려요. 열림 위치도 100dvh + 패딩이 돼요. */
.snap-marker--enter {
  top: calc(200dvh + var(--viewport-padding));
  scroll-snap-align: end;
}


/* ④ stage ─ 뷰포트 크기 무대, 시트를 바닥에 붙인다 ───────────────────────────
   stage = 무대. 원본 주석: 'a viewport-sized "stage" (which holds the sheet)'
   스크롤로 움직이는 건 항상 이 화면 크기 무대이고, 시트는 무대 위 배우처럼 flex로 자리만 잡는다.
   그래서 시트 높이가 얼마든 열림/닫힘 계산은 "무대가 화면과 겹치냐"만 보면 된다. */
.sheet-stage {
  position: absolute;
  /* 원래는 top: 100dvh (화면 바로 아래).
     [iOS 대응] 툴바 뒤도 보이니까, 그만큼 더 내려야 닫혔을 때 시트가 완전히 안 보여요. */
  top: calc(100dvh + var(--viewport-padding));
  left: 0;
  width: 100vw;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;  /* 세로 맨 아래 */
  align-items: center;
}


/* ⑦ overscrollPadding ─ 시트 배경을 아래로 연장해 빈틈 가리기 ─────────────
   원래 목적은 끝까지 올린 뒤 더 당길 때(탄성 스크롤) 아래 배경이 끊기지 않게 하는 것.
   iOS Safari에서는 툴바 뒤로도 페이지가 비쳐 보여서, 정지한 열린 상태에서도
   이 옵션이 없으면 시트 아래의 어두운 뒷배경이 드러날 수 있어요.
   padding으로 배경을 늘리고 음수 margin으로 배치상 늘어난 공간을 상쇄해요.
   --viewport-padding(stage·마커 위치와 닫힘 판정 보정)과는 별개의 역할이에요. */
.sheet.overscroll-padding {
  padding-bottom: 100vh;   /* 배경을 화면 1칸만큼 아래로 늘리고 */
  margin-bottom: -100vh;   /* 배치에는 영향 없게 상쇄 */
}


/* 시트가 열려 있는 동안 뒤 페이지 스크롤 잠금 */
html.sheet-open {
  overflow: hidden;
}
```

```js live file=sheet.js
// 01 · 기본 배치, 열기·닫기, 사라짐 감지. 다른 단계도 이 함수를 재사용해요.
// main.js가 createSheet()를 호출해야 실행되므로, 다른 단계에서 import해도 중복 초기화되지 않아요.

import {getViewportPadding} from './shared/sheet-geometry.js';

// [iOS Safari 조건] iOS Safari면 html에 ios-safari 클래스를 붙인다 → sheet.css의 --viewport-padding이 켜진다.
// 원본 Sheet.tsx의 isIOS() && isSafari()에 해당. 앱 웹뷰(WKWebView)는 UA에 "Safari"가 없어서 빠진다.
const ua = navigator.userAgent;
export const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);

// options의 콜백은 아래 열기·닫기 흐름의 해당 위치에서 추가 작업을 실행한다.
// 각 콜백에는 {overlay, scroller, stage, sheet, content}를 넘긴다.
// 01은 옵션 없이 사용한다. useDataOpenTransition은 data-open 추가·삭제로 배경의 CSS transition을 시작할지 정한다.
export function createSheet(overlay, options = {}) {
  document.documentElement.classList.toggle('ios-safari', isIOS && isSafari);
  const scroller = overlay.querySelector('.sheet-scroller');
  const stage = overlay.querySelector('.sheet-stage');
  const sheet = overlay.querySelector('.sheet');
  const content = overlay.querySelector('.sheet-content');
  const elements = {overlay, scroller, stage, sheet, content};
  const useDataOpenTransition = options.useDataOpenTransition ?? true;

  // 04에서는 여러 장 중 하나라도 열려 있으면 잠금을 유지하는 함수로 교체한다.
  function updatePageScrollLock() {
    if (options.updatePageScrollLock) options.updatePageScrollLock();
    else document.documentElement.classList.toggle('sheet-open', !overlay.hidden);
  }

  let observer;

  // 열림 위치 = enter 마커 아랫변이 scroller 아랫변에 닿는 scrollTop
  //          = (마커 top + 마커 높이) − scroller 높이
  function getFullyOpenScrollTop() {
    const marker = overlay.querySelector('.snap-marker--enter');
    return marker.offsetTop + marker.offsetHeight - scroller.clientHeight;
  }


  // ⑤ 열기 ─ 스크롤 자체가 애니메이션 ─────────────────────────────────────────
  function open() {
    const overscrollOption = document.querySelector('#opt-overscroll');
    if (overscrollOption) sheet.classList.toggle('overscroll-padding', overscrollOption.checked);

    // [공통 배치] 모든 브라우저에서 overlay는 문서 기준 absolute다.
    // overlay에 페이지 전체 크기를 알려주고, scroller를 현재 화면 맨 위에 맞춘다.
    // 예: 페이지를 500px 스크롤했다면 scroller의 문서상 top도 500px로 둔다.
    overlay.style.setProperty('--page-width', `${document.documentElement.scrollWidth}px`);
    overlay.style.setProperty('--page-height', `${document.documentElement.scrollHeight}px`);
    scroller.style.top = `${window.scrollY}px`;

    options.beforeShow?.(elements);
    overlay.hidden = false;
    updatePageScrollLock();

    startCloseObserver();
    options.afterShow?.(elements);

    requestAnimationFrame(() => {
      if (useDataOpenTransition) overlay.dataset.open = '';
      const top = options.getOpenScrollTop?.(elements) ?? getFullyOpenScrollTop();
      scroller.scrollTo({top, behavior: 'smooth'});
      options.afterScrollStart?.(elements);
    });
  }


  // ⑥ 닫힘 감지 ─ 시트가 화면에서 완전히 사라지면 숨긴다 ─────────────────────
  function startCloseObserver() {
    // iOS Safari에서 툴바 뒤에 아직 보이는 콘텐츠를 닫혔다고 판단하지 않도록 범위를 늘린다.
    // 계산은 모든 브라우저에서 실행하며, 다른 브라우저에서는 0px이다.
    const paddingPx = getViewportPadding(scroller, stage);

    let hasEntered = false;
    observer = new IntersectionObserver(
      ([entry]) => {
        // 막 열 때는 시트가 아직 화면 밖이라 isIntersecting = false로 한 번 온다.
        // 한 번이라도 보인 뒤에 사라졌을 때만 닫는다.
        hasEntered ||= entry.isIntersecting;
        if (hasEntered && !entry.isIntersecting) {
          hide();
        }
      },
      {rootMargin: `0px 0px ${paddingPx}px 0px`}
    );

    // .sheet가 아니라 .sheet-content를 본다. overscrollPadding을 켜면 .sheet는 아래로 100vh 늘어나기 때문.
    observer.observe(content);
  }


  // 닫기(✕) ─ 직접 숨기지 않고 0으로 스크롤만 한다 ──────────────────────────
  // 그러면 스와이프로 닫을 때와 똑같이 ⑥이 "사라졌다"를 감지해서 hide()가 불린다.
  function close() {
    options.beforeClose?.(elements);
    // 닫기 버튼을 누른 순간부터 배경의 CSS transition: opacity 0.3s를 시작하도록 data-open을 지운다.
    // hide()까지 기다리면 배경은 계속 어둡다가 overlay 전체와 함께 한 번에 숨겨진다.
    if (useDataOpenTransition) delete overlay.dataset.open;
    scroller.scrollTo({top: 0, behavior: 'smooth'});
  }

  function hide() {
    observer.disconnect();
    options.beforeHide?.(elements);
    // 손으로 내려 닫으면 close()를 거치지 않으므로 여기서도 data-open을 지워야 한다.
    // 남겨두면 다음에 열 때 배경이 처음부터 어두운 상태로 나타난다.
    // 버튼으로 닫았다면 close()에서 이미 지웠으므로, 이 줄은 아무 변화도 일으키지 않는다.
    if (useDataOpenTransition) delete overlay.dataset.open;
    overlay.hidden = true;
    updatePageScrollLock();
  }


  // 이벤트 연결은 createSheet()를 호출할 때 시트마다 한 번만 한다.
  for (const button of overlay.querySelectorAll('[data-close]')) {
    button.addEventListener('click', close);
  }
  return {open, close};
}
```

```html live file=index.html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <link rel="icon" href="data:,">
  <title>01 · 스크롤 뷰포트로 만든 시트</title>
  <!-- 겉모습 (실습과 무관) -->
  <link rel="stylesheet" href="./ui.css">
  <!-- ★ 실습 핵심 -->
  <link rel="stylesheet" href="./sheet.css">
  <script type="module" src="./main.js"></script>
  <!-- 확인용 도구 (실습과 무관) -->
  <link rel="stylesheet" href="./shared/debug.css">
  <script type="module" src="./shared/debug.js"></script>
</head>
<body>
  <main class="page">
    <h1>01 · 스크롤만으로 여닫는 시트</h1>
    <p class="lead">
      시트를 끌어내리는 동작은 사실 <code>.sheet-scroller</code>를 스크롤하는 거예요.
      터치 이벤트 코드는 한 줄도 없어요.
    </p>

    <aside class="input-guide" aria-label="조작 방법">
      <p><strong>PC(마우스):</strong> 시트를 클릭한 채 잡아 내리는 드래그는 지원하지 않아요. 대신 시트 위에서 휠이나 트랙패드로 스크롤해 내릴 수 있어요.</p>
      <p><strong>모바일(터치):</strong> 브라우저가 손가락으로 미는 동작을 기본 스크롤로 처리해요. 시트는 그 스크롤 영역 안에 있으므로, 별도의 JS 드래그 처리 없이도 손가락을 따라 내려오는 것처럼 보여요.</p>
    </aside>

    <button class="btn btn--primary" id="open-sheet">장바구니 열기</button>

    <label class="option">
      <input type="checkbox" id="opt-overscroll">
      <span><code>overscrollPadding</code> 켜기<small>시트 배경을 아래로 연장해요. iOS 하단 툴바 뒤와 끝에서 더 당길 때의 빈틈을 비교하세요. 변경 후 다시 열면 적용돼요.</small></span>
    </label>

    <section class="filler" aria-hidden="true">
      <p>뒤쪽 페이지 콘텐츠예요. 시트가 열려 있는 동안 이 페이지는 스크롤되면 안 돼요.</p>
      <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
    </section>

    <button class="btn btn--primary" onclick="document.querySelector('#open-sheet').click()">여기서도 열기</button>
  </main>

  <!-- 확인용: 시트 상태 패널 -->
  <aside class="hud">
    <p class="panel-title">시트 상태</p>
    <div><span>state</span><b id="hud-state">closed</b></div>
    <div><span>scrollTop</span><b id="hud-scroll">-</b></div>
    <div><span>ratio</span><b id="hud-ratio">-</b></div>
    <div><span>viewport</span><b id="hud-vp">-</b></div>
  </aside>

  <!-- 확인용: 시트 구조 지도 (.sheet-scroller 안 콘텐츠 전체를 축소한 지도) -->
  <aside class="minimap">
    <p class="panel-title">시트 구조 지도 <small>.sheet-scroller 안</small></p>
    <p class="mm-status" id="mm-status"></p>
    <div class="mm-body">
    <div class="mm-canvas">
      <div class="mm-marker" id="mm-exit"></div>
      <div class="mm-stage" id="mm-stage"></div>
      <div class="mm-sheet" id="mm-sheet"></div>
      <div class="mm-marker" id="mm-enter"></div>
      <div class="mm-toolbar" id="mm-toolbar"></div>
      <div class="mm-scroller" id="mm-scroller"></div>
      <div class="mm-window" id="mm-window"></div>
    </div>
    <ul class="mm-legend">
      <li><i style="border:2px solid #0a84ff"></i>뷰포트</li>
      <li><i style="border:2px dashed #ff3b30"></i>scroller가<br>보는 구간</li>
      <li><i style="background:rgb(255 159 10 / .5)"></i>스냅 마커</li>
      <li><i style="border:1px solid #34c759"></i>stage</li>
      <li><i style="background:#a79cf5"></i>시트 콘텐츠</li>
    </ul>
    </div>
  </aside>

  <!--
    시트의 DOM 구조. 처음부터 DOM에 있고, 열고 닫을 때는 hidden 속성만 켜고 끈다.

    .sheet-overlay        ① 시트 전체를 감싸는 틀
    └ .sheet-scroller     ② 200dvh scroller = 스와이프의 정체
       ├ .snap-marker--exit   ③ 콘텐츠 맨 위, start → scrollTop 0 (닫힘)
       ├ .sheet-stage         ④ 뷰포트 크기 stage, 시트를 바닥에 붙임
       │  └ .sheet
       │     └ .sheet-content ⑥ IntersectionObserver가 지켜보는 대상
       └ .snap-marker--enter  ③ 콘텐츠 맨 아래, end → scrollTop 최대 (열림)
  -->
  <div class="sheet-overlay" hidden>
    <div class="sheet-backdrop"></div>

    <div class="sheet-scroller">
      <div class="snap-marker snap-marker--exit"></div>

      <div class="sheet-stage">
        <div class="sheet">
          <div class="sheet-content">
            <div class="grabber"></div>
            <header class="sheet-header">
              <h2>장바구니 (4)</h2>
              <button class="btn btn--icon" data-close>✕</button>
            </header>
            <ul class="item-list cart">
              <li><span class="thumb" style="--c:#c9c2f5"></span><span>무선 이어폰<small>1개</small></span><b>129,000원</b></li>
              <li><span class="thumb" style="--c:#a8e0cc"></span><span>충전 케이블<small>2개</small></span><b>24,000원</b></li>
              <li><span class="thumb" style="--c:#f5c8b6"></span><span>휴대폰 케이스<small>1개</small></span><b>19,000원</b></li>
              <li><span class="thumb" style="--c:#b8d4f2"></span><span>보조배터리<small>1개</small></span><b>39,000원</b></li>
            </ul>
            <div class="total"><span>합계</span><b>211,000원</b></div>
            <button class="btn btn--primary btn--block">결제하기</button>
          </div>
        </div>
      </div>

      <div class="snap-marker snap-marker--enter"></div>
    </div>
  </div>
</body>
</html>
```

```js live file=main.js hidden
// 이 페이지의 createSheet로 한 장을 만들고 열기 버튼을 연결한다.
import {createSheet} from './sheet.js';
import {mountSheet} from './shared/mount-sheet.js';

mountSheet(createSheet);
```

```css live file=ui.css hidden
/* ==========================================================================
   ui.css: 겉모습 전용. 실습 원리와 무관해요.
   페이지, 버튼, 시트 안쪽(장바구니) 디자인.
   ========================================================================== */

:root {
  color-scheme: light dark;
  --page-bg: #f5f5f2;
  --surface: #ffffff;
  --text: #1d1d1f;
  --muted: #6e6e73;
  --line: rgb(0 0 0 / 0.1);
  --accent: #0a66ff;
  --on-accent: #ffffff;
}
@media (prefers-color-scheme: dark) {
  :root {
    --page-bg: #111112;
    --surface: #1e1e20;
    --text: #f2f2f2;
    --muted: #9a9aa0;
    --line: rgb(255 255 255 / 0.12);
  }
}

* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  background: var(--page-bg);
  color: var(--text);
  font-family: -apple-system, system-ui, sans-serif;
  line-height: 1.6;
  -webkit-text-size-adjust: 100%;
}
code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.88em; }

/* 뒤쪽 페이지 */
.page {
  max-width: 560px;
  margin: 0 auto;
  /* 위쪽 숫자 패널, 미니맵에 가리지 않도록 위쪽 여백을 크게 */
  padding: calc(232px + env(safe-area-inset-top)) 20px 80px;
}
.back { color: var(--muted); text-decoration: none; font-size: 14px; }
h1 { font-size: 22px; font-weight: 600; margin: 12px 0 8px; }
.lead { color: var(--muted); margin: 0 0 20px; }
.input-guide { margin: 0 0 20px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 10px; font-size: 14px; }
.input-guide p { margin: 0; }
.input-guide p + p { margin-top: 8px; }
.option { display: flex; gap: 10px; align-items: flex-start; margin: 20px 0; font-size: 15px; }
.option input { margin-top: 5px; }
.option small { display: block; color: var(--muted); font-size: 13px; }
.tasks { border-top: 1px solid var(--line); padding-top: 8px; font-size: 15px; }
.tasks h2 { font-size: 16px; font-weight: 600; }
.tasks ol { padding-left: 20px; }
.tasks li { margin-bottom: 8px; }
.filler div { height: 120px; border-radius: 12px; background: var(--line); margin: 12px 0; }

/* 버튼 */
.btn {
  font: inherit;
  border: 0;
  border-radius: 12px;
  padding: 12px 20px;
  cursor: pointer;
  background: var(--line);
  color: var(--text);
}
.btn--primary { background: var(--accent); color: var(--on-accent); font-weight: 600; }
.btn--block { display: block; width: 100%; }
.btn--icon { width: 36px; height: 36px; padding: 0; border-radius: 50%; font-size: 14px; }

/* 시트 겉모습 */
.sheet {
  width: 100%;
  max-width: 560px;
  background: var(--surface);
  border-radius: 20px 20px 0 0;
}
.sheet-content {
  padding: 8px 20px calc(20px + env(safe-area-inset-bottom));
}
.grabber { width: 40px; height: 5px; border-radius: 3px; background: var(--line); margin: 0 auto 8px; }
.sheet-header { display: flex; align-items: center; justify-content: space-between; }
.sheet-header h2 { font-size: 18px; font-weight: 600; margin: 0; }
/* 장바구니와 주변 맛집 목록이 함께 쓰는 기본 스타일 */
.item-list { list-style: none; padding: 0; margin: 0; }
.item-list li { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--line); }
.item-list small { display: block; color: var(--muted); font-size: 13px; }
.cart { margin: 12px 0; }
.cart li > span:nth-child(2) { flex: 1; }
.thumb { width: 44px; height: 44px; border-radius: 10px; background: var(--c); }
.total { display: flex; justify-content: space-between; margin: 4px 0 16px; }
```

```css live file=shared/debug.css hidden
/* ==========================================================================
   debug.css: 확인용 도구. 실습 원리와 무관해요.
   왼쪽 위 시트 상태 패널, 오른쪽 위 시트 구조 지도.
   ========================================================================== */

.hud,
.minimap {
  position: fixed;
  top: calc(8px + env(safe-area-inset-top));
  z-index: 20;               /* 시트보다 위 */
  padding: 8px 10px;
  border-radius: 10px;
  background: rgb(0 0 0 / 0.78);
  color: #fff;
  font: 11px/1.5 ui-monospace, Menlo, monospace;
  pointer-events: none;
}

/* 숫자 패널 */
.hud {
  left: 8px;
  width: 150px;
}
.hud div { display: flex; justify-content: space-between; gap: 6px; }
.hud span { opacity: 0.6; }
.hud b { font-weight: 500; text-align: right; }

/* 미니맵: 스크롤 상자 안 콘텐츠 전체를 축소한 지도 (왼쪽 지도 + 오른쪽 범례) */
.minimap {
  right: 8px;
  padding: 8px;
}
/* 시트가 지금 화면에 그려지고 있는지 */
.mm-status { margin: 0 0 6px; font-size: 10px; line-height: 1.4; }
.mm-status b { font-weight: 600; }
.minimap.is-hidden .mm-status { color: #ffcc66; }
.minimap.is-shown .mm-status { color: #7ee2a8; }
.minimap.is-hidden .mm-body { opacity: 0.4; }   /* 숨김 상태일 때 지도를 흐리게 */

.mm-body {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 패널 제목: 무엇에 대한 패널인지 */
.panel-title {
  margin: 0 0 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgb(255 255 255 / 0.2);
  font-weight: 600;
}
.panel-title small {
  display: block;
  font-weight: 400;
  opacity: 0.6;
  font-size: 10px;
}
.mm-canvas {
  position: relative;
  height: 120px;
  width: 48px;
  flex: none;
}
.mm-canvas > div { position: absolute; left: 8px; right: 8px; box-sizing: border-box; }
.mm-marker  { background: rgb(255 159 10 / 0.35); border: 1px dashed #ff9f0a; }
.mm-stage   { border: 1px solid #34c759; }
.mm-sheet   { background: #a79cf5; border-radius: 4px 4px 0 0; }  /* .sheet-content 위치·크기 */
.mm-toolbar { left: 0 !important; right: 0 !important; background: repeating-linear-gradient(45deg, rgb(255 255 255 / 0.25) 0 3px, transparent 3px 6px); }
.mm-scroller { left: -4px !important; right: -4px !important; border: 2px dashed #ff3b30; border-radius: 4px; }
.mm-window   { left: 0 !important; right: 0 !important; border: 2px solid #0a84ff; }
.mm-legend { list-style: none; margin: 0; padding: 0; font-size: 10px; line-height: 1.6; }
.mm-legend i { display: inline-block; width: 10px; height: 8px; margin-right: 4px; vertical-align: 0; }

/* 미니맵을 항상 보여주기 위한 장치.
   sheet.css는 닫힌 시트를 display: none으로 숨기는데, 그러면 위치·크기를 읽을 수 없어요.
   확인용으로만 display는 살려두고 visibility: hidden으로 숨겨서, 닫힌 상태의 배치도 미니맵에 그려요.
   (크기를 0으로 줄여서 페이지 레이아웃에는 영향 없음. 안의 요소들은 그대로 배치돼요.) */
.sheet-overlay[hidden] {
  display: block;
  visibility: hidden;
  width: 0;
  height: 0;
}

/* 해당 HTML 요소가 있는 단계에서만 쓰는 표시 */
.hud--extended { width: 168px; }
.hud .hud-sep { margin-top: 4px; padding-top: 4px; border-top: 1px solid rgb(255 255 255 / 0.15); }
.mm-marker.is-off { background: none; border-color: rgb(255 255 255 / 0.35); }  /* [03] 스냅이 꺼진 마커 */
.mm-snap-point { height: 0 !important; left: 0 !important; right: 0 !important; border-top: 2px solid #ff6fb5; }  /* [02] 스냅 포인트 */
#mm-which { font-weight: 400; opacity: 0.7; }
#hud-stack { display: block; }  /* [04·07] 쌓인 시트 목록 */
```

```js live file=shared/debug.js hidden
// ==========================================================================
// debug.js: 확인용 도구. 실습 원리와 무관해요. (01 ~ 07 단계 공통)
// 매 프레임 실제 DOM 값을 읽어서 왼쪽 위 "시트 상태" 패널과 오른쪽 위 "시트 구조 지도"를 그린다.
// 패널에 있는 줄(id)만 채우고, 없는 줄은 건너뛴다. sheet.js는 전혀 건드리지 않는다.
// ==========================================================================

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const setPanelText = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

const overlays = $$('.sheet-overlay');

// CSS 값을 px로 읽기 위한 보이지 않는 측정용 막대
function createHeightProbe(height) {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;left:-10px;top:0;width:1px;visibility:hidden;pointer-events:none;height:${height}`;
  document.body.append(el);
  return el;
}
const toolbarProbe = createHeightProbe('var(--viewport-padding, 0px)'); // [iOS] 툴바 뒤 높이
const dvhProbe = createHeightProbe('100dvh');

// 시트 구조 지도
const MAP_HEIGHT = 120;
const minimap = $('.minimap');
const canvas = $('.mm-canvas');
const map = {
  exit: $('#mm-exit'),
  stage: $('#mm-stage'),
  sheet: $('#mm-sheet'),
  enter: $('#mm-enter'),
  toolbar: $('#mm-toolbar'),
  scroller: $('#mm-scroller'),
  window: $('#mm-window')
};

// 지금 지도에 그릴 시트: 열려 있는 것 중 맨 위, 없으면 첫 번째
function getCurrentOverlay() {
  const shown = overlays.filter(o => !o.hidden);
  return shown.at(-1) ?? overlays[0];
}

function renderDebugPanels() {
  const vv = window.visualViewport;
  setPanelText('hud-vp', `${window.innerHeight} · ${vv ? Math.round(vv.height) : '-'}`);

  const overlay = getCurrentOverlay();
  const scroller = $('.sheet-scroller', overlay);
  const stage = $('.sheet-stage', overlay);
  const sheet = $('.sheet', overlay);
  const content = $('.sheet-content', overlay);
  const exitMarker = $('.snap-marker--exit', overlay);
  const enterMarker = $('.snap-marker--enter', overlay);
  const snapPoints = $$('.snap-point', overlay);

  // 패널은 열기 전뿐 아니라 스크롤 중·닫힌 동안에도 그린다.
  // 현재 scrollTop을 더해 움직이기 전 좌표를 구한다. 닫힌 상태에서 페이지를 스크롤하면
  // 상자의 화면상 top도 달라지므로, 그 위치도 빼서 지도 좌표를 유지한다.
  const getElementTop = el => el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;

  const top = scroller.scrollTop;
  const entered = enterMarker.offsetTop + enterMarker.offsetHeight - scroller.clientHeight;
  const viewport = scroller.clientHeight / 2; // 100dvh
  const padding = toolbarProbe.offsetHeight;

  // 상태 ------------------------------------------------------------------
  let state = 'moving';
  if (overlay.hidden) state = 'closed';
  else if (Math.abs(top - entered) <= 1) state = 'open';
  else if (top <= 1 && overlay.dataset.clamped === undefined) state = 'at 0';
  else {
    const i = snapPoints.findIndex(d => Math.abs(top - (getElementTop(d) - parseFloat(getComputedStyle(d).scrollMarginTop))) <= 1);
    if (i >= 0) state = `snap-point ${i + 1}`;
  }
  setPanelText('hud-state', state);
  setPanelText('hud-scroll', `${Math.round(top)} / ${Math.round(entered)}`);

  // ⑥이 보는 기준과 같게: .sheet-content가 (화면 + 툴바 패딩) 안에 몇 % 보이나
  const rect = content.getBoundingClientRect();
  const visible = Math.max(0, Math.min(rect.bottom, window.innerHeight + padding) - Math.max(rect.top, 0));
  setPanelText('hud-ratio', overlay.hidden ? '-' : (visible / rect.height).toFixed(2));

  // [06·07] view-timeline 진행률: .sheet-content가 보이는 구간(위 100dvh)에 들어온 정도 (entry 범위)
  const contentTop = getElementTop(content);
  const progress = Math.min(1, Math.max(0, (top + viewport - contentTop) / rect.height));
  setPanelText('hud-progress', `${Math.round(progress * 100)}%`);
  const backdrop = $('.sheet-backdrop', overlay);
  setPanelText('hud-backdrop', Number(getComputedStyle(backdrop).opacity).toFixed(2));
  setPanelText('hud-radius', `${Math.round(parseFloat(getComputedStyle(sheet).borderTopLeftRadius))}px`);

  // [02] 펼쳐짐 / [03] 고정 배치
  setPanelText('hud-expanded', sheet.dataset.expanded !== undefined ? 'yes' : 'no');
  setPanelText('hud-clamped', overlay.dataset.clamped !== undefined ? `yes · ${getComputedStyle(overlay).getPropertyValue('--clamped-travel').trim()}` : 'no');
  setPanelText('hud-snap', getComputedStyle(scroller).scrollSnapType);

  // [04·07] 쌓인 시트들. scale은 실제 축소 효과가 있는 07에서만 표시한다.
  const stackRow = document.getElementById('hud-stack');
  if (stackRow) {
    stackRow.innerHTML = overlays
      .map((o, i) => {
        const s = $('.sheet', o);
        const scale = getComputedStyle(s).scale;
        const shown = o.hidden ? '닫힘' : '열림';
        const scaleText = scale === 'none' ? '' : ` · scale ${Number(scale).toFixed(2)}`;
        return `<div><span>#${i}</span><b>${shown}${scaleText}</b></div>`;
      })
      .join('');
  }

  // [05_01~05_04] 키보드 정보 표시 (시트 보정에는 관여하지 않음)
  if (vv) {
    setPanelText('hud-keyboard', `${Math.round(dvhProbe.offsetHeight - vv.height)}px`);
    setPanelText('hud-vvtop', `${Math.round(vv.offsetTop)}`);
  }
  setPanelText('hud-pagey', `${Math.round(window.scrollY)}`);
  const active = document.activeElement;
  setPanelText('hud-focus', active && active !== document.body ? (active.name || active.className || active.tagName.toLowerCase()) : 'body');

  // 시트 구조 지도 -----------------------------------------------------------
  minimap.classList.toggle('is-hidden', overlay.hidden);
  minimap.classList.toggle('is-shown', !overlay.hidden);
  setPanelText('mm-which', overlays.length > 1 ? `#${overlays.indexOf(overlay)} 시트` : '');
  $('#mm-status').innerHTML = overlay.hidden
    ? '<b>● 숨김</b> hidden 속성<br>시트가 화면에 안 그려짐'
    : '<b>● 표시 중</b><br>시트가 화면에 그려짐';

  const contentHeight = enterMarker.offsetTop + enterMarker.offsetHeight;
  const k = MAP_HEIGHT / contentHeight;
  const setMinimapBox = (el, y, h) => {
    el.style.top = `${y * k}px`;
    el.style.height = `${Math.max(0, h) * k}px`;
  };
  setMinimapBox(map.exit, exitMarker.offsetTop, exitMarker.offsetHeight);
  map.exit.classList.toggle('is-off', getComputedStyle(exitMarker).scrollSnapAlign.includes('none'));
  setMinimapBox(map.stage, getElementTop(stage), stage.offsetHeight);
  setMinimapBox(map.sheet, contentTop, rect.height); // .sheet-content
  setMinimapBox(map.enter, enterMarker.offsetTop, enterMarker.offsetHeight);
  setMinimapBox(map.scroller, top, scroller.clientHeight); // 스크롤 상자가 지금 보고 있는 구간
  setMinimapBox(map.window, top, window.innerHeight); // 보이는 구간
  setMinimapBox(map.toolbar, top + window.innerHeight, padding); // [iOS] 툴바 뒤

  // [02] 스냅 포인트: 시트 안 마커 위치에 분홍 선
  let lines = $$('.mm-snap-point', canvas);
  while (lines.length < snapPoints.length) {
    const line = document.createElement('div');
    line.className = 'mm-snap-point';
    canvas.append(line);
    lines = $$('.mm-snap-point', canvas);
  }
  lines.forEach((line, i) => {
    line.hidden = !snapPoints[i];
    if (snapPoints[i]) line.style.top = `${getElementTop(snapPoints[i]) * k}px`;
  });

  requestAnimationFrame(renderDebugPanels);
}
requestAnimationFrame(renderDebugPanels);
```

```js live file=shared/sheet-geometry.js hidden
// 기본 배치에서 stage.top = 100dvh + 보정값, scroller.height = 200dvh.
// 두 값으로 CSS의 --viewport-padding을 px로 구해, 닫힘·펼쳐짐 observer에 같은 범위를 쓴다.
// 03이 stage를 옮기는 applyDismissalConstraint() 이전에 측정해야 한다. iOS Safari 외에는 보정값이 0이다.
export function getViewportPadding(scroller, stage) {
  return stage.offsetTop - scroller.clientHeight / 2;
}
```

```js live file=shared/mount-sheet.js hidden
// 한 장짜리 예제들의 공통 시작 코드. 각 main.js가 자기 단계의 createSheet를 넘긴다.
// 이전 단계의 main.js를 import하면 그 단계까지 실행되므로, 버튼 연결만 여기서 재사용한다.
export function mountSheet(createSheet) {
  const sheet = createSheet(document.querySelector('.sheet-overlay'));
  document.querySelector('#open-sheet').addEventListener('click', sheet.open);
}
```

## 아직 남은 것

1편에서는 exit 마커가 닫힘 위치를, enter 마커가 열림 위치를 정합니다. 시트를 중간까지 내리다 놓으면 두 위치 중 하나로 붙습니다. 이 상태에서 아직 설명하지 않은 부분과 부족한 부분이 하나씩 있습니다.

하나는 iOS Safari 보정입니다. 코드에 있는 `--viewport-padding: calc(100lvh - 100svh + 58px)`는 iOS Safari에서 툴바 뒤로 비쳐 보이는 영역만큼 stage 위치와 닫힘 판정 범위를 늘리는 값입니다. React Aria 코드에 `58px`의 근거가 적혀 있지 않아서 따로 조사했는데, 그 내용은 2편에서 정리하려고 합니다.

다른 하나는 시트 뒤쪽 배경입니다. 4편에서는 시트가 열려 있을 때 스크롤 위치에 따라 배경의 어두운 정도를 조절해 보려고 합니다.

손가락을 따라 내려오고, 놓으면 붙고, 끝에서 튕기는 동작은 전부 CSS로 만든 scroller가 했습니다. JS는 열 때 스크롤을 한 번 시키고, 사라진 시트를 숨겼을 뿐입니다.

다음 글은 시리즈 2편 [iOS Safari 툴바 뒤에서 시트가 덜 사라질 때](../css-bottom-sheet-2-ios-safari/)입니다. 이 시트를 iPhone Safari에 올리면 무엇이 어긋나는지, `calc(100lvh - 100svh + 58px)`가 무엇을 보정하는지 정리했습니다.
