---
title: "(부록) CSS로 만드는 네이티브 같은 바텀시트 6편: 키보드가 시트를 가릴 때"
date: "2026-11-23T08:49:28.000Z"
description: "visualViewport로 키보드 위에 남은 공간을 읽습니다. 입력칸 아래에 스크롤 여유를 더하는 방법에서 시작해, 제목과 저장 버튼을 남기고 가운데 폼만 줄이는 바텀시트를 만듭니다."
tags: ["CSS"]
---

> **시리즈 목차**
>
> 1. [터치 이벤트 없이 스크롤 스냅으로 여닫기](../css-bottom-sheet-1-scroll-snap/)
> 2. [iOS Safari 툴바 뒤에서 시트가 덜 사라질 때](../css-bottom-sheet-2-ios-safari/)
> 3. [지도 앱처럼 중간에 멈추고, 스와이프로는 닫히지 않게](../css-bottom-sheet-3-snap-points/)
> 4. [손가락을 따라오는 backdrop과 모서리](../css-bottom-sheet-4-scroll-animation/)
> 5. [여러 시트를 겹쳐 열고 뒤 시트를 밀어내기](../css-bottom-sheet-5-stacked-sheets/)
> 6. 부록: 키보드가 시트를 가릴 때 (이 글)
> 7. 부록: 키보드 애니메이션에 시트를 맞추기 (준비 중)

이번 글과 다음 글은 시리즈의 부록입니다. 시트를 여닫고, 중간에 멈추고, 여러 장을 겹치는 동작은 5편까지 CSS와 브라우저 스크롤로 만들었습니다. 부록에서는 같은 시트에 입력 폼을 넣었을 때 키보드가 입력칸을 가리는 문제를 다룹니다.

글의 영상과 측정값은 React Native 앱의 WebView에서 얻었습니다. **iOS는 iPhone SE 3세대(iOS 18.6.2, WKWebView), Android는 Galaxy Z Fold7(Android 17, Android System WebView 157)입니다.** 글에서 iOS와 Android는 이 두 기기의 WebView를 가리킵니다.

키보드가 없을 때는 잘 보이던 입력칸이, 누르는 순간 화면 아래에 가려졌습니다. 브라우저가 입력칸을 보여 주려고 화면을 옮기기도 했지만, 시트 안에서 스크롤할 공간이 부족하거나 뒤 페이지까지 같이 움직이는 문제가 남았습니다.

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:20px;margin:24px 0">
<figure style="margin:0">
<video controls playsinline preload="metadata" aria-label="iOS 키보드 기본 동작 영상" src="../../css-bottom-sheet-6-keyboard/ios-unadjusted.mp4" style="display:block;width:100%;max-height:480px;border-radius:12px;background:#111"></video>
<figcaption style="margin-top:8px;font-size:14px"><strong>iOS 기본 동작</strong><br>맨 아래 입력칸을 누르면 화면 전체가 위로 밀리고, 키보드를 닫아도 시트가 내려오지 않습니다.</figcaption>
</figure>
<figure style="margin:0">
<video controls playsinline preload="metadata" aria-label="Android 키보드 기본 동작 영상" src="../../css-bottom-sheet-6-keyboard/android-unadjusted.mp4" style="display:block;width:100%;max-height:480px;border-radius:12px;background:#111"></video>
<figcaption style="margin-top:8px;font-size:14px"><strong>Android 기본 동작</strong><br>화면 전체가 위로 밀리지만, 키보드를 닫으면 제자리로 돌아옵니다.</figcaption>
</figure>
</div>

영상의 시트는 1편 코드에 폼만 넣은 것입니다. 1편은 시트가 화면보다 긴 경우를 다루지 않아서, 보이는 높이가 577px인 iOS에서는 키보드를 띄우기 전부터 제목이 화면 위로 잘립니다.

## 이 글에서 고치는 네 가지

키보드가 가리는 곳에 볼 것이 없다면 기본 동작으로 충분합니다. 시트 위쪽에 입력칸이 하나뿐이고 키보드의 검색 키로 제출하는 검색창이 그런 경우입니다. 예시로 만든 폼은 그렇지 않은 케이스이고, 문제가 된 것은 아래 네 가지였습니다. 이 글은 이 네 가지를 고치는 것을 목표로 합니다.

1. **누른 입력칸을 키보드 위로 올린다**: 키보드가 올라오면 시트 아래쪽이 가려지는데, 시트 안에는 맨 아래 입력칸을 더 올릴 스크롤 공간이 없었습니다. 그래서 브라우저가 대신 화면을 옮겼습니다.
2. **입력칸을 옮겨도 뒤 페이지를 움직이지 않는다**: 맨 아래 입력칸을 누르자 iOS는 입력칸을 보여 주려고 페이지 자체를 스크롤했고, Android는 페이지 스크롤은 그대로 두고 보이는 영역만 키보드 높이만큼 위로 옮겼습니다. 어느 쪽이든 시트 제목과 위쪽 입력칸이 화면 밖으로 나가, 위를 보면서 입력할 수 없었습니다. iOS는 입력칸을 옮길 때마다 페이지를 다시 스크롤했습니다. 시트가 열린 동안 페이지에 `overflow: hidden`을 줬지만 이 스크롤은 막지 못했고, 맨 아래 입력칸에서 바로 위 입력칸으로 옮기자 페이지가 다시 스크롤되어 시트가 약 100px 아래로 움직였습니다. React Aria도 iOS Safari는 `overflow: hidden`이어도 입력칸을 누르면 페이지를 스크롤하고, 고정 위치 요소까지 화면 밖으로 밀어낼 수 있다고 적어 두었습니다. [React Aria의 usePreventScroll 주석](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/overlays/usePreventScroll.ts) Android에서는 같은 순서로 옮겨도 화면이 움직이지 않았습니다.
3. **키보드를 닫으면 시트를 제자리로 돌린다**: iOS는 키보드를 닫은 뒤에도 2번에서 스크롤한 페이지 위치를 되돌리지 않아, 시트가 올라간 채로 남고 아래로 뒤 페이지가 드러났습니다. 입력칸이 하나뿐이어도 생기는 문제입니다.
4. **제목과 저장 버튼을 늘 보이게 한다**: 키보드가 올라오면 시트 제목이 화면 밖으로 나갑니다. 1번처럼 입력칸만 키보드 위로 올리면, 위쪽 입력칸을 눌렀을 때 두 기기 모두 저장 버튼이 키보드 뒤에 남습니다. iOS에서는 맨 아래 입력칸까지 입력하고도 바로 저장하지 못하고 키보드부터 닫아야 해서, 저장까지 한 단계가 더 생깁니다. 폼이 길면 키보드가 없어도 저장 버튼은 아래로 밀려 있습니다.

키보드가 올라오는 동안 시트가 같은 속도로 따라 움직이게 하는 일은 7편에서 다룹니다.

## 1. 누른 입력칸을 키보드 위로 올린다

브라우저 대신 시트가 입력칸을 올리려면 세 가지가 필요합니다. 키보드가 시트를 얼마나 가렸는지 알아야 하고, 시트 안에 스크롤할 공간이 있어야 하고, 가려진 입력칸만 그 공간 안에서 옮겨야 합니다.

### 키보드가 가린 높이를 읽는다

iOS와 Android 모두 키보드가 올라와 보이는 높이가 줄어도 `100dvh` 값은 바뀌지 않습니다. 이 글의 시트는 `100dvh` 높이 상자의 맨 아래에 붙어 있습니다. 상자 높이가 그대로이니 시트도 제자리에 있고, 시트의 아래쪽은 키보드에 가려집니다.

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:20px;margin:24px 0">
<figure style="margin:0">
<img src="../../css-bottom-sheet-6-keyboard/ios-layout-viewport.png" alt="iOS에서 위쪽 입력칸을 누르기 전과 후의 화면입니다. 키보드가 올라온 뒤에도 100dvh는 577px 그대로이고, 보이는 높이만 317px로 줄었습니다." style="display:block;width:100%;border-radius:12px">
<figcaption style="margin-top:8px;font-size:14px"><strong>iOS</strong><br><code>100dvh</code>는 577px 그대로이고, 보이는 높이만 317px로 줄었습니다.</figcaption>
</figure>
<figure style="margin:0">
<img src="../../css-bottom-sheet-6-keyboard/android-layout-viewport.png" alt="Android에서 위쪽 입력칸을 누르기 전과 후의 화면입니다. 키보드가 올라온 뒤에도 100dvh는 797px 그대로이고, 보이는 높이만 471px로 줄었습니다." style="display:block;width:100%;border-radius:12px">
<figcaption style="margin-top:8px;font-size:14px"><strong>Android</strong><br><code>100dvh</code>는 797px 그대로이고, 보이는 높이만 471px로 줄었습니다.</figcaption>
</figure>
</div>

두 기기 모두 화면 위쪽의 입력칸을 눌렀습니다. 입력칸이 이미 보이는 위치라 화면은 거의 움직이지 않았고, 그 아래 입력칸과 저장 버튼은 키보드에 가려졌습니다.

Android Chrome은 108부터 이 방식을 기본값으로 사용합니다. `interactive-widget=resizes-content`로 동작을 바꿀 수 있고, 이 Chrome 변경은 WebView에 그대로 적용되는 규칙도 아닙니다. 앱이 WebView 자체의 높이를 줄이는 경우까지 같은 방식으로 가정하면 안 됩니다. [Chrome의 키보드와 뷰포트 변경 안내](https://developer.chrome.com/blog/viewport-resize-behavior)

그래서 이번 예제에서는 `window.visualViewport`에서 실제로 보이는 구간을 읽습니다. 아래는 같은 Android 화면에서 키보드 윗변에 거의 닿는 상세 주소를 누른 경우입니다.

<figure style="margin:24px 0;max-width:min(100%,460px)">
<img src="../../css-bottom-sheet-6-keyboard/android-offset-top.png" alt="Android에서 상세 주소 입력칸을 누르기 전과 후의 화면입니다. 키보드가 올라오자 브라우저가 화면을 246px 밀어 올렸고, 보이는 높이는 471px입니다." style="display:block;width:100%;border-radius:12px">
<figcaption style="margin-top:8px;font-size:14px"><strong>Android</strong><br>브라우저가 화면을 246px 밀어 올렸고, 보이는 높이는 471px입니다.</figcaption>
</figure>

```js
const viewport = window.visualViewport;
// 아래 숫자는 위 이미지의 키보드 후 기준
// 보이는 높이: 471px
const visibleHeight = viewport.height;
// 키보드가 열릴 때 브라우저가 화면을 밀어 올린 거리: 246px
const visibleTop = viewport.offsetTop;
// 키보드가 덮기 시작하는 위치: 246 + 471 = 717px
const visibleBottom = visibleTop + visibleHeight;
```

### 아래 패딩으로 스크롤 공간을 만든다

키보드에 가려진 입력칸을 브라우저 대신 시트가 올리려면, 시트 안에서 스크롤할 수 있어야 합니다. 그래서 먼저 콘텐츠에 최대 높이와 내부 스크롤을 줬습니다.

```css
.sheet-content {
  max-height: calc(100dvh - 250px);
  overflow-y: auto;
}
```

250px은 시트 위에 남겨 둔 여백입니다. 이것만으로는 부족했습니다. 키보드가 아래쪽을 덮어도 콘텐츠의 높이는 그대로여서, 맨 아래 입력칸을 충분히 위로 올리지 못했습니다. 브라우저가 포커스를 따라 스크롤하더라도 마지막 입력칸 아래에 더 스크롤할 공간이 필요했습니다.

우선 `visualViewport.height`를 CSS 변수에 넣고, 원래 높이와의 차이만큼 콘텐츠 아래 패딩을 늘렸습니다. [React Aria의 시트 구현 글](https://react-aria.adobe.com/blog/sheet)에서도 같은 방향으로 소프트웨어 키보드에 대응합니다.

```js
const viewport = window.visualViewport;

function updateVisualViewportHeight() {
  overlay.style.setProperty('--visual-viewport-height', `${viewport.height}px`);
}

viewport.addEventListener('resize', updateVisualViewportHeight);
updateVisualViewportHeight();
```

```css
.sheet-overlay {
  --keyboard-inset: max(
    0px,
    calc(100dvh - var(--visual-viewport-height, 100dvh))
  );
}

.sheet-content {
  padding-bottom: calc(
    20px + env(safe-area-inset-bottom) + var(--keyboard-inset)
  );
}
```

iOS에서는 `100dvh` 577px과 보이는 높이 317px의 차이인 260px을, Android에서는 797px과 471px의 차이인 326px을 아래 패딩에 더했습니다. Android는 키보드가 올라오면 하단 안전 영역(`env(safe-area-inset-bottom)`)이 48px에서 0px이 되어, 패딩이 실제로 늘어난 양은 278px입니다.

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:20px;margin:24px 0">
<figure style="margin:0">
<img src="../../css-bottom-sheet-6-keyboard/ios-keyboard-inset.png" alt="iOS에서 맨 아래 입력칸을 누르기 전과 후의 화면입니다. 키보드가 올라오면 콘텐츠 아래 패딩에 260px이 더해지고, 그 입력칸이 키보드 위로 올라옵니다." style="display:block;width:100%;border-radius:12px">
<figcaption style="margin-top:8px;font-size:14px"><strong>iOS</strong><br>아래 패딩에 260px을 더해 맨 아래 입력칸을 키보드 위까지 올렸습니다.</figcaption>
</figure>
<figure style="margin:0">
<img src="../../css-bottom-sheet-6-keyboard/android-keyboard-inset.png" alt="Android에서 맨 아래 입력칸을 누르기 전과 후의 화면입니다. 키보드가 올라오면 콘텐츠 아래 패딩에 326px이 더해지고, 그 입력칸이 키보드 위로 올라옵니다." style="display:block;width:100%;border-radius:12px">
<figcaption style="margin-top:8px;font-size:14px"><strong>Android</strong><br>아래 패딩에 326px을 더해 맨 아래 입력칸을 키보드 위까지 올렸습니다.</figcaption>
</figure>
</div>

시트 아랫변은 원래 자리에 두고, 입력칸을 키보드 위까지 올릴 공간을 만드는 방식입니다.

작은 화면에서는 위쪽 여백도 줄여야 했습니다. iOS에서는 키보드가 올라온 뒤 보이는 높이가 317px인데 250px을 비워 두면, 시트가 드러나는 높이는 67px뿐입니다. 높이가 77px인 맨 아래 입력칸을 담을 수 없었습니다.

```css
.sheet-content {
  max-height: calc(
    100dvh - min(
      250px,
      max(0px, calc(var(--visual-viewport-height, 100dvh) - 160px))
    )
  );
}
```

보이는 높이에서 160px을 뺀 값과 원래 여백 250px 중 작은 값을 위쪽 여백으로 씁니다. iOS처럼 317px이 보인다면 여백은 157px이 되어 입력 영역에 160px을 남깁니다. 위의 iOS 캡처에서 키보드가 올라온 뒤 시트 윗변이 250px에서 157px로 올라간 것도 이 계산 때문입니다. 250px과 160px은 이 폼에 맞춘 디자인 값입니다. 보이는 뷰포트 자체가 160px보다 작다면 그만큼의 공간을 확보할 수는 없습니다.

### 가려진 입력칸만 시트 안에서 스크롤한다

패딩은 스크롤할 공간을 늘릴 뿐, 입력칸을 직접 옮기지는 않습니다. 포커스가 바뀌거나 보이는 높이가 달라질 때 입력칸의 위치를 읽고, 가려졌을 때만 시트 내부를 스크롤했습니다.

입력칸이 보이려면 시트 콘텐츠 상자 안에 있으면서 키보드 위에도 있어야 합니다. 그래서 콘텐츠 상자와 보이는 뷰포트가 겹치는 구간을 기준으로 삼았습니다. 두 윗변 중 아래쪽이 구간의 윗변, 두 아랫변 중 위쪽이 구간의 아랫변입니다.

```js
const box = content.getBoundingClientRect();
const target = input.getBoundingClientRect();
// 콘텐츠 윗변 위쪽은 시트에 잘리고, 화면 윗변 위쪽은 화면 밖이다.
// 그래서 두 윗변 중 더 아래쪽(값이 큰 쪽)부터 보인다. 아래 이미지에서는 max(250, 0) = 250
const visibleContentTop = Math.max(box.top, viewport.offsetTop);
// 콘텐츠 아랫변 아래쪽은 시트에 잘리고, 보이는 화면 아랫변 아래쪽은 키보드에 가려진다.
// 그래서 두 아랫변 중 더 위쪽(값이 작은 쪽)까지 보인다. 아래 이미지에서는 min(798, 471) = 471
const visibleContentBottom = Math.min(box.bottom, viewport.offsetTop + viewport.height);
const isClipped = target.top < visibleContentTop || target.bottom > visibleContentBottom;

if (isClipped) {
  // Android: 입력칸의 가운데를 겹치는 구간의 가운데에 맞춘다.
  // iOS는 옮기는 방식이 달라 아래 "작은 화면에서 입력칸이 덜컥거리는 경우"에서 다룬다.
  content.scrollTop += (target.top + target.bottom) / 2 - (visibleContentTop + visibleContentBottom) / 2;
}
```

<figure style="margin:24px 0">
<img src="../../css-bottom-sheet-6-keyboard/android-visible-overlap.png" alt="Android에서 맨 아래 입력칸을 누르기 전과 후의 화면입니다. box인 콘텐츠 상자는 250부터 798, viewport인 보이는 화면은 0부터 471이라 visibleContentTop과 visibleContentBottom은 250과 471입니다. 588부터 664에 있던 입력칸 target은 이 구간 밖이라 isClipped가 true가 되고, 322부터 399로 옮겨집니다." style="display:block;width:100%;border-radius:12px">
<figcaption style="margin-top:8px;font-size:14px"><strong>Android</strong><br><code>box</code>(콘텐츠 상자 250~798px)와 <code>viewport</code>(보이는 화면 0~471px)가 겹치는 <code>visibleContentTop</code>~<code>visibleContentBottom</code>(250~471px)만 실제로 보입니다. 맨 아래 입력칸 <code>target</code>(588~664px)은 이 구간 밖이라 <code>isClipped</code>가 <code>true</code>가 되고, 구간 가운데인 322~399px로 옮겼습니다.</figcaption>
</figure>

가려진 입력칸은 Android에서는 콘텐츠 안의 보이는 구간 가운데로 즉시 옮겼습니다.

iOS에서는 두 가지 문제가 더 있었습니다.

### 첫 키보드가 늦게 올라오는 경우

포커스 후 일정 시간을 기다렸다가 한 번 스크롤하는 방식은 첫 키보드가 늦게 올라올 때 맞지 않았습니다. iPhone 18 Pro 시뮬레이터(iOS 27)의 Safari에서 재부팅 후 처음 맨 아래 입력칸을 누르자, 정해 둔 시간이 지난 뒤에야 키보드가 올라왔습니다. 입력칸 확인은 이미 끝난 뒤였고, 그 입력칸은 키보드 뒤에 남았습니다.

이 글의 영상을 찍은 iPhone SE에서는 키보드가 바로 올라와 같은 상황을 재현하지 못했습니다. 첫 키보드만 늦게 뜨는 현상은 [WKWebView로 만든 Ionic 앱에서도 보고됩니다](https://forum.ionicframework.com/t/the-first-show-of-keyboard-in-app-is-very-slow/250616).

<figure style="margin:24px 0">
<img src="../../css-bottom-sheet-6-keyboard/ios-first-keyboard-late.png" alt="iPhone 18 Pro 시뮬레이터에서 재부팅 후 처음 맨 아래 입력칸을 누른 화면입니다. 수정 전에는 그 입력칸이 키보드 뒤에 남고, 수정 후에는 키보드 위에 보입니다." style="display:block;width:100%;border-radius:12px">
<figcaption style="margin-top:8px;font-size:14px"><strong>iPhone 18 Pro 시뮬레이터 · Safari</strong><br>수정 전에는 맨 아래 입력칸이 키보드 뒤에 남고, 수정 후에는 처음부터 키보드 위에 보입니다.</figcaption>
</figure>

그래서 `focusin`과 `visualViewport.resize`에서 다시 계산하도록 바꿨습니다. 포커스가 바뀌었을 때와 실제 높이가 달라졌을 때를 각각 처리합니다. 사용자가 폼을 직접 스크롤할 때마다 실행하지는 않습니다. 그러면 다른 입력칸을 보려고 움직일 때도 포커스된 칸으로 계속 돌아가기 때문입니다.

### 작은 화면에서 입력칸이 덜컥거리는 경우

iOS에서도 가려진 입력칸을 가운데로 즉시 옮기자, 키보드가 올라오는 순간 폼이 한 번에 170px 튀었습니다. 위쪽 여백을 줄이기 전이라 시트 윗변과 키보드 사이가 67px뿐이어서, 높이 77px인 입력칸은 가운데에 맞춰도 다 들어가지 않았습니다. 앞에서 위쪽 여백을 줄인 이유가 이것입니다.

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:20px;margin:24px 0">
<figure style="margin:0">
<video controls playsinline preload="metadata" aria-label="iOS 입력칸 덜컥거림 수정 전 영상" src="../../css-bottom-sheet-6-keyboard/ios-before-input-jump.mp4" style="display:block;width:100%;max-height:480px;border-radius:12px;background:#111"></video>
<figcaption style="margin-top:8px;font-size:14px"><strong>수정 전 · 덜컥거림</strong><br>맨 아래 입력칸을 누르면 한 번에 위로 튀고, 시트 윗변과 키보드 사이 67px에 입력칸이 다 들어가지 않습니다.</figcaption>
</figure>
<figure style="margin:0">
<video controls playsinline preload="metadata" aria-label="iOS 입력칸 덜컥거림 수정 후 영상" src="../../css-bottom-sheet-6-keyboard/ios-after-input-jump.mp4" style="display:block;width:100%;max-height:480px;border-radius:12px;background:#111"></video>
<figcaption style="margin-top:8px;font-size:14px"><strong>수정 후</strong><br>위쪽 여백을 줄이고 가려진 만큼만 부드럽게 올려, 입력칸이 튀지 않고 라벨까지 키보드 위에 남습니다.</figcaption>
</figure>
</div>

입력 영역을 넓힌 뒤에는 가려진 부분만큼만 부드럽게 옮겼습니다. 아래 코드는 패딩으로 입력칸을 보이게 하는 단계의 iOS 처리입니다.

```js
if (isClipped) {
  const distance = target.top < visibleContentTop
    ? target.top - visibleContentTop
    : target.bottom - visibleContentBottom;

  content.scrollTo({
    top: content.scrollTop + distance,
    behavior: 'smooth',
  });
}
```

## 2. 입력칸을 옮겨도 뒤 페이지를 움직이지 않는다

시트 안에서 입력칸을 올리게 됐으니, 브라우저가 입력칸을 보여 주려고 화면을 옮기는 동작은 막아야 합니다. 그대로 두면 iOS에서는 뒤 페이지가 밀린 채 남습니다.

<figure style="margin:24px 0;max-width:min(100%,270px)">
<video controls playsinline preload="metadata" aria-label="iOS 입력칸 전환 때 뒤 페이지 이동 영상" src="../../css-bottom-sheet-6-keyboard/ios-before-page-shift.mp4" style="display:block;width:100%;border-radius:12px;background:#111"></video>
<figcaption style="margin-top:8px;font-size:14px"><strong>수정 전 · 뒤 페이지 이동</strong><br>맨 아래 입력칸과 바로 위 입력칸을 차례로 누른 뒤 시트를 닫았습니다. 처음의 "배송 정보 입력" 버튼 위치와 비교하면, 뒤 페이지가 위로 밀린 채 남아 있습니다.</figcaption>
</figure>

입력칸을 옮기면 이전 입력칸의 `blur`가 다음 입력칸의 포커스보다 먼저 일어납니다. 그래서 시트에 `blur` 처리를 걸어 두고, 그 시점에 다음 입력칸에 `focus({preventScroll: true})`를 먼저 적용했습니다. 브라우저가 화면을 옮기며 포커스를 주기 전에, 스크롤 없이 포커스를 먼저 넣어 두는 것입니다.

```js
overlay.addEventListener('blur', event => {
  if (isInput(event.relatedTarget)) {
    event.relatedTarget.focus({preventScroll: true});
  }
}, true);
```

`preventScroll`은 포커스를 줄 때 브라우저가 수행하는 스크롤을 막는 옵션입니다.

완료로 키보드를 닫으면 포커스가 어디로도 가지 않고 사라집니다. 이 상태에서 다른 입력칸을 누르면 시트 안에서 포커스를 잃는 요소가 없어 위의 `blur` 처리가 실행되지 않고, 영상처럼 페이지가 밀립니다. 그래서 이때는 시트 콘텐츠로 포커스를 옮겨 두었습니다. 콘텐츠는 `div`라 그대로는 포커스를 받지 못해서 `tabindex="-1"`을 줬습니다. 그러면 다음 입력칸을 누를 때 콘텐츠의 `blur`가 일어나 위 처리가 다시 실행됩니다.

## 3. 키보드를 닫으면 시트를 제자리로 돌린다

글 앞의 iOS 기본 동작 영상에서는 키보드를 닫아도 시트가 내려오지 않았습니다. iOS가 입력칸을 보여 주려고 스크롤한 페이지 위치를 키보드를 닫은 뒤에도 되돌리지 않았기 때문입니다. 이번 시트는 1편에서 iOS Safari에서 잘리지 않도록 `fixed`가 아닌 `absolute`로 페이지 안에 놓았습니다. 그래서 남은 스크롤만큼 올라간 채로 남고, 아래로 뒤 페이지가 드러났습니다. `position: fixed`로 화면에 붙인 시트는 같은 스크롤이 남아도 제자리로 돌아왔습니다.

3번을 위해 따로 처리할 것은 없습니다. 2번 처리로 시트가 열린 동안 페이지가 스크롤되지 않으니, 키보드를 닫아도 시트는 원래 자리에 그대로 있습니다.

## 4. 제목과 저장 버튼을 늘 보이게 한다

입력칸은 보이게 됐지만 저장 버튼을 항상 남기지는 못했습니다. 제목부터 저장 버튼까지 하나의 스크롤 영역에 있었기 때문입니다. 폼이 길면 키보드가 없어도 저장 버튼은 아래로 밀려 있고, 키보드가 올라오면 위쪽 입력칸에서는 저장 버튼이 키보드 뒤에 남습니다. iOS에서는 맨 아래 입력칸을 눌러도 저장 버튼이 키보드 뒤에 남아, 마지막 입력칸까지 입력한 뒤 키보드를 닫아야 저장할 수 있습니다.

여기서 원한 것은 폼을 어디까지 스크롤했든, 키보드가 올라왔든 제목과 저장 버튼이 늘 보이는 상태입니다. 입력을 마치면 키보드를 닫지 않고 바로 저장할 수 있어야 합니다. 이 작업을 두 단계로 나눴습니다. 먼저 시트 콘텐츠를 세 행으로 나눠 폼만 스크롤하게 하고, 그다음 시트 높이를 키보드 위 공간에 맞춥니다.

### 시트 콘텐츠를 세 행으로 나눈다

```html
<div class="sheet-content" tabindex="-1">
  <div class="sheet-top">제목과 닫기 버튼</div>
  <form class="sheet-form">입력칸</form>
  <footer class="sheet-footer">저장 버튼</footer>
</div>
```

```css
.sheet-content {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: clip;
}

.sheet-form {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
}
```

제목과 저장 버튼은 필요한 높이를 쓰고, 가운데 폼이 남은 공간을 차지합니다. `minmax(0, 1fr)`과 `min-height: 0`으로 폼이 내용보다 작아질 수 있게 했습니다. 폼이 줄어들면 그 안에서 스크롤합니다. 저장 버튼은 스크롤 영역 밖의 마지막 행에 있으므로 폼과 함께 올라가지 않습니다.

세 행으로 나누기만 하면 저장 버튼은 시트 맨 아래에 고정되지만, 시트 아래쪽이 키보드에 가려지면 저장 버튼도 함께 가려집니다. 이제 전체 높이도 보이는 공간에 맞춰야 합니다. 앞 단계에서 넣었던 큰 아래 패딩은 제거하고, 시트 높이와 아랫변을 함께 바꿉니다.

### 시트 높이와 아랫변을 보이는 공간에 맞춘다

1번에서 읽은 `visualViewport`의 보이는 높이와 아랫변을 각각 CSS 변수로 전달합니다.

```js
function updateVisibleArea() {
  // 핀치 확대 중에도 값이 바뀌므로, 확대하지 않았을 때만 반영한다.
  if (viewport.scale !== 1) return;
  overlay.style.setProperty('--visible-height', `${viewport.height}px`);
  overlay.style.setProperty('--visible-bottom', `${viewport.offsetTop + viewport.height}px`);
  scrollFocusedInputIntoView();
}

viewport.addEventListener('resize', updateVisibleArea);
```

`offsetTop`을 빼고 높이만 사용하면, 화면이 아래로 이동한 경우 아랫변을 그만큼 위로 잘못 잡을 수 있습니다.

```css
.sheet-overlay {
  --covered-bottom: max(
    0px,
    calc(100dvh - var(--visible-bottom, 100dvh))
  );
}

.sheet {
  margin-bottom: var(--covered-bottom);
}

.sheet.overscroll-padding {
  margin-bottom: calc(var(--covered-bottom) - 100vh);
}

.sheet-content {
  height: max(0px, calc(var(--visible-height, 100dvh) - 56px));
  padding: 0;
}
```

stage의 높이는 유지하고, 그 바닥에 붙어 있는 시트에 아래 여백을 줘서 올립니다. 시트 콘텐츠 높이는 보이는 높이에서 위쪽 여백 56px을 뺀 값입니다. 아래 배경 연장 옵션을 켠 경우에는 기존 `-100vh` 여백과 함께 계산합니다.

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:20px;margin:24px 0">
<figure style="margin:0">
<img src="../../css-bottom-sheet-6-keyboard/ios-sheet-resize.png" alt="iOS에서 키보드 전후의 시트입니다. 위쪽 여백 56px은 그대로이고, 시트 콘텐츠는 521px에서 261px로 줄고, 키보드가 가린 260px만큼 시트 아래 여백이 생깁니다." style="display:block;width:100%;border-radius:12px">
<figcaption style="margin-top:8px;font-size:14px"><strong>iOS</strong><br>시트 콘텐츠가 521px에서 261px로 줄고, 아래 여백 260px만큼 올라갑니다.</figcaption>
</figure>
<figure style="margin:0">
<img src="../../css-bottom-sheet-6-keyboard/android-sheet-resize.png" alt="Android에서 키보드 전후의 시트입니다. 위쪽 여백 56px은 그대로이고, 시트 콘텐츠는 741px에서 415px로 줄고, 키보드가 가린 326px만큼 시트 아래 여백이 생깁니다." style="display:block;width:100%;border-radius:12px">
<figcaption style="margin-top:8px;font-size:14px"><strong>Android</strong><br>시트 콘텐츠가 741px에서 415px로 줄고, 아래 여백 326px만큼 올라갑니다.</figcaption>
</figure>
</div>

### 줄어든 폼 안에서 입력칸을 다시 찾는다

폼 높이가 줄면 방금 누른 입력칸이 폼 밖으로 가려질 수 있습니다. 새 크기를 적용한 뒤 입력칸을 확인하고, 가려졌다면 폼 가운데로 옮깁니다.

```js
const box = form.getBoundingClientRect();
const target = input.getBoundingClientRect();

if (target.top < box.top || target.bottom > box.bottom) {
  form.scrollTop += (target.top + target.bottom - box.top - box.bottom) / 2;
}
```

이제 폼 전체가 키보드 위에 있으므로, 입력칸이 폼의 윗변과 아랫변 사이에 들어오는지만 보면 됩니다. 가려졌다면 iOS와 Android 모두 폼 안에서 즉시 옮깁니다.

2번의 iOS `preventScroll` 처리는 이 단계에서도 그대로 사용합니다.

## 수정 전후 비교 영상

글 처음의 기본 동작과 네 가지를 모두 고친 결과를 같은 순서로 찍었습니다. 시트를 열고 맨 아래 입력칸을 누른 뒤 키보드를 닫습니다. 고친 뒤의 iOS는 시트를 연 직후 맨 아래 입력칸이 폼 안에 가려져 있어, 폼을 한 번 올린 뒤 눌렀습니다. 좁은 뷰포트에서는 위아래로 배치됩니다.

### iOS

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:20px;margin:24px 0">
<figure style="margin:0">
<video controls playsinline preload="metadata" aria-label="iOS 키보드 기본 동작 영상" src="../../css-bottom-sheet-6-keyboard/ios-unadjusted.mp4" style="display:block;width:100%;max-height:480px;border-radius:12px;background:#111"></video>
<figcaption style="margin-top:8px;font-size:14px"><strong>기본 동작</strong><br>화면 전체가 위로 밀리고, 키보드를 닫아도 시트가 내려오지 않습니다.</figcaption>
</figure>
<figure style="margin:0">
<video controls playsinline preload="metadata" aria-label="iOS 네 가지를 고친 뒤 영상" src="../../css-bottom-sheet-6-keyboard/ios-sheet-resize.mp4" style="display:block;width:100%;max-height:480px;border-radius:12px;background:#111"></video>
<figcaption style="margin-top:8px;font-size:14px"><strong>고친 뒤</strong><br>제목과 저장 버튼을 남기고 가운데 폼만 줄이며, 키보드를 닫으면 시트가 원래 높이로 돌아옵니다.</figcaption>
</figure>
</div>

### Android

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:20px;margin:24px 0">
<figure style="margin:0">
<video controls playsinline preload="metadata" aria-label="Android 키보드 기본 동작 영상" src="../../css-bottom-sheet-6-keyboard/android-unadjusted.mp4" style="display:block;width:100%;max-height:480px;border-radius:12px;background:#111"></video>
<figcaption style="margin-top:8px;font-size:14px"><strong>기본 동작</strong><br>화면 전체가 위로 밀려 제목이 화면 밖으로 나가고, 키보드를 닫으면 제자리로 돌아옵니다.</figcaption>
</figure>
<figure style="margin:0">
<video controls playsinline preload="metadata" aria-label="Android 네 가지를 고친 뒤 영상" src="../../css-bottom-sheet-6-keyboard/android-sheet-resize.mp4" style="display:block;width:100%;max-height:480px;border-radius:12px;background:#111"></video>
<figcaption style="margin-top:8px;font-size:14px"><strong>고친 뒤</strong><br>제목과 저장 버튼을 남기고 가운데 폼만 줄이며, 키보드를 닫으면 시트가 원래 높이로 돌아옵니다.</figcaption>
</figure>
</div>

## 최종 위치와 움직이는 시점은 다르다

키보드가 다 올라온 뒤에는 입력칸과 저장 버튼이 보입니다. 하지만 녹화한 두 기기 모두 시트가 먼저 줄어들고 키보드가 뒤따라오는 차이가 남았습니다.

`transition`으로 시트에 임의의 시간을 더해도 키보드와 같은 속도라고 보장할 수 없습니다. 다음 글은 두 번째 부록인 7편 「키보드 애니메이션에 시트를 맞추기」(준비 중)입니다. 앱의 키보드 진행 정보를 받아 시트가 움직이는 시점을 맞추려고 합니다.
