---
title: "CSS로 만드는 네이티브 같은 바텀시트 4편: 손가락을 따라오는 backdrop과 모서리"
date: "2026-11-15T09:00:00.000Z"
description: "view-timeline으로 시트 콘텐츠의 위치를 추적하는 타임라인을 선언합니다. 시트가 들어오는 진행률에 배경의 불투명도와 모서리 반경을 연결해 손가락 움직임을 따라가게 만듭니다."
tags: ["CSS"]
---

> **시리즈 목차**
>
> 1. [터치 이벤트 없이 스크롤 스냅으로 여닫기](../css-bottom-sheet-1-scroll-snap/)
> 2. [iOS Safari 툴바 뒤에서 시트가 덜 사라질 때](../css-bottom-sheet-2-ios-safari/)
> 3. [지도 앱처럼 중간에 멈추고, 스와이프로는 닫히지 않게](../css-bottom-sheet-3-snap-points/)
> 4. 손가락을 따라오는 backdrop과 모서리 (이 글)
> 5. [여러 시트를 겹쳐 열고 뒤 시트를 밀어내기](../css-bottom-sheet-5-stacked-sheets/)
> 6. 부록: [키보드가 시트를 가릴 때](../css-bottom-sheet-6-keyboard/)
> 7. 부록: 키보드 애니메이션에 시트를 맞추기 (준비 중)

시트를 올리면 뒤쪽 배경이 어두워지고, 내리면 다시 밝아지게 하려고 합니다. 시트의 모서리도 들어오는 정도에 맞춰 둥근 모양에서 조금 각진 모양으로 바꾸겠습니다.

이 변화들을 스크롤 위치에 연결하면 손가락이 멈출 때 효과도 멈추고, 반대로 움직이면 효과도 되돌아갑니다. CSS의 `view-timeline`으로 시트 콘텐츠의 위치를 추적하는 타임라인을 선언하고, 배경과 모서리 애니메이션을 여기에 연결하겠습니다.

## 시트가 들어오는 정도를 진행률로 쓴다

`view-timeline`으로 요소가 scroller 안에서 어디에 있는지를 추적하는 타임라인을 선언합니다. 이 예제에서는 `.sheet-content`에 `--sheet`라는 이름의 타임라인을 만듭니다.

```css
.sheet-content {
  view-timeline-name: --sheet;
  view-timeline-axis: y;
  view-timeline-inset: 0 100dvh;
}
```

`view-timeline-name: --sheet`는 `.sheet-content`의 위치를 추적할 타임라인을 선언하고, 그 이름을 `--sheet`로 정합니다. `view-timeline-axis: y`는 세로 방향으로 위치를 추적하도록 설정합니다.

이렇게 선언한 타임라인은 뒤에서 `animation-timeline: --sheet`로 참조해 애니메이션에 연결합니다. `--sheet`는 타임라인 이름이므로 CSS 변수처럼 `var(--sheet)`로 읽지 않습니다.

여기서도 1편의 scroller 높이는 `200dvh`입니다. 그중 뷰포트에 보이는 부분은 위쪽 `100dvh`뿐입니다. 타임라인이 scroller 전체를 기준으로 삼으면, 뷰포트 아래에 숨어 있는 시트도 이미 들어온 것으로 계산할 수 있습니다.

`view-timeline-inset: 0 100dvh`는 기준 영역의 위쪽을 0px, 아래쪽을 `100dvh`만큼 안으로 줄입니다. scroller의 높이나 스크롤 범위를 바꾸는 코드는 아닙니다. 타임라인이 위치를 판단할 구간을 뷰포트와 맞추는 설정입니다.

## 배경과 모서리를 같은 진행률에 묶는다

앞에서 선언한 `--sheet` 타임라인을 `animation-timeline`으로 배경과 모서리 애니메이션에 연결합니다. 배경은 투명한 상태에서 정해 둔 어두운 색까지, 모서리는 48px에서 12px까지 바꿉니다. 아래 코드의 `.sheet-backdrop`이 시트 뒤쪽 배경입니다.

```css
@keyframes backdrop-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes sheet-corner {
  from { border-radius: 48px 48px 0 0; }
  to   { border-radius: 12px 12px 0 0; }
}

.sheet-backdrop {
  background: rgb(0 0 0 / 0.4);
  transition: none;
  animation: backdrop-fade linear both;
  animation-timeline: --sheet;
  animation-range: entry 0% entry 100%;
}

.sheet {
  animation: sheet-corner linear both;
  animation-timeline: --sheet;
  animation-range: entry 0% entry 100%;
}
```

`animation-range`의 `entry`는 콘텐츠가 기준 영역으로 들어오는 구간입니다. 이 예제처럼 콘텐츠가 기준 영역보다 작다면, 콘텐츠 윗변이 아래쪽 경계에 닿을 때 0%, 콘텐츠 아랫변까지 들어왔을 때 100%입니다. 위에서 정한 inset 덕분에 그 아래쪽 경계는 뷰포트 아랫변과 같습니다.

`linear`는 진행률에 비례해 값을 바꾸고, `both`는 entry 구간 전후에도 시작값과 끝값을 유지합니다. 절반쯤 들어왔다가 다시 내리면 애니메이션도 같은 구간을 거꾸로 지나갑니다. 손가락을 뗀 뒤 브라우저가 스냅 위치로 스크롤할 때도 그 위치를 계속 따라갑니다.

뷰포트가 800px이고, 시트와 그 안의 콘텐츠가 모두 400px이며 iOS 보정값은 0px이라고 가정하겠습니다. 닫혀 있을 때 콘텐츠 윗변은 전체 콘텐츠의 1200px에 있습니다. `scrollTop`이 400px에 도달해야 그 윗변이 뷰포트 아랫변 800px에 닿습니다. 여기서 200px 더 스크롤하면 콘텐츠의 절반이 들어와 entry 진행률도 50%가 됩니다.

| scrollTop | entry | opacity | 반경 |
| --- | --- | --- | --- |
| 400px | 0% | 0 | 48px |
| 600px | 50% | 0.5 | 30px |
| 800px | 100% | 1 | 12px |

`opacity: 1`이어도 배경이 완전히 검게 되는 것은 아닙니다. 배경색 자체가 `rgb(0 0 0 / 0.4)`이므로, 이 한 겹의 최대 불투명도는 40%입니다.

기준은 `scrollTop / 최대 scrollTop`이 아니라 콘텐츠가 들어오는 구간입니다. 콘텐츠 높이가 달라지면 entry가 시작하고 끝나는 스크롤 위치도 달라집니다. 아래 데모처럼 시트에 최소 높이를 주어 콘텐츠 아래에 여유가 생기면, 열림 위치에 도착하기 전에 콘텐츠가 모두 들어올 수도 있습니다.

선언 순서도 한 가지 주의해야 합니다. `animation` 단축 속성은 `animation-timeline`과 `animation-range`를 초기화하므로, 타임라인과 범위는 단축 속성 뒤에 씁니다.

## 타임라인을 참조할 범위를 넓힌다

타임라인을 만든 요소는 `.sheet-content`인데, 애니메이션을 적용할 요소는 그 부모인 `.sheet`와 다른 가지의 `.sheet-backdrop`입니다.

```text
.sheet-overlay
├ .sheet-backdrop       배경 애니메이션
└ .sheet-scroller
   └ .sheet-stage
      └ .sheet          모서리 애니메이션
         └ .sheet-content   --sheet 정의
```

기본 범위에서는 부모나 다른 가지의 요소가 이 타임라인을 찾을 수 없습니다. 공통 조상인 overlay에서 참조 범위를 넓힙니다.

```css
.sheet-overlay {
  timeline-scope: --sheet;
}
```

이제 overlay 안의 배경과 시트도 `.sheet-content`가 얼마나 들어왔는지 같은 타임라인으로 읽을 수 있습니다.

## 브라우저 지원 범위

여기까지의 효과에는 스크롤 스냅 외에도 `animation-timeline`, `animation-range`, `view-timeline-inset`, `timeline-scope`가 필요합니다. 2026년 11월 15일 확인한 호환성 자료에서 이 속성들을 함께 사용할 수 있는 시작 버전은 다음과 같습니다.

| 브라우저 | 시작 버전 |
| --- | --- |
| Chrome·Edge | 116 |
| Safari·iOS Safari | 26 |
| Firefox | 159 |

Chrome 계열에서는 `timeline-scope`가 116부터이고, 나머지 스크롤 타임라인 속성은 115부터입니다. 특히 Firefox는 2026년 10월 27일 출시된 159에서 지원을 시작해, 이 글을 쓰는 시점에는 추가된 지 한 달도 되지 않았습니다. `animation-timeline`의 지원 현황은 [Can I use](https://caniuse.com/?search=animation-timeline)에서 확인할 수 있습니다.

이 표는 호환성 자료의 지원 버전이며, 모든 브라우저에서 데모를 직접 검증했다는 뜻은 아닙니다. 아래 데모는 별도의 대체 애니메이션을 넣지 않았으므로 지원하지 않는 버전에서는 배경·모서리 효과가 스크롤을 따라가지 않을 수 있습니다.

## 직접 해 보기

장바구니를 열면 시트가 enter 마커의 열림 위치까지 올라옵니다. 시트를 천천히 내리면서 배경이 옅어지고 모서리가 둥글어지는 모습을 확인할 수 있습니다. 중간에 멈추거나 다시 올리면 효과도 그 위치를 따라갑니다.

모바일에서는 손가락으로, PC에서는 시트 위에서 휠이나 트랙패드로 움직입니다. 왼쪽 상태 패널에는 entry 진행률, 배경의 opacity, 모서리 반경이 표시됩니다.

```css live file=sheet.css view=preview height=720
/* 기본 scroller·stage·마커 배치 */
@import "./shared/viewport.css";

/* 시트 콘텐츠의 위치를 추적할 타임라인을 선언한다. */
.sheet-content {
  view-timeline-name: --sheet;
  view-timeline-axis: y;
  view-timeline-inset: 0 100dvh;
}

/* 배경과 시트가 콘텐츠의 타임라인을 참조할 수 있도록 범위를 넓힌다. */
.sheet-overlay { timeline-scope: --sheet; }

@keyframes backdrop-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes sheet-corner {
  from { border-radius: 48px 48px 0 0; }
  to   { border-radius: 12px 12px 0 0; }
}

.sheet-backdrop {
  opacity: 1;
  transition: none;
  animation: backdrop-fade linear both;
  animation-timeline: --sheet;
  animation-range: entry 0% entry 100%;
}
.sheet {
  animation: sheet-corner linear both;
  animation-timeline: --sheet;
  animation-range: entry 0% entry 100%;
}
```

```js live file=sheet.js
import {createSheet as createViewportSheet} from './shared/viewport-sheet.js';

export function createSheet(overlay) {
  return createViewportSheet(overlay, {
    // 배경의 진행률은 sheet.css의 스크롤 타임라인이 결정한다.
    useDataOpenTransition: false,
  });
}
```

```html live file=index.html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <link rel="icon" href="data:,">
  <title>배경과 함께 움직이는 시트</title>
  <!-- 겉모습 (확인용 스타일) -->
  <link rel="stylesheet" href="./ui.css">
  <!-- ★ 시트 동작 -->
  <link rel="stylesheet" href="./sheet.css">
  <script type="module" src="./main.js"></script>
  <!-- 확인용 도구 (확인용 스타일) -->
  <link rel="stylesheet" href="./shared/debug.css">
  <script type="module" src="./shared/debug.js"></script>
</head>
<body>
  <main class="page">
    <h1>배경과 함께 움직이는 시트</h1>
    <p class="lead">시트를 천천히 내리면 배경이 옅어지고 모서리가 둥글어집니다.</p>
    <aside class="input-guide" aria-label="조작 방법">
      <p>장바구니를 열고 시트를 위아래로 움직여 보세요. 모바일은 손가락으로, PC는 시트 위에서 휠이나 트랙패드로 움직입니다.</p>
    </aside>
    <button class="btn btn--primary" data-open-sheet="#sheet-0">장바구니 열기</button>

    <section class="filler" aria-hidden="true">
      <p>뒤쪽 페이지 콘텐츠입니다.</p>
      <div></div><div></div><div></div><div></div><div></div><div></div>
    </section>
  </main>

  <!-- 확인용: 시트 상태 패널 -->
  <aside class="hud hud--extended">
    <p class="panel-title">시트 상태</p>
    <div><span>state</span><b id="hud-state">closed</b></div>
    <div><span>scrollTop</span><b id="hud-scroll">-</b></div>
    <div><span>ratio</span><b id="hud-ratio">-</b></div>
    <div class="hud-sep"><span>progress</span><b id="hud-progress">-</b></div>
    <div><span>배경 opacity</span><b id="hud-backdrop">-</b></div>
    <div><span>모서리</span><b id="hud-radius">-</b></div>
    <div class="hud-sep"><span>viewport</span><b id="hud-vp">-</b></div>
  </aside>

  <!-- 확인용: 시트 구조 지도 (.sheet-scroller 안 콘텐츠 전체를 축소한 지도) -->
  <aside class="minimap">
    <p class="panel-title">시트 구조 지도 <small>.sheet-scroller 안 <span id="mm-which"></span></small></p>
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
        <li><i style="border:2px dashed #ff3b30"></i>scroller가 보는 구간</li>
        <li><i style="background:rgb(255 159 10 / .5)"></i>스냅 마커</li>
        <li><i style="border:1px solid #34c759"></i>stage</li>
        <li><i style="background:#a79cf5"></i>시트 콘텐츠</li>
      </ul>
    </div>
  </aside>

  <!-- 한 장의 시트: 콘텐츠의 타임라인을 배경과 모서리가 함께 참조한다. -->
  <div class="sheet-overlay" id="sheet-0" hidden>
    <div class="sheet-backdrop"></div>
    <div class="sheet-scroller">
      <div class="snap-marker snap-marker--exit"></div>
      <div class="sheet-stage">
        <div class="sheet overscroll-padding">
          <div class="sheet-content">
            <div class="grabber"></div>
            <header class="sheet-header">
              <h2>장바구니 (4)</h2>
              <button class="btn btn--icon" data-close aria-label="시트 닫기">✕</button>
            </header>
            <ul class="item-list cart">
              <li><span class="thumb" style="--c:#c9c2f5"></span><span>무선 이어폰<small>1개</small></span><b>129,000원</b></li>
              <li><span class="thumb" style="--c:#a8e0cc"></span><span>충전 케이블<small>2개</small></span><b>24,000원</b></li>
              <li><span class="thumb" style="--c:#f5c8b6"></span><span>휴대폰 케이스<small>1개</small></span><b>19,000원</b></li>
              <li><span class="thumb" style="--c:#b8d4f2"></span><span>보조배터리<small>1개</small></span><b>39,000원</b></li>
            </ul>
            <button class="btn btn--primary btn--block" data-close>닫기</button>
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
import {createSheet} from './sheet.js';

const sheet = createSheet(document.querySelector('.sheet-overlay'));
document.querySelector('[data-open-sheet]').addEventListener('click', () => sheet.open());
```

```css live file=ui.css hidden
/* ==========================================================================
   ui.css : 겉모습 전용. 실습 원리와 무관해요.
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


/* 콘텐츠 아래에 여유를 두어 열림 위치와 entry 끝 지점을 비교한다. */
#sheet-0 .sheet { min-height: calc(100dvh - 250px); }
.sheet-content p { color: var(--muted); }

.page { padding-top: calc(276px + env(safe-area-inset-top)); }
```

```css live file=shared/viewport.css hidden
/* ==========================================================================
   sheet.css : 실습 핵심
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


/* ② 스크롤 상자 ─ 200dvh. 스와이프의 정체 ───────────────────────────────── */
.sheet-scroller {
  position: absolute;
  /* 모든 브라우저에서 시트를 열 때 JS가 top을 window.scrollY로 바꿔 현재 화면에 맞춰요.
     예: 페이지를 500px 스크롤한 상태라면 top: 500px. */
  top: 0;
  left: 0;
  width: 100vw;
  height: 200dvh;                  /* 위 절반 = 화면, 아래 절반 = 화면 밖 */
  overflow-x: hidden;
  overflow-y: auto;                /* 콘텐츠가 상자보다 길어서 스크롤된다 */
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

/* 콘텐츠 맨 위. "내 윗변 = 상자 윗변"이 되는 scrollTop = 0 → 닫힘 */
.snap-marker--exit {
  top: 0;
  scroll-snap-align: start;
}

/* 콘텐츠 맨 아래. "내 아랫변 = 상자 아랫변"이 되는 scrollTop = (200 + 100) − 200 = 100dvh → 열림
   원래는 top: 200dvh.
   [iOS 대응] stage를 툴바 높이만큼 내렸으니(④) 이 마커도 같이 내려요. 열림 위치도 100dvh + 패딩이 돼요. */
.snap-marker--enter {
  top: calc(200dvh + var(--viewport-padding));
  scroll-snap-align: end;
}


/* ④ stage ─ 화면 크기 상자, 시트를 바닥에 붙인다 ───────────────────────────
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
  box-sizing: content-box; /* 최소 높이 바깥에 배경 연장분을 더한다. */
  padding-bottom: 100vh;   /* 배경을 화면 1칸만큼 아래로 늘리고 */
  margin-bottom: -100vh;   /* 배치에는 영향 없게 상쇄 */
}


/* 시트가 열려 있는 동안 뒤 페이지 스크롤 잠금 */
html.sheet-open {
  overflow: hidden;
}
```

```js live file=shared/viewport-sheet.js hidden
// 01 · 기본 배치, 열기·닫기, 사라짐 감지. 다른 단계도 이 함수를 재사용해요.
// main.js가 createSheet()를 호출해야 실행되므로, 다른 단계에서 import해도 중복 초기화되지 않아요.

import {getViewportPadding} from './sheet-geometry.js';

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
  let openingFrame = 0;
  let hasEntered = false;

  // 열림 위치 = enter 마커 아랫변이 scroller 아랫변에 닿는 scrollTop
  //          = (마커 top + 마커 높이) − scroller 높이
  function getFullyOpenScrollTop() {
    const marker = overlay.querySelector('.snap-marker--enter');
    return marker.offsetTop + marker.offsetHeight - scroller.clientHeight;
  }


  // ⑤ 열기 ─ 스크롤 자체가 애니메이션 ─────────────────────────────────────────
  function open() {
    if (!overlay.hidden) return;

    // [공통 배치] 모든 브라우저에서 overlay는 문서 기준 absolute다.
    // overlay에 페이지 전체 크기를 알려주고, scroller를 현재 화면 맨 위에 맞춘다.
    // 예: 페이지를 500px 스크롤했다면 scroller의 문서상 top도 500px로 둔다.
    overlay.style.setProperty('--page-width', `${document.documentElement.scrollWidth}px`);
    overlay.style.setProperty('--page-height', `${document.documentElement.scrollHeight}px`);
    scroller.style.top = `${window.scrollY}px`;

    options.beforeShow?.(elements);
    overlay.hidden = false;
    // 이전 닫기 스크롤이 남아 있어도 초기 위치에서 연다.
    scroller.scrollTo({top: 0, behavior: 'instant'});
    updatePageScrollLock();

    startCloseObserver();
    options.afterShow?.(elements);

    openingFrame = requestAnimationFrame(() => {
      openingFrame = 0;
      if (overlay.hidden) return;
      if (useDataOpenTransition) overlay.dataset.open = '';
      const top = options.getOpenScrollTop?.(elements) ?? getFullyOpenScrollTop();
      scroller.scrollTo({top, behavior: 'smooth'});
      options.afterScrollStart?.(elements);
    });
  }


  // ⑥ 닫힘 감지 ─ 시트가 뷰포트에서 완전히 사라지면 숨긴다 ─────────────────────
  function startCloseObserver() {
    // iOS Safari에서 툴바 뒤에 아직 보이는 콘텐츠를 닫혔다고 판단하지 않도록 범위를 늘린다.
    // 계산은 모든 브라우저에서 실행하며, 다른 브라우저에서는 0px이다.
    const paddingPx = getViewportPadding(scroller, stage);

    hasEntered = false;
    observer = new IntersectionObserver(
      ([entry]) => {
        // 막 열 때는 시트가 아직 뷰포트 밖이라 isIntersecting = false로 한 번 온다.
        // 한 번이라도 보인 뒤에 사라졌을 때만 닫는다.
        hasEntered ||= entry.isIntersecting;
        if (hasEntered && !entry.isIntersecting) {
          hide();
        }
      },
      {rootMargin: `0px 0px ${paddingPx}px 0px`}
    );

    // 아래로 연장한 배경을 제외하고 실제 콘텐츠의 닫힘을 감지한다.
    observer.observe(content);
  }


  // 닫기(✕) ─ 직접 숨기지 않고 0으로 스크롤만 한다 ──────────────────────────
  // 그러면 스와이프로 닫을 때와 똑같이 ⑥이 "사라졌다"를 감지해서 hide()가 불린다.
  function close() {
    if (overlay.hidden) return;
    cancelAnimationFrame(openingFrame);
    openingFrame = 0;
    options.beforeClose?.(elements);
    // 열기 직후 아직 보이지 않았다면 내려갈 시트도 없으므로 바로 숨긴다.
    if (!hasEntered) {
      hide();
      return;
    }
    // 닫기 버튼을 누른 순간부터 배경의 CSS transition: opacity 0.3s를 시작하도록 data-open을 지운다.
    // hide()까지 기다리면 배경은 계속 어둡다가 overlay 전체와 함께 한 번에 숨겨진다.
    if (useDataOpenTransition) delete overlay.dataset.open;
    scroller.scrollTo({top: 0, behavior: 'smooth'});
  }

  function hide() {
    cancelAnimationFrame(openingFrame);
    openingFrame = 0;
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

```css live file=shared/debug.css hidden
/* ==========================================================================
   debug.css : 확인용 도구. 실습 원리와 무관해요.
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

.hud { font-size: 10px; line-height: 1.4; }
@media (max-width: 420px) { .mm-legend { display: none; } }
```

```js live file=shared/debug.js hidden
// ==========================================================================
// debug.js : 확인용 도구. 실습 원리와 무관해요. (01 ~ 07 단계 공통)
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

## 다음에는 여러 시트를 겹쳐 열기

한 장의 시트에서 배경과 모서리를 스크롤 위치에 연결했습니다. 다음 글은 시리즈 5편 [여러 시트를 겹쳐 열고 뒤 시트를 밀어내기](../css-bottom-sheet-5-stacked-sheets/)입니다. 장바구니 위에 쿠폰 선택 시트를 여는 동작을 만들고, 앞 시트의 타임라인으로 뒤 시트의 크기와 위치를 바꾸겠습니다.
