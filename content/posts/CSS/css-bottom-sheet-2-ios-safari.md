---
title: "CSS로 만드는 네이티브 같은 바텀시트 2편: iOS Safari 툴바 뒤에서 시트가 덜 사라질 때"
date: "2026-11-09T13:20:54.000Z"
description: "iOS Safari에서 시트를 내리다 보면 툴바 뒤에 남은 부분이 먼저 사라질 수 있습니다. stage와 enter 마커를 더 아래로 옮기고 닫힘 관찰 범위도 넓혀, 시트가 끝까지 내려간 뒤 숨기도록 만듭니다."
tags: ["CSS"]
---

> **시리즈 목차**
>
> 1. [터치 이벤트 없이 스크롤 스냅으로 여닫기](../css-bottom-sheet-1-scroll-snap/)
> 2. iOS Safari 툴바 뒤에서 시트가 덜 사라질 때 (이 글)
> 3. 지도 앱처럼 중간에 멈추고, 스와이프로는 닫히지 않게 (준비 중)
> 4. 손가락을 따라오는 backdrop과 뒤로 밀리는 시트 (준비 중)
> 5. 키보드가 시트를 가릴 때 (준비 중)
> 6. 키보드 애니메이션에 시트를 맞추기 (준비 중)

1편에서는 스크롤 스냅으로 시트를 여닫았습니다. exit 마커가 닫힘 위치를, enter 마커가 열림 위치를 정하고, 시트 콘텐츠가 뷰포트를 벗어나면 `IntersectionObserver`가 닫힘을 감지했습니다.

그런데 iOS Safari에서는 뷰포트를 벗어났다는 판정과 눈앞에서 완전히 사라졌다는 결과가 어긋날 수 있습니다. 하단 툴바 뒤로도 페이지가 비쳐 보이기 때문입니다. 이번 글에서는 1편 코드에 남겨 두었던 `--viewport-padding`이 이 차이를 어떻게 보정하는지 살펴보려고 합니다.

## 툴바 뒤에는 아직 시트가 남아 있다

시트를 아래로 내려 닫는 도중을 생각해 보겠습니다. 시트의 윗부분이 브라우저가 보고한 뷰포트 하단을 막 지났습니다. 기본 관찰 범위에서는 시트가 사라졌지만, Safari의 반투명 툴바 뒤에는 시트가 아직 비칠 수 있습니다. 이때 overlay를 곧바로 숨기면, 남아 있던 부분이 아래로 빠져나가는 대신 툭 사라집니다.

[React Aria 원본 코드](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/Sheet.tsx)는 바로 이 상황을 닫힘 감지 주석에 설명합니다. iOS에서는 브라우저가 보고한 뷰포트 바깥에도 콘텐츠가 표시되므로, 시트가 완전히 보이지 않을 때 숨기도록 관찰 범위를 넓힙니다.

아래 영상은 iPhone 18 Pro 시뮬레이터(iOS 27.0)의 Safari에서 촬영했습니다. 같은 위치에서 두 시트를 내려 보면 왼쪽은 먼저 사라지고, 오른쪽은 반투명 주소창 뒤로 계속 내려갑니다.

<video controls playsinline preload="metadata" aria-label="iOS 27.0 Safari 시뮬레이터에서 촬영한 시트 닫힘 보정 전후 비교" src="../../css-bottom-sheet-2-ios-safari/viewport-padding-ios-simulator.mp4" style="display:block;width:100%;max-height:602px;border-radius:12px;background:#f4f7fa"></video>

이 차이를 맞추려면 시트가 툴바 뒤에서도 사라질 만큼 아래로 이동할 수 있어야 합니다. 닫힘을 감지하는 범위도 그만큼 넓혀야 합니다. 1편 코드에서는 같은 보정값을 배치와 관찰 범위에 함께 사용합니다.

## fixed 대신 absolute로 배치한 이유

overlay를 `position: fixed`와 `inset: 0`으로 배치하면, iOS 26 Safari에서는 overlay의 아랫변이 하단 툴바 위에 놓입니다. (같은 예제를 iPhone SE 3세대 실기기(iOS 18.6.2)의 Safari에서도 확인했지만, 두 배치의 표시 차이는 재현하지 못했습니다.) 페이지 아래쪽의 버튼이 툴바에 가리지 않도록 Safari가 그 위치에 `bottom: 0`을 맞추기 때문입니다. [WebKit의 배치 설명](https://bugs.webkit.org/show_bug.cgi?id=297779#c23)

고정 요소에 `bottom: -100px`을 줘 툴바 뒤까지 내린 재현 예제에서는 경계 아래로 내려간 부분이 잘립니다. 바텀시트에 대입하면 `hide()`를 호출하기 전에도, 시트가 툴바 뒤로 내려가는 부분이 보이지 않을 수 있습니다. [iOS 26 Safari 잘림 재현](https://developer.apple.com/forums/thread/800798)

1편에서는 시트가 툴바 뒤에 비치는 페이지 콘텐츠처럼 움직이도록 overlay를 `absolute`로 배치하고 문서 전체를 덮었습니다.

![iPhone 18 Pro 시뮬레이터(iOS 27.0)의 Safari 화면입니다. 왼쪽 fixed 요소의 줄무늬는 뷰포트 하단을 나타내는 점선에서 끊기고, 오른쪽 absolute 요소의 줄무늬는 주소창 뒤까지 이어집니다.](/css-bottom-sheet-2-ios-safari/fixed-overlay-ios-simulator.png)

```css
.sheet-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: max(var(--page-width), 100vw);
  height: max(var(--page-height), 100dvh);
  overflow: clip;
}

.sheet-scroller {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 200dvh;
}
```

시트를 열 때 문서의 전체 너비와 높이를 읽어 overlay의 CSS 변수에 넣습니다. 위 CSS의 `max()`는 문서와 뷰포트 중 더 큰 크기를 사용합니다. 덕분에 페이지가 뷰포트보다 길어도 overlay가 문서 끝까지 덮습니다.

```js
overlay.style.setProperty('--page-width', `${document.documentElement.scrollWidth}px`);
overlay.style.setProperty('--page-height', `${document.documentElement.scrollHeight}px`);
```

scroller의 윗변은 사용자가 지금 보고 있는 위치에 맞춥니다. 시트를 열 때 문서의 스크롤 위치인 `window.scrollY`를 scroller의 `top`에 넣습니다.

```js
scroller.style.top = `${window.scrollY}px`;
```

페이지를 500px 내린 상태라면 scroller도 문서의 500px 지점에 놓입니다. 그러면 scroller의 윗변이 현재 뷰포트의 윗변과 맞습니다. 이 배치는 모든 브라우저에서 사용하고, 다음의 높이 보정은 iOS Safari에서만 켭니다.

## iOS Safari에서 툴바 뒤로 내려갈 공간을 더한다

예제의 `sheet.js`는 iOS Safari로 판단한 경우 `html`에 `ios-safari` 클래스를 붙입니다. CSS는 이 클래스가 있을 때 보정값을 지정합니다.

```css
:root {
  --viewport-padding: 0px;
}

html.ios-safari {
  --viewport-padding: calc(100lvh - 100svh + 58px);
}
```

아이폰 Safari에서 하단 주소창과 뒤로 가기 같은 버튼이 모두 보이면 웹페이지가 쓸 수 있는 높이가 줄어듭니다. 페이지 아래쪽으로 스크롤해 작은 주소창만 남으면 웹페이지가 차지할 수 있는 공간이 더 커집니다. `svh`, `lvh`, `dvh`는 이 높이를 어떤 상태에서 재느냐에 따라 달라집니다.

![아이폰 Safari 화면을 재현했습니다. 파란 선은 각 단위가 가리키는 높이입니다. 오른쪽 화면은 하단 버튼이 모두 보이는 순간이라 100dvh가 100svh와 같습니다.](/css-bottom-sheet-2-ios-safari/viewport-units-safari.webp)

| 값 | 이 글에서의 의미 |
| --- | --- |
| `100svh` | 하단 주소창과 버튼이 모두 보일 때의 뷰포트 높이 |
| `100lvh` | 하단에 작은 주소창만 남았을 때의 뷰포트 높이 |
| `100dvh` | 지금 상태의 뷰포트 높이. 하단 도구가 모두 보이면 `100svh`, 작은 주소창만 남으면 `100lvh`와 같습니다. |

`100lvh - 100svh`는 작은 주소창만 남았을 때 웹페이지에 추가로 생기는 높이입니다.

작아진 주소창 뒤에도 시트가 비칠 수 있습니다. 예제에서는 높이 차이에 `58px`을 더해 시트가 반투명 주소창 뒤를 끝까지 지나갈 공간을 확보합니다. 이 숫자와 관련된 측정 사례는 뒤의 [58px은 어디서 나온 값일까](#58px은-어디서-나온-값일까)에서 살펴봅니다.

## stage와 enter 마커를 함께 내린다

1편에서 시트를 바닥에 붙여 두었던 stage를 기억하시나요? scroller의 전체 콘텐츠에는 위에서부터 exit 마커, stage, enter 마커가 차례로 놓입니다. [1편의 stage 설명](../css-bottom-sheet-1-scroll-snap/#stage-시트를-바닥에-붙이는-무대)

![보정값이 0px일 때의 기본 구조입니다. 시트를 열면 stage가 뷰포트에 들어오고, 시트는 stage의 바닥에 붙어 있습니다.](/css-bottom-sheet-2-ios-safari/sheet-stage-structure.svg)

보정값을 정했으면 stage와 enter 마커의 `top`에 같은 값을 더합니다. exit 마커는 전체 콘텐츠의 맨 위에 그대로 둡니다.

```css
.sheet-stage {
  top: calc(100dvh + var(--viewport-padding));
  height: 100dvh;
}

.snap-marker--enter {
  top: calc(200dvh + var(--viewport-padding));
  height: 100dvh;
  scroll-snap-align: end;
}

.snap-marker--exit {
  top: 0;
  height: 100dvh;
  scroll-snap-align: start;
}
```

stage의 높이는 그대로이고 시작 위치만 아래로 이동합니다. 특히 뷰포트를 크게 채우는 시트를 닫을 때, 시트의 윗부분까지 툴바 뒤를 지나 더 내려갈 여유가 생깁니다.

stage를 아래로 옮겼으니 열 때도 그만큼 더 스크롤해야 합니다. enter 마커에 같은 값을 더한 이유가 여기에 있습니다. 1편의 열림 위치 계산은 마커의 실제 위치를 읽으므로, 늘어난 보정값도 함께 반영합니다.

```js
function getFullyOpenScrollTop() {
  const marker = overlay.querySelector('.snap-marker--enter');
  return marker.offsetTop + marker.offsetHeight - scroller.clientHeight;
}
```

계산을 위해 뷰포트 높이를 400px, 보정값을 100px로 가정해 보겠습니다. 이 100px은 설명용 숫자이며 기기에서 측정한 값은 아닙니다.

| 항목 | 보정 전 | 100px 보정 후 |
| --- | --- | --- |
| stage의 시작 위치 | 400px | 500px |
| enter 마커의 시작 위치 | 800px | 900px |
| 전체 콘텐츠의 끝 | 1200px | 1300px |
| scroller 높이 | 800px | 800px |
| 열림 위치의 `scrollTop` | 400px | 500px |

보정 후에는 enter 마커의 아랫변 1300px에서 scroller 높이 800px을 뺀 500px이 열림 위치가 됩니다. 이때 stage의 시작 위치도 500px이므로, 열린 stage의 윗변은 여전히 뷰포트 윗변과 맞습니다.

닫을 때는 `scrollTop`을 0으로 돌립니다. 열린 위치에서 닫힌 위치까지의 이동 거리가 400px에서 500px로 늘어난 셈입니다. 같은 위치에 열리면서, 닫힐 때는 더 아래까지 이동할 수 있습니다.

## 닫힘 판정도 툴바 뒤까지 기다린다

이동할 공간을 마련했더라도 관찰 범위를 그대로 두면 앞의 문제가 남습니다. 시트가 브라우저가 보고한 뷰포트만 벗어난 순간, observer가 overlay를 숨길 수 있기 때문입니다.

그래서 아래쪽 `rootMargin`에도 같은 보정값을 넣습니다. `rootMargin`은 관찰 기준이 되는 사각형을 늘리는 옵션입니다. 시트 자체를 이동시키지는 않습니다.

```js
const paddingPx = stage.offsetTop - scroller.clientHeight / 2;

let hasEntered = false;
const observer = new IntersectionObserver(
  ([entry]) => {
    hasEntered ||= entry.isIntersecting;
    if (hasEntered && !entry.isIntersecting) {
      hide();
    }
  },
  {rootMargin: `0px 0px ${paddingPx}px 0px`}
);

observer.observe(content);
```

stage의 시작 위치는 `100dvh + 보정값`이고, scroller 높이의 절반은 `100dvh`입니다. 둘의 차이를 구하면 보정값을 px 단위로 얻습니다. 위 예시에서는 `500 - 800 / 2`로 100px이 됩니다.

`rootMargin`의 네 값은 위, 오른쪽, 아래, 왼쪽 순서입니다. 아래쪽만 100px 늘리면 시트 콘텐츠가 그 범위까지 완전히 벗어난 뒤 `hide()`를 호출합니다. `hasEntered`는 1편과 마찬가지로 한 번이라도 보인 뒤에 사라졌는지 확인합니다. 처음 열기 직전의 뷰포트 밖 상태를 닫힘으로 처리하지 않기 위한 조건입니다.

관찰 대상도 1편과 같은 `.sheet-content`입니다. `overscrollPadding`으로 시트 배경색을 아래로 연장하더라도, 닫힘 판정은 실제 시트 콘텐츠를 기준으로 합니다. 배경색을 늘리는 옵션과, 이번 글에서 다룬 이동 거리·관찰 범위 보정은 각각 적용하는 곳이 다릅니다.

## 58px은 어디서 나온 값일까

식에서 가장 궁금했던 부분은 `58px`이었습니다. [React Aria 코드](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/Sheet.tsx)에는 이 값과 툴바를 고려한다는 주석이 있지만, 어떤 기기와 Safari 설정에서 측정했는지 또는 어떤 계산으로 정했는지는 적혀 있지 않습니다. [시트를 소개한 공식 글](https://react-aria.adobe.com/blog/sheet)에서도 산출 과정을 찾지 못했습니다.

관련된 측정 사례는 있습니다. iOS 26의 Compact 모드를 사용한 iPhone 16 Pro에서는 하단 주소창과 버튼이 모두 보일 때 하단 영역이 94px이었고, 스크롤 후 웹페이지에 약 36px의 공간이 더 생겼습니다. [iPhone Safari의 표시 영역을 측정한 글](https://doesitfit.lol/blog/iphone-safari-visible-area)

늘어난 공간이 모두 하단에서 생겼다고 가정하면, 작은 주소창만 보일 때 하단에 남는 높이는 `94 - 약 36 ≈ 58px`입니다. React Aria가 이 측정을 근거로 값을 정했는지는 확인하지 못했습니다. 모든 Safari의 툴바 높이를 58px로 볼 근거도 아닙니다.

이 바텀시트를 적용할 때 문제가 될 수 있는 부분중 하나는 iOS Safari에서 시트가 닫히는 동작입니다. 예제에서는 앞의 계산과 React Aria가 사용한 값인 58px을 그대로 적용했습니다. 계산은 iPhone 한 대의 측정값을 바탕으로 한 추정이라, 다른 기기나 Safari 설정에서도 이 값으로 시트가 끝까지 자연스럽게 닫힌다고 장담하기는 어렵습니다.

## 다음에는 중간에도 멈추게 하기

닫힘 판정은 툴바 뒤까지 넓혔지만, 손을 뗐을 때 붙는 위치는 여전히 exit 마커와 enter 마커가 정한 두 곳입니다. 지도 앱처럼 일부만 열어 두거나, 시트를 끌어내려도 완전히 닫히지 않게 하려면 멈출 위치를 더 다뤄야 합니다.

다음 편에서는 지도 앱처럼 시트가 중간 높이에서도 멈추도록 스냅 위치를 추가합니다. 아래로 스와이프해도 시트가 닫히지 않도록 이동 범위를 제한하는 방법도 살펴봅니다.
