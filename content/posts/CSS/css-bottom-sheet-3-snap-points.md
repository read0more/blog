---
title: "CSS로 만드는 네이티브 같은 바텀시트 3편: 지도 앱처럼 중간에 멈추고, 스와이프로는 닫히지 않게"
date: "2026-11-12T06:57:11.000Z"
description: "시트 안에 1px 마커를 넣어 180px과 55% 위치에 멈추게 합니다. 부분 열림과 내부 목록 스크롤을 구분하고, stage 위치와 scrollTop을 함께 바꿔 가장 작은 스냅 위치 아래로 내려가지 못하게 만듭니다."
tags: ["CSS"]
---

> **시리즈 목차**
>
> 1. [터치 이벤트 없이 스크롤 스냅으로 여닫기](../css-bottom-sheet-1-scroll-snap/)
> 2. [iOS Safari 툴바 뒤에서 시트가 덜 사라질 때](../css-bottom-sheet-2-ios-safari/)
> 3. 지도 앱처럼 중간에 멈추고, 스와이프로는 닫히지 않게 (이 글)
> 4. 손가락을 따라오는 backdrop과 뒤로 밀리는 시트 (준비 중)
> 5. 키보드가 시트를 가릴 때 (준비 중)
> 6. 키보드 애니메이션에 시트를 맞추기 (준비 중)

지도 앱에서 주변 맛집을 찾을 때는 목록을 조금만 열어 두고 지도를 보다가, 더 궁금해지면 목록을 끝까지 올려 봅니다. 이때는 닫힘과 완전 열림 사이에도 멈출 자리가 필요합니다.

이번에는 180px만 보이는 위치와 시트 높이의 55%가 보이는 위치를 추가하려고 합니다. 이어서 가장 작은 스냅 위치 아래로는 내려가지 않도록 제한하겠습니다. 목록을 끌어내려도 시트가 남아 있고, 닫기 버튼을 눌렀을 때만 완전히 사라지는 동작입니다.

![180px과 55% 마커가 각각 화면 아랫변에 놓였을 때의 모습입니다.](/css-bottom-sheet-3-snap-points/sheet-snap-point-structure.svg)

## 시트 안에 중간 마커를 넣는다

1편에서는 scroller 안의 exit 마커와 enter 마커가 닫힘·열림 위치를 정했습니다. 중간 위치를 만드는 마커는 시트 안에 넣습니다. 시트와 함께 움직이면서, 어느 정도 보였을 때 멈출지 표시하는 역할입니다.

```html
<div class="sheet">
  <div class="snap-points">
    <div class="snap-point" style="top: 180px" data-initial></div>
    <div class="snap-point" style="top: 55%"></div>
  </div>
  <div class="sheet-content">
    <!-- 시트의 제목과 목록 -->
  </div>
</div>
```

`top: 180px`는 시트 윗변에서 180px 아래에 마커를 놓습니다. `55%`의 기준은 뷰포트가 아니라 시트 높이입니다. `data-initial`은 처음 열 때 사용할 마커에 붙인 표시입니다. 아래 데모에서는 가장 작은 위치인 180px 마커에 붙입니다.

```css
.sheet {
  position: relative;
}

.snap-points {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.snap-point {
  position: absolute;
  left: 0;
  width: 1px;
  height: 1px;
  scroll-snap-align: start;
  scroll-margin-top: 100dvh;
}
```

마커는 절대 위치로 놓인 1px 요소라 시트 내용의 배치를 밀지 않습니다. 완전히 펼치는 위치는 기존 enter 마커가 맡습니다.

`scroll-margin-top`의 역할은 시트와 마커를 고정하고, scroller가 보는 구간을 옮겨 보면 이해하기 쉽습니다. 아래 데모에서 180px만 보이는 자리와, scroller 윗변을 마커에 맞춘 자리를 비교해 봅니다.

<iframe src="../../css-bottom-sheet-3-snap-points/snap-window-demo.html" title="내용을 고정하고 scroller가 보는 구간을 옮기는 데모" loading="lazy" style="display:block;width:100%;height:1000px;border:0;margin:24px 0;"></iframe>

**180px만 보이려면 화면 아랫변이 마커에 와야 합니다.** `scroll-margin-top: 100dvh`는 스냅 영역을 마커보다 화면 한 높이만큼 위로 넓혀, 그 장면을 `start` 정렬의 스냅 위치로 만듭니다. [CSS Scroll Snap의 scroll-margin 정의](https://www.w3.org/TR/css-scroll-snap-1/#scroll-margin)

`overscrollPadding`을 켰을 때는 연장한 시트 배경색이 55%의 기준 높이에 들어가지 않도록 `.snap-points`의 아래쪽을 줄여 줍니다.

```css
.sheet.overscroll-padding .snap-points {
  bottom: 100vh;
}
```

## 처음에는 180px만 연다

CSS로 중간 스냅 위치를 만들었으면, 열기 JS의 목적지도 기존 enter에서 `data-initial` 마커로 바꿉니다. 아래 계산은 scroller가 화면 윗변에 있고 `scrollTop`이 0인 열기 직전에 사용합니다.

```js
function getSnapPointScrollTop(marker) {
  return marker.getBoundingClientRect().top
    - parseFloat(getComputedStyle(marker).scrollMarginTop);
}

const marker = overlay.querySelector('.snap-point[data-initial]');
const top = getSnapPointScrollTop(marker);
scroller.scrollTo({top, behavior: 'smooth'});
```

예를 들어 화면이 800px이고 시트가 744px이면, 다 펼쳤을 때 화면 맨 위에 붙지 않도록 56px의 여백을 남깁니다. 닫힌 시트가 화면에 들어오려면 먼저 그 56px을 올라와야 하므로, **180px을 보여 주기 위한 스크롤은 `56 + 180 = 236px`입니다.** iOS 보정값은 0px으로 가정했습니다.

![위쪽 여백 56px을 지나온 뒤 180px을 더 올리면, 총 스크롤은 236px입니다.](/css-bottom-sheet-3-snap-points/opening-distance-236.svg)

코드는 마커의 실제 위치에서 CSS의 scroll margin을 빼 이 값을 구합니다. 이후 손으로 움직일 때는 브라우저가 CSS 스냅 위치에 맞춰 멈춥니다.

## 시트를 펼칠 때와 목록을 넘길 때

중간 높이에서 목록을 위로 밀었는데, 시트는 그대로이고 안쪽 목록만 스크롤되면 의도와 다릅니다. 먼저 시트를 펼치고, 충분히 펼쳐진 뒤에는 목록을 스크롤할 수 있어야 합니다.

```css
.sheet-content {
  overflow: hidden;
  overscroll-behavior: auto;
}

.sheet[data-expanded] .sheet-content {
  overflow-y: auto;
}
```

부분 열림에서는 바깥 scroller가 움직이도록 내부 스크롤을 막고, 콘텐츠 영역 전체가 보이면 `data-expanded`를 붙여 안쪽 스크롤을 허용합니다.

```js
const paddingPx = stage.offsetTop - scroller.clientHeight / 2;

const expandObserver = new IntersectionObserver(
  ([entry]) => {
    sheet.toggleAttribute('data-expanded', entry.intersectionRatio >= 1);
  },
  {threshold: 1, rootMargin: `0px 0px ${paddingPx}px 0px`}
);

expandObserver.observe(content);
```

관찰하는 것은 긴 목록의 모든 항목이 아니라 `.sheet-content` 상자의 경계입니다. iOS에서는 2편처럼 관찰 범위에 하단 보정값도 포함합니다.

목록이 맨 위에 도착한 뒤에도 계속 아래로 끌면 시트가 내려와야 합니다. `overscroll-behavior: auto`는 안쪽에서 더 처리할 수 없는 스크롤을 바깥으로 넘기는 기본 동작을 허용합니다. 이 연결을 스크롤 체이닝이라고 부릅니다. 바깥 scroller의 `overscroll-behavior-y: contain`은 그 스크롤이 다시 뒤 페이지까지 넘어가는 것을 막습니다. [CSS Overscroll Behavior 표준](https://www.w3.org/TR/css-overscroll-1/#overscroll-behavior-properties)

## scrollTop이 0이어도 시트를 남긴다

이제 중간에 멈출 수 있습니다. 다음은 시트를 아래로 끌어도 완전히 닫히지 않게 하는 경우입니다.

exit 마커의 스냅을 꺼도 시트를 내려 보낼 공간은 남습니다. 아래로 내려도 180px을 남기려면, 그 위치를 새로운 `scrollTop = 0`으로 만들어 더 내릴 범위 자체를 없애야 합니다.

앞의 숫자를 이어 쓰겠습니다. 시트 높이는 744px이고, 가장 작게 열었을 때 남길 높이는 180px입니다. 둘의 차이인 `744 - 180 = 564px`을 stage의 새 `top`으로 사용합니다.

```css
.sheet-overlay[data-clamped] .sheet-stage {
  top: var(--clamped-travel);
}

.sheet-overlay[data-clamped] .snap-marker--exit {
  scroll-snap-align: none;
}

.sheet-overlay[data-clamped] .snap-marker--enter {
  top: calc(var(--clamped-travel) + 100dvh);
}
```

첫 스냅 위치까지 연 뒤 stage의 `top`을 800px에서 564px로 바꿉니다. 이때 `scrollTop`도 236px에서 0으로 바꾸면 두 이동이 상쇄되어, 시트는 같은 자리에 180px 보입니다. `--clamped-travel`은 stage에 새로 지정할 `top` 값입니다.

![stage의 top과 scrollTop을 함께 바꾸면, 같은 180px 열림이 새 스크롤 시작점이 됩니다.](/css-bottom-sheet-3-snap-points/dismissal-constraint.svg)

이제 0에서도 시트가 180px 남습니다. 완전히 숨기려면 음수 `scrollTop`이 필요하므로 정상 스크롤 범위로는 닫을 수 없습니다. 탄성 스크롤이 있는 브라우저에서는 잠깐 당겨졌다가 돌아올 수 있습니다.

enter도 새 stage의 끝으로 옮겨 최대 `scrollTop`을 800px에서 564px로 줄입니다. 이렇게 하면 가장 작은 열림부터 완전 열림까지의 범위만 남습니다.

## 스냅 마커를 읽어 이동 범위를 구한다

시트 높이나 마커 위치를 바꿀 때마다 564px을 직접 고칠 수는 없습니다. 마커가 stage의 끝에서 얼마나 떨어져 있는지 읽어 같은 값을 구합니다.

```js
function getSnapPointTravel() {
  const stageRect = stage.getBoundingClientRect();
  let travel = 0;

  for (const marker of overlay.querySelectorAll('.snap-point')) {
    const offset = marker.getBoundingClientRect().top - stageRect.top;
    travel = Math.max(travel, stageRect.height - offset);
  }

  return Math.max(1, travel);
}

function applyDismissalConstraint() {
  overlay.style.setProperty('--clamped-travel', `${getSnapPointTravel()}px`);
  overlay.dataset.clamped = '';
  scroller.scrollTop = 0;
}
```

위 예에서는 마커의 stage 기준 위치가 236px이므로 `800 - 236 = 564px`이 됩니다. 마커마다 계산한 값 중 가장 큰 값을 쓰면 가장 작게 열리는 위치를 기준으로 제한할 수 있습니다.

`Math.max(1, travel)`은 이동 범위를 최소 1px 남깁니다. 스냅 마커를 하나만 두고 시트 맨 아래에 놓으면 계산 결과가 0이 될 수 있습니다. 이때도 스크롤 범위를 조금 남겨 끝을 당기는 동작을 받을 수 있게 합니다. 탄성 효과가 실제로 보이는지는 브라우저에 따라 다릅니다.

배치 제한은 첫 180px 위치로 여는 스크롤이 끝난 뒤 적용합니다. `scrollend`를 기다리는 중에 닫기 버튼을 눌렀다면 대기를 취소합니다.

<details>
<summary>스크롤 종료를 기다리는 코드</summary>

```js
function waitForScrollEnd(signal) {
  return new Promise(resolve => {
    let timer;
    const finish = () => {
      clearTimeout(timer);
      scroller.removeEventListener('scrollend', finish);
      signal.removeEventListener('abort', finish);
      resolve(!signal.aborted);
    };

    scroller.addEventListener('scrollend', finish, {once: true});
    signal.addEventListener('abort', finish, {once: true});
    timer = setTimeout(finish, 800);
    if (signal.aborted) finish();
  });
}
```

800ms는 `scrollend`를 받지 못했을 때의 대기 상한입니다. 시간이 지났다고 스크롤이 반드시 끝난 것은 아닙니다. 닫거나 다시 열 때는 `AbortController`로 이전 대기를 취소합니다. iOS 하단 보정값은 stage를 옮기기 전에 읽어 observer에 넣습니다.

</details>

## 닫기 버튼은 배치를 되돌린다

아래로 끌어서 닫는 동작을 막았어도, 닫기 버튼은 동작해야 합니다. 버튼을 누르면 제한 전 배치로 돌아가면서 현재 보이는 위치를 유지한 다음, 원래의 닫힘 위치로 스크롤합니다.

```js
function removeDismissalConstraint() {
  overlay.dataset.transitioning = '';

  const fromStage = scroller.scrollTop - stage.offsetTop;
  delete overlay.dataset.clamped;
  scroller.scrollTop = fromStage + stage.offsetTop;
}
```

가장 작은 위치에서는 `0 - 564 + 800 = 236px`로 복원됩니다. 보이는 위치를 유지한 채 원래 배치로 돌아온 뒤, 1편의 닫기 동작으로 `scrollTop = 0`까지 내려 보냅니다.

스냅 위치 사이를 움직이다가 닫기 버튼을 누를 수도 있습니다. 그때 배치만 되돌리면 브라우저가 가까운 스냅 위치로 다시 붙이려 할 수 있으므로, 복원하기 전에 스냅을 잠시 끕니다.

```css
.sheet-overlay[data-transitioning] .sheet-scroller {
  scroll-snap-type: none;
}
```

시트가 사라지면 제한과 펼침 상태를 지우고 목록도 맨 위로 돌립니다. 다음에 열 때 다시 180px만 보이는 위치에서 시작합니다.

## 직접 해 보기

아래 데모는 중간 스냅 위치와 닫힘 제한을 함께 넣은 시트입니다. `preventDismissal`을 끄면 아래로 내려 닫을 수 있고, 켜면 가장 작은 위치에서 멈춥니다. 옵션은 열 때 읽으므로 바꾼 뒤에는 닫았다가 다시 열어야 합니다. 완전히 닫을 때는 시트의 ✕ 버튼을 누르면 됩니다.

모바일에서는 손가락으로, PC에서는 시트 위에서 휠이나 트랙패드로 움직입니다. 처음에는 180px만 열리고, 더 올리면 시트 높이의 55%가 보이는 위치나 완전히 펼친 위치에 멈춥니다. 중간에서는 시트가 움직이고, 펼쳐진 뒤에는 안쪽 목록을 스크롤할 수 있습니다.

```css live file=sheet.css view=preview height=720
/* 중간 스냅 위치와 스와이프로 닫기 방지 */
@import "./shared/viewport.css";

/* [중간 스냅] ⑧ 스냅 포인트 ─ 시트 안에 넣는 1px 마커 ────────────────────────
   마커는 시트와 같이 움직인다. 마커 위치(top)가 곧 "시트가 이만큼 보이면 멈춰라"는 값이다.
   HTML에서 <div class="snap-point" style="top: 180px"> 처럼 위치를 준다.
   숫자 px는 그대로, %는 시트 높이 기준 (원본 snapPoints={[180, '55%']}와 같은 뜻). */
.sheet {
  position: relative;            /* 마커 위치의 기준 */
}
.snap-points {
  position: absolute;
  inset: 0;                     /* .sheet와 같은 크기로 만들어 자식 마커의 top: 55% 기준을 제공한다. */
  pointer-events: none;          /* 보이지 않는 마커 상자가 시트 안 버튼·터치를 가로채지 않게 한다. */
}
.sheet.overscroll-padding .snap-points {
  bottom: 100vh;                 /* ⑦로 늘어난 배경 말고, 실제 시트 높이를 % 기준으로 */
}
.snap-point {
  position: absolute;
  left: 0;
  width: 1px;
  height: 1px;
  scroll-snap-align: start;
  /* 실제 빈 공간을 추가하지 않고, 스냅할 때의 정렬 기준만 바꾼다.
     0이면 마커 자체를 scroller 윗변에 맞춘다.
     100dvh면 마커보다 뷰포트 한 칸 위의 가상 기준선을 scroller 윗변에 맞춘다.
     따라서 실제 마커는 뷰포트 아래에 놓이고, 시트 윗변부터 마커까지(top: 180px면 180px)만 보인다. */
  scroll-margin-top: 100dvh;
}


/* [중간 스냅] ⑨ 부분만 열렸을 때: 안쪽 목록(.sheet-content)의 사용자 스크롤은 막고,
   바깥 시트(.sheet-scroller)의 스크롤은 허용한다.
   따라서 목록 위에서 위로 밀면 목록만 넘어가는 대신, 시트 전체가 올라와 더 많이 보인다.
   완전히 펼쳐지면 JS가 .sheet에 data-expanded를 붙여 안쪽 목록 스크롤도 허용한다. */
.sheet-content {
  overflow: hidden;
  /* 기본값이지만 일부러 적었다: 안쪽 목록이 맨 위일 때 더 내리면
     남은 스크롤이 바깥(.sheet-scroller)으로 넘어가서(스크롤 체이닝) 시트가 내려간다. */
  overscroll-behavior: auto;
}
.sheet[data-expanded] .sheet-content {
  overflow-y: auto;
}



/* [닫기 방지] ⑪ 끝까지 내려도 시트가 180px 남도록 배치 바꾸기 ──────────────────────
   여기의 top은 stage의 배치 위치다. 스크롤 위치(scrollTop)와는 별개다.
   원래 top은 100dvh + 툴바 보정값이고, JS가 data-clamped를 붙이면 아래 값으로 바뀐다.

   예: 뷰포트 높이 800px, 툴바 보정 0px일 때
   - JS가 넣는 --clamped-travel은 564px이다. (시트 높이 744px − 처음 보일 높이 180px)
   - top: 800px → 564px이 되어 stage가 236px 위로 옮겨진다. 564px은 옮길 거리가 아니라 새 top 값이다.
   - JS는 동시에 scrollTop을 236 → 0으로 되돌린다. 두 변화가 상쇄되어 뷰포트 기준 시트 위치는 그대로다.

   이제 scrollTop이 0이어도 시트가 180px 보인다. 0은 정상 스크롤 범위의 시작이므로,
   시트를 더 내리는 방향으로는 남은 스크롤 범위가 없다.
   탄성 스크롤을 지원하는 브라우저에서는 이 끝을 넘어 당기면 잠깐 밀렸다가 원래 위치로 돌아오는 효과만 보인다. */
.sheet-overlay[data-clamped] .sheet-stage {
  top: var(--clamped-travel);
}
.sheet-overlay[data-clamped] .snap-marker--exit {
  scroll-snap-align: none;                             /* 닫힘 위치는 이제 갈 수 없으니 자석 끄기 */
}
.sheet-overlay[data-clamped] .snap-marker--enter {
  /* 끝 마커를 예전 위치에 두면, 펼칠 때 필요한 것보다 더 스크롤되어
     시트 윗부분이 뷰포트 밖으로 잘리고 아래에는 빈 공간이 생긴다.
     완전히 펼친 시트의 아랫변이 뷰포트 아래에 맞도록 끝 마커도 함께 옮긴다. */
  top: calc(var(--clamped-travel) + 100dvh);
}

/* [닫기 방지] sheet.js가 data-transitioning을 붙이면 기본 scroll-snap-type: y mandatory를 잠시 끈다.
   움직이는 도중 닫기 버튼을 누르면, 원래 배치로 되돌리며 보정한 scrollTop이 스냅 포인트 사이일 수 있다.
   그 위치가 가까운 스냅 포인트로 다시 정렬되어 시트가 튀지 않도록 끈다.
   현재 위치에서 닫힘 위치까지 스크롤하고, 숨긴 뒤 속성을 지운다. */
.sheet-overlay[data-transitioning] .sheet-scroller {
  scroll-snap-type: none;
}
```

```js live file=sheet.js
// 첫 스냅 위치로 열기와 완전히 펼쳐짐 감지.
import {createSheet as createViewportSheet} from './shared/viewport-sheet.js';

import {getViewportPadding} from './shared/sheet-geometry.js';

// 열기 스크롤을 시작하기 전에만 호출한다. 이때 scroller의 뷰포트 기준 top과 scrollTop은 0이다.
// 마커의 뷰포트 기준 top에서 scroll-margin-top(100dvh)을 빼면, 마커를 뷰포트 아래에 맞출 scrollTop이 된다.
// 예: 마커 1036px − 뷰포트 높이 800px = 목표 scrollTop 236. 실제 스크롤은 기본 open()이 한다.
function getSnapPointScrollTop(marker) {
  return marker.getBoundingClientRect().top - parseFloat(getComputedStyle(marker).scrollMarginTop);
}

// 중간 스냅 위치와 펼쳐짐 감지·정리를 묶는다. 아래 createSheet()에서 이 설정을 사용한다.
export function createSnapPointOptions(overlay) {
  let expandObserver;

  return {
    // [중간 스냅] 끝까지가 아니라 data-initial이 붙은 스냅 포인트까지만 올린다.
    getOpenScrollTop() {
      return getSnapPointScrollTop(overlay.querySelector('.snap-point[data-initial]'));
    },
    afterShow(elements) {
      const {scroller, stage, sheet, content} = elements;
      // [중간 스냅] ⑩ 중간 높이에서 목록이 먼저 스크롤되지 않도록, 완전히 펼쳐진 뒤에만 내부 스크롤을 허용한다.
      const paddingPx = getViewportPadding(scroller, stage);
      expandObserver = new IntersectionObserver(
        // 시트가 완전히 보이면 내부 스크롤을 활성화. .sheet-content 상자 전체가 보이면 data-expanded를 붙여 sheet.css의 overflow-y: auto를 켠다.
        ([entry]) => sheet.toggleAttribute('data-expanded', entry.intersectionRatio >= 1),
        // 기본 닫힘 감지와 같은 범위를 쓴다. iOS Safari 외에는 추가 범위가 0px이다.
        {threshold: 1, rootMargin: `0px 0px ${paddingPx}px 0px`}
      );
      expandObserver.observe(content);
    },
    beforeHide(elements) {
      expandObserver.disconnect(); // 숨긴 동안 감지하지 않고, 다음 open()에서 새 observer를 만든다.
      elements.sheet.removeAttribute('data-expanded');
      elements.content.scrollTop = 0; // 내부 목록 스크롤을 처음으로 되돌린다.
    },
  };
}


// 스와이프로 닫히지 않도록 배치를 제한한다.

export function createSheet(overlay) {
  const scroller = overlay.querySelector('.sheet-scroller');
  const stage = overlay.querySelector('.sheet-stage');
  const snapPointOptions = createSnapPointOptions(overlay);
  let preventDismissal = false;
  let openingController;

  // [닫기 방지] 열기 스크롤 도중 stage를 옮기면 애니메이션이 튈 수 있어, scrollend 뒤에 배치를 바꾼다.
  // scrollend가 없거나 발생하지 않을 때도 진행하도록 최대 800ms만 기다린다.
  // 닫기·다시 열기로 세션이 끝나면 이벤트와 타이머를 정리한다.
  // 800ms는 예제의 대기 상한이며, 실제 스크롤 종료를 보장하는 시간이 아니다.
  function waitForScrollEnd(signal) {
    return new Promise(resolve => {
      let timer;
      const finish = () => {
        clearTimeout(timer);
        scroller.removeEventListener('scrollend', finish);
        signal.removeEventListener('abort', finish);
        resolve(!signal.aborted);
      };
      scroller.addEventListener('scrollend', finish, {once: true});
      signal.addEventListener('abort', finish, {once: true});
      timer = setTimeout(finish, 800);
      if (signal.aborted) finish();
    });
  }


  // [닫기 방지] ⑫ 가장 작은 스냅 포인트에서 완전히 열릴 때까지의 거리 ──────────────────
  // 각 마커가 stage 아래쪽 끝에서 얼마나 떨어져 있는지 재서 가장 큰 값을 쓴다.
  // = 시트가 가장 조금 보일 때와 다 보일 때의 차이.
  function getSnapPointTravel() {
    const stageRect = stage.getBoundingClientRect();
    let travel = 0;
    for (const marker of overlay.querySelectorAll('.snap-point')) {
      const offset = marker.getBoundingClientRect().top - stageRect.top;
      travel = Math.max(travel, stageRect.height - offset);
    }
    // 시트 맨 아래(top: 100%)에 스냅 포인트 하나만 있으면 travel이 0이 된다.
    // 이때도 끝을 당기는 탄성 효과가 가능하도록 스크롤 범위를 최소 1px 남긴다. (효과 지원 여부는 브라우저에 따라 다름)
    return Math.max(1, travel);
  }

  // [닫기 방지] ⑬ 닫을 수 없는 배치로 바꾸기 / 되돌리기 ─────────────────────────────────
  // 가장 작은 스냅 포인트까지 연 뒤, data-clamped로 stage를 위로 옮긴다.
  // scrollTop도 0으로 바꾸면 180px 보이는 위치를 유지하면서, 그 위치가 새 스크롤 시작점이 된다.
  function applyDismissalConstraint() {
    overlay.style.setProperty('--clamped-travel', `${getSnapPointTravel()}px`);
    overlay.dataset.clamped = '';
    scroller.scrollTop = 0;
  }

  function removeDismissalConstraint() {
    // 시트가 스냅 위치로 이동하는 중에 ✕ 버튼을 누르면, 현재 스크롤 위치가 두 스냅 포인트 사이일 수 있다.
    // 원래 배치로 되돌리며 scrollTop을 보정할 때, 가까운 스냅 포인트로 다시 붙어 튀지 않도록 먼저 스냅을 끈다.
    overlay.dataset.transitioning = '';
    const fromStage = scroller.scrollTop - stage.offsetTop;
    delete overlay.dataset.clamped;
    // 아직 시트가 보이므로, 갑자기 사라지지 않고 부드럽게 내려가며 닫히도록 현재 위치를 유지한다.
    // 이 함수에서 data-clamped를 지우기 직전에 계산한 fromStage에,
    // 지운 직후의 stage의 top을 더한다. 두 이동이 상쇄되어 사용자 눈에는 시트가 그대로 보인다.
    // 예: 0 - 564 + 800 = 236. stage가 236px 내려가고 스크롤로 236px 올라가므로, 뷰포트 기준 위치는 같다.
    // 이후 close()가 그 자리에서 0까지 부드럽게 스크롤해 닫는다.
    scroller.scrollTop = fromStage + stage.offsetTop;
  }


  return createViewportSheet(overlay, {
    ...snapPointOptions, // 중간 스냅에서 쓰는 첫 스냅 위치와 펼쳐짐 감지를 그대로 사용한다.
    beforeShow() {
      openingController?.abort();
      openingController = new AbortController();
      preventDismissal = document.querySelector('#opt-prevent').checked;
    },
    afterScrollStart() {
      // 첫 스냅 포인트까지 여는 스크롤이 끝나면 닫기 방지 배치로 바꾼다.
      // 시트가 완전히 펼쳐질 때까지 기다리는 것은 아니다.
      if (!preventDismissal) return;
      const controller = openingController;
      waitForScrollEnd(controller.signal).then(completed => {
        if (completed && !controller.signal.aborted && controller === openingController && !overlay.hidden) {
          applyDismissalConstraint();
        }
      });
    },
    beforeClose() {
      openingController?.abort();
      if (overlay.dataset.clamped !== undefined) removeDismissalConstraint();
    },
    beforeHide(elements) {
      openingController?.abort();
      // 이 함수가 위에서 가져온 beforeHide를 덮어쓰므로, 중간 스냅의 정리를 먼저 실행한다.
      snapPointOptions.beforeHide(elements);
      // 닫기 방지에서 추가한 배치 제한과 스냅 해제 상태도 지운다.
      delete overlay.dataset.clamped;
      delete overlay.dataset.transitioning;
    },
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
  <title>중간에 멈추는 시트</title>
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
    <h1>중간에 멈추는 시트</h1>
    <p class="lead">180px와 시트 높이의 55%에 스냅 위치를 둡니다. 아래 옵션으로 스와이프로 닫을 수 있는지도 바꿉니다.</p>

    <aside class="input-guide" aria-label="조작 방법">
      <p>모바일에서는 손가락으로, PC에서는 시트 위에서 휠이나 트랙패드로 움직입니다. 완전히 닫으려면 ✕ 버튼을 누릅니다.</p>
    </aside>

    <button class="btn btn--primary" id="open-sheet">주변 맛집 열기</button>

    <label class="option">
      <input type="checkbox" id="opt-prevent" checked>
      <span><code>preventDismissal</code> 켜기<small>켜면 가장 작은 스냅 위치까지만 내려갑니다. 변경 후 다시 열면 적용됩니다.</small></span>
    </label>
    <label class="option">
      <input type="checkbox" id="opt-overscroll">
      <span><code>overscrollPadding</code> 켜기<small>시트 배경색을 아래로 연장합니다. 변경 후 다시 열면 적용됩니다.</small></span>
    </label>

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
    <div><span>expanded</span><b id="hud-expanded">-</b></div>
    <div><span>clamped</span><b id="hud-clamped">-</b></div>
    <div><span>snap</span><b id="hud-snap">-</b></div>
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
        <li><i style="border-top:2px solid #ff6fb5;height:0"></i>스냅 포인트</li>
      </ul>
    </div>
  </aside>

  <!--
    시트 DOM 구조

    .sheet-overlay                data-clamped / data-transitioning  [닫기 방지]
    ├ .sheet-backdrop
    └ .sheet-scroller
       ├ .snap-marker--exit       → scrollTop 0 (닫힘). 고정되면 자석 꺼짐  [닫기 방지]
       ├ .sheet-stage             고정되면 top: --clamped-travel 로 당겨짐  [닫기 방지]
       │  └ .sheet                  data-expanded  [중간 스냅]
       │     ├ .snap-points             [중간 스냅] 스냅 포인트 마커들 (시트와 같이 움직임)
       │     │  ├ .snap-point  top: 180px   → 시트가 180px 보이면 멈춤 (처음 열릴 때 여기까지)
       │     │  └ .snap-point  top: 55%     → 시트가 55% 보이면 멈춤
       │     └ .sheet-content       부분만 열렸을 땐 overflow: hidden  [중간 스냅]
       └ .snap-marker--enter      → 완전히 열림
  -->
  <div class="sheet-overlay" hidden>
    <div class="sheet-backdrop"></div>

    <div class="sheet-scroller">
      <div class="snap-marker snap-marker--exit"></div>

      <div class="sheet-stage">
        <div class="sheet">
          <!-- [중간 스냅] 스냅 포인트: top = 시트가 이만큼 보이면 멈춰라 -->
          <div class="snap-points">
            <div class="snap-point" style="top: 180px" data-initial></div>
            <div class="snap-point" style="top: 55%"></div>
          </div>

          <div class="sheet-content">
            <div class="sheet-top">
              <div class="grabber"></div>
              <header class="sheet-header">
                <h2>주변 맛집 (16)</h2>
                <button class="btn btn--icon" data-close>✕</button>
              </header>
            </div>
            <ul class="item-list place-list">
                <li><span class="thumb" style="--c:#f5c8b6"></span><span>성수 브런치 카페<small>카페 · 350m</small></span></li>
                <li><span class="thumb" style="--c:#a8e0cc"></span><span>을지로 노포 국밥<small>한식 · 600m</small></span></li>
                <li><span class="thumb" style="--c:#c9c2f5"></span><span>연남 수제버거<small>양식 · 800m</small></span></li>
                <li><span class="thumb" style="--c:#b8d4f2"></span><span>망원 칼국수<small>한식 · 1.1km</small></span></li>
                <li><span class="thumb" style="--c:#f3e1a9"></span><span>한남 베이커리<small>베이커리 · 1.3km</small></span></li>
                <li><span class="thumb" style="--c:#f5c8b6"></span><span>이태원 타코<small>멕시칸 · 1.4km</small></span></li>
                <li><span class="thumb" style="--c:#a8e0cc"></span><span>합정 라멘<small>일식 · 1.6km</small></span></li>
                <li><span class="thumb" style="--c:#c9c2f5"></span><span>서촌 한옥 찻집<small>카페 · 1.8km</small></span></li>
                <li><span class="thumb" style="--c:#b8d4f2"></span><span>익선동 파스타<small>양식 · 2.0km</small></span></li>
                <li><span class="thumb" style="--c:#f3e1a9"></span><span>광장시장 빈대떡<small>한식 · 2.2km</small></span></li>
                <li><span class="thumb" style="--c:#f5c8b6"></span><span>삼청동 수제비<small>한식 · 2.5km</small></span></li>
                <li><span class="thumb" style="--c:#a8e0cc"></span><span>문래 화덕피자<small>양식 · 2.7km</small></span></li>
                <li><span class="thumb" style="--c:#c9c2f5"></span><span>신당 떡볶이<small>분식 · 3.0km</small></span></li>
                <li><span class="thumb" style="--c:#b8d4f2"></span><span>용산 쌀국수<small>베트남 · 3.2km</small></span></li>
                <li><span class="thumb" style="--c:#f3e1a9"></span><span>북촌 젤라또<small>디저트 · 3.5km</small></span></li>
                <li><span class="thumb" style="--c:#f5c8b6"></span><span>성북 돈가스<small>일식 · 3.8km</small></span></li>
            </ul>
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


/* [중간 스냅] 01은 내용만큼 높아지지만, 02는 긴 목록을 시트 안에서 스크롤해야 한다.
   그래서 시트 높이를 제한한다. 56px은 완전히 열렸을 때 뷰포트 위에 남기는 여백으로,
   이 예제의 디자인 값이며 스냅 기능에 반드시 필요한 숫자는 아니다. */
.sheet {
  /* 01의 border-box를 바꿔, 아래 height는 콘텐츠 높이로 유지한다.
     overscrollPadding의 padding-bottom은 이 높이 바깥에 더해져야 한다.
     border-box면 패딩이 고정 높이 안을 차지해 목록 공간이 줄어든다. */
  box-sizing: content-box;
  height: calc(100dvh - 56px);
  overflow: clip;                 /* 스크롤되는 내용과 헤더 배경을 시트의 둥근 모서리 안으로 자른다. */
}
/* [중간 스냅] 콘텐츠 상자도 시트 높이에 맞춘다. 내용만큼 늘어나게 두면 내부 스크롤 영역이 되지 않는다.
   실제 overflow 전환(부분 열림: hidden / 완전히 열림: auto)은 sheet.css에서 처리한다. */
.sheet-content {
  height: 100%;
  padding-top: 0;                 /* 01의 위쪽 여백 8px을 아래의 고정 헤더 안으로 옮긴다. */
}
/* [중간 스냅] 01에는 내부 목록 스크롤이 없지만, 02는 목록을 스크롤해도
   손잡이·제목·닫기 버튼이 위에 남아 있어야 해서 이 요소들을 sticky 헤더로 묶는다. */
.sheet-top {
  position: sticky;
  top: 0;                        /* .sheet-content의 스크롤 영역 위쪽에 붙인다. */
  z-index: 1;                     /* 뒤로 지나가는 목록보다 헤더를 위에 그린다. */
  padding-top: 8px;               /* 콘텐츠에서 옮긴 여백도 헤더와 함께 고정한다. */
  background: var(--surface);     /* 헤더 뒤로 지나가는 목록의 글자가 비치지 않게 한다. */
}
/* [중간 스냅] 목록은 01의 .item-list를 재사용한다. 맛집 행의 위아래 여백만 10px → 12px로 넓힌다.
   디자인 차이일 뿐이며, 이 줄을 지워 공통값 10px을 써도 스냅·스크롤 동작은 같다. */
.place-list li { padding: 12px 0; }
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


/* ② scroller ─ 200dvh. 스와이프의 정체 ───────────────────────────────── */
.sheet-scroller {
  position: absolute;
  /* 모든 브라우저에서 시트를 열 때 JS가 top을 window.scrollY로 바꿔 현재 뷰포트에 맞춰요.
     예: 페이지를 500px 스크롤한 상태라면 top: 500px. */
  top: 0;
  left: 0;
  width: 100vw;
  height: 200dvh;                  /* 위 절반 = 뷰포트, 아래 절반 = 뷰포트 밖 */
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

/* 콘텐츠 맨 위. "내 윗변 = scroller 윗변"이 되는 scrollTop = 0 → 닫힘 */
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

    // .sheet가 아니라 .sheet-content를 본다. overscrollPadding을 켜면 .sheet는 아래로 100vh 늘어나기 때문.
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

/* 미니맵: scroller 안 콘텐츠 전체를 축소한 지도 (왼쪽 지도 + 오른쪽 범례) */
.minimap {
  right: 8px;
  padding: 8px;
}
/* 시트가 지금 뷰포트에 그려지고 있는지 */
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
.mm-marker.is-off { background: none; border-color: rgb(255 255 255 / 0.35); }  /* [닫기 방지] 스냅이 꺼진 마커 */
.mm-snap-point { height: 0 !important; left: 0 !important; right: 0 !important; border-top: 2px solid #ff6fb5; }  /* [중간 스냅] 스냅 포인트 */
#mm-which { font-weight: 400; opacity: 0.7; }
#hud-stack { display: block; }  /* [04·07] 쌓인 시트 목록 */

/* 완전히 펼친 시트의 제목과 닫기 버튼을 가리지 않도록 확인용 패널을 접는다.
   부분 열림으로 돌아오면 수치와 지도가 다시 보인다. */
body:has(.sheet[data-expanded]) .hud div,
body:has(.sheet[data-expanded]) .minimap .mm-body,
body:has(.sheet[data-expanded]) .minimap .mm-status {
  display: none;
}
body:has(.sheet[data-expanded]) .panel-title {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: 0;
}
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
  // 상자의 뷰포트 기준 top도 달라지므로, 그 위치도 빼서 지도 좌표를 유지한다.
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

  // [중간 스냅] 펼쳐짐 / [닫기 방지] 고정 배치
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
    ? '<b>● 숨김</b> hidden 속성<br>시트가 뷰포트에 안 그려짐'
    : '<b>● 표시 중</b><br>시트가 뷰포트에 그려짐';

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
  setMinimapBox(map.scroller, top, scroller.clientHeight); // scroller가 지금 보고 있는 구간
  setMinimapBox(map.window, top, window.innerHeight); // 보이는 구간
  setMinimapBox(map.toolbar, top + window.innerHeight, padding); // [iOS] 툴바 뒤

  // [중간 스냅] 스냅 포인트: 시트 안 마커 위치에 분홍 선
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

## 다음에는 배경도 함께 움직이기

멈출 위치를 늘리고, 시트를 얼마나 아래로 내릴 수 있는지도 정했습니다. 시트가 움직이는 동안 뒤쪽 배경도 스크롤 위치에 맞춰 달라지면 열리고 닫히는 정도를 더 자연스럽게 전달할 수 있습니다.

다음 글은 시리즈 4편 「손가락을 따라오는 backdrop과 뒤로 밀리는 시트」입니다. 스크롤 위치에 따라 배경의 어두운 정도를 바꾸고, 여러 시트가 겹칠 때 뒤쪽 시트가 물러나는 효과를 살펴보려고 합니다.
