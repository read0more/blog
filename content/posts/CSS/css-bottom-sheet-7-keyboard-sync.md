---
title: "(부록) CSS로 만드는 네이티브 같은 바텀시트 7편: React Native WebView에서 키보드 애니메이션에 시트를 맞추기"
date: "2026-11-25T07:22:22.000Z"
description: "React Native에서 키보드가 움직이는 동안의 높이를 WebView에 전달합니다. 안전 영역을 중복으로 빼지 않고, Android의 자동 이동을 조정해 시트의 저장 버튼이 키보드를 따라가게 만듭니다."
tags: ["CSS"]
---

> **시리즈 목차**
>
> 1. [터치 이벤트 없이 스크롤 스냅으로 여닫기](../css-bottom-sheet-1-scroll-snap/)
> 2. [iOS Safari 툴바 뒤에서 시트가 덜 사라질 때](../css-bottom-sheet-2-ios-safari/)
> 3. [지도 앱처럼 중간에 멈추고, 스와이프로는 닫히지 않게](../css-bottom-sheet-3-snap-points/)
> 4. [손가락을 따라오는 backdrop과 모서리](../css-bottom-sheet-4-scroll-animation/)
> 5. [여러 시트를 겹쳐 열고 뒤 시트를 밀어내기](../css-bottom-sheet-5-stacked-sheets/)
> 6. 부록: [키보드가 시트를 가릴 때](../css-bottom-sheet-6-keyboard/)
> 7. 부록: React Native WebView에서 키보드 애니메이션에 시트를 맞추기 (이 글)

이번 글은 6편에 이어 키보드를 다루는 두 번째 부록입니다. 6편에서는 키보드 위에 남은 공간에 시트를 맞췄습니다. 제목과 저장 버튼을 남기고 가운데 폼만 줄이니, 키보드가 다 올라온 뒤의 배치는 맞았습니다. 그런데 실기기에서 녹화해 보니 저장 버튼이 먼저 올라가고 키보드가 뒤따랐습니다. 키보드가 아직 올라오는 중에 `visualViewport.height`는 이미 최종값으로 바뀌었습니다. 시트가 그 값을 바로 적용하니 저장 버튼과 키보드 사이가 잠깐 벌어졌습니다.

이번에는 키보드가 움직이는 동안의 높이를 앱에서 받아 보려고 합니다. 시트를 배치하는 CSS는 6편과 같습니다. **어떤 높이를 언제 넣는지**를 바꾸는 작업입니다. 이 부분은 React Native 앱 안의 WebView에서 다룹니다. 일반 브라우저에서는 6편의 `visualViewport` 방식을 계속 사용합니다. 6편과 같은 두 기기로 비교했습니다. iOS는 iPhone SE 3세대, Android는 Galaxy Z Fold7을 사용했습니다.

## 이 글에서 맞추는 네 가지

키보드가 움직이는 동안 시트가 따라가려면 아래 네 가지가 필요했습니다. 키보드 높이를 받아 시트에 적용하는 코드(1·2번)와 웹페이지가 준비됐을 때 마지막 높이를 다시 보내는 코드(4번)는 iOS와 Android가 함께 씁니다. 입력칸이 가려질 때 화면을 어떻게 스크롤할지(3번)는 두 OS에서 따로 조정했습니다.

1. **키보드가 움직이는 동안의 높이를 받는다**: 앱에서 키보드의 움직임을 프레임마다 추적하고, 그때 WebView를 실제로 가리는 높이를 구합니다.
2. **받은 높이로 시트를 바로 배치한다**: 앱의 배치 단위를 CSS px로 바꿔 넣으면 6편의 CSS가 그대로 동작합니다.
3. **시트 제목은 제자리에 두고 가려진 입력칸을 보여 준다.** 키보드가 올라오면 폼이 짧아져 아래쪽 입력칸이 가려질 수 있습니다. 이때 페이지 전체를 밀어 올리면 시트 제목까지 화면 밖으로 나갑니다. 제목은 그대로 두고, 입력칸이 보이도록 폼 안에서 스크롤합니다.
4. **웹페이지가 준비되면 앱이 마지막 키보드 높이를 다시 보낸다.** 키보드가 다 올라왔는데 웹페이지가 그 높이를 아직 받지 못했다고 해 보겠습니다. 키보드가 멈추면 다음 높이도 오지 않아 저장 버튼이 키보드 뒤에 남을 수 있습니다. 그래서 웹페이지가 받을 준비를 마쳤다고 알리는 순간 앱이 저장해 둔 값으로 시트를 맞춥니다.

## 1. 키보드가 움직이는 동안의 높이를 받는다

### 키보드가 움직이는 프레임마다 높이가 들어온다

시트 안의 텍스트 입력칸을 누르면 OS가 키보드를 올립니다. 앱에서는 키보드가 올라오는 동안의 높이를 받으려고 외부 라이브러리인 `react-native-keyboard-controller`를 사용했습니다. 이 라이브러리가 제공하는 훅이 `useKeyboardHandler`입니다. 라이브러리는 Android에서 키보드가 화면 아래를 얼마나 차지하는지 애니메이션 도중에 읽고, iOS에서는 화면 갱신에 맞춰 키보드 움직임을 추적합니다. **키보드 위치가 바뀌는 매 프레임에 `onMove`가 호출되고, 그때의 키보드 높이가 `event.height`에 들어옵니다.**

iOS와 Android 모두 `onStart`에서 받은 도착 높이는 건너뛰고, `onMove`로 들어오는 현재 높이에 시트를 맞춥니다. `onEnd`가 오면 마지막 높이를 한 번 더 적용합니다. 아래 표는 그 과정을 Android에서 기록한 예입니다. 폼 맨 아래의 ‘배송 메모’를 눌러 키보드를 열었고, `onMove`는 처음 몇 값만 골랐습니다.

| 이벤트 | Android에서 측정한 키보드 높이 | iOS·Android 공통 처리 |
| --- | --- | --- |
| `onStart` | 374.48 | 열렸을 때 도착할 높이입니다. 여기서 시트를 올리면 저장 버튼이 먼저 도착하므로 건너뜁니다. |
| `onMove` | 0 → 13.71 → 29.33 → 49.90 → 81.90 → … | 각 높이가 들어올 때마다 키보드 위에 남은 공간을 다시 계산합니다. |
| `onEnd` | 374.48 | 움직임이 끝난 높이로 마지막 배치를 맞춥니다. |

<details>
<summary>앱에서 키보드 이벤트를 받는 코드</summary>

```tsx
import React from 'react';
import {KeyboardProvider, useKeyboardHandler} from 'react-native-keyboard-controller';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {runOnJS} from 'react-native-reanimated';

type KeyboardFrame = {
  kind: 'start' | 'move' | 'end';
  height: number;
  bottomInset: number;
};

function KeyboardProgress({onFrame}: {onFrame: (frame: KeyboardFrame) => void}) {
  const {bottom: bottomInset} = useSafeAreaInsets();

  useKeyboardHandler({
    onStart: event => {
      'worklet';
      runOnJS(onFrame)({kind: 'start', height: event.height, bottomInset});
    },
    onMove: event => {
      'worklet';
      runOnJS(onFrame)({kind: 'move', height: event.height, bottomInset});
    },
    onEnd: event => {
      'worklet';
      runOnJS(onFrame)({kind: 'end', height: event.height, bottomInset});
    },
  }, [onFrame, bottomInset]);

  return null;
}

function NativeKeyboardBridge({children, onFrame}: React.PropsWithChildren<{
  onFrame: (frame: KeyboardFrame) => void;
}>) {
  return (
    <KeyboardProvider statusBarTranslucent navigationBarTranslucent preserveEdgeToEdge preload={false}>
      <KeyboardProgress onFrame={onFrame}/>
      {children}
    </KeyboardProvider>
  );
}
```

앱에서는 `NativeKeyboardBridge` 안에 WebView를 둡니다. 바깥의 `SafeAreaProvider`가 기기 가장자리의 여백을 알려 주므로, 위 코드에서 `useSafeAreaInsets().bottom`으로 하단 여백을 읽어 키보드 높이와 함께 보낼 수 있습니다.

</details>

### WebView를 실제로 가리는 높이를 구한다

키보드는 **기기 화면의 맨 아래**에서 올라옵니다. 그런데 이 앱은 `SafeAreaView`로 화면 아래에 여백을 두었기 때문에 **WebView의 아랫변**은 그보다 위에 있습니다. 아래 그림의 점선이 그 아랫변입니다. 키보드가 점선을 넘어야 웹페이지를 가리기 시작합니다.

```ts
const coveredHeight = Math.max(0, frame.height - frame.bottomInset);
const visibleHeight = Math.max(0, webViewHeight - coveredHeight);
```

![Android 실기기에서 키보드 높이가 81.90이던 한 프레임입니다. 1은 화면 하단을 확대한 모습이고, 2는 같은 순간의 전체 화면입니다.](/css-bottom-sheet-7-keyboard-sync/android-webview-keyboard-overlap.png)

## 2. 받은 높이로 시트를 바로 배치한다

iOS와 Android 모두 키보드가 움직여 `onMove`가 들어올 때마다 앱에서 1번 식으로 남은 높이(`visibleHeight`)를 구해 WebView에 보냅니다. 웹페이지는 받은 값을 CSS px로 바꿔 6편의 시트에 적용합니다. 키보드가 올라오는 동안 제목은 제자리에 있고, 가운데 폼이 줄어들면서 저장 버튼이 키보드를 따라 올라갑니다. 움직임이 끝나면 `onEnd`에서 마지막 높이를 한 번 더 반영합니다.

## 3. 시트 제목은 제자리에 두고 가려진 입력칸을 보여 준다

시트의 높이를 정한 다음에는 키보드를 연 입력칸도 계속 보여야 합니다. Android에서는 WebView가 화면을 통째로 옮기는 동작을 조정했고, iOS에서는 입력칸이 폼 밖으로 밀려나는 만큼 폼 안에서 스크롤했습니다.

### Android에서는 뷰포트 이동을 끈다

2번의 코드는 시트 윗변을 제자리에 두고, 시트 아랫변과 저장 버튼을 키보드 위로 올립니다. 그런데 Android에서는 WebView도 입력칸을 보여 주려고 페이지의 더 아래쪽을 화면에 표시했습니다. 그만큼 시트 전체가 화면에서 더 올라가 보였고, 제자리에 있어야 할 제목까지 화면 위로 사라졌습니다.

웹페이지에서 이 자동 이동을 조정할 때 쓰는 것이 WebView가 제공하는 `navigator.virtualKeyboard`입니다. 현재 WebView에서 이 객체를 사용할 수 있는지 먼저 확인해야 합니다. 이 앱에서는 그 객체의 `overlaysContent`를 `true`로 설정해 키보드가 덮는 공간을 웹페이지가 직접 처리하도록 했습니다. 그러자 같은 입력칸을 눌러도 제목이 제자리에 남았습니다. [MDN의 overlaysContent 설명](https://developer.mozilla.org/en-US/docs/Web/API/VirtualKeyboard/overlaysContent)

```js
const requestedSync = syncKeyboard && !!window.ReactNativeWebView;
const nativeSync = requestedSync && (isIOS || !!navigator.virtualKeyboard);

if (nativeSync && !isIOS) {
  navigator.virtualKeyboard.overlaysContent = true;
}
```

![같은 Android 실기기에서 왼쪽은 overlaysContent를 끈 화면, 오른쪽은 켠 화면입니다. 오른쪽에서 시트 제목 ‘배송 정보’가 보입니다.](/css-bottom-sheet-7-keyboard-sync/android-overlays-content-comparison.png)

### iOS에서는 가려진 거리만 옮긴다

6편에서는 입력칸이 폼 안에 전부 보이면 그대로 뒀습니다. 아래쪽이 조금이라도 가려지면 그때 폼을 스크롤했습니다. 이때 스크롤 거리는 ‘가려진 길이’가 아니라 ‘입력칸의 중심에서 폼의 중심까지의 거리’로 계산했습니다. 예를 들어 입력칸이 5px만 가려져도 두 중심이 60px 떨어져 있다면, 코드는 폼을 한 번에 60px 스크롤하려고 합니다. 7편에서 이 방식을 그대로 쓰면 저장 버튼은 키보드를 따라 조금씩 올라오는데, 입력칸은 한 번에 크게 움직일 수 있습니다.

7편의 iOS 코드는 앱에서 키보드 애니메이션의 현재 높이를 한 프레임씩 받을 때마다 시트 높이를 갱신하고, 곧바로 입력칸과 폼의 경계를 비교합니다. 입력칸이 다 보이는 프레임에서는 스크롤하지 않습니다. 입력칸 아랫부분이 5px 가려진 프레임에서는 폼 안의 내용을 5px만 올립니다. 다음 프레임에서도 새로 가려진 만큼만 올리므로, 입력칸은 저장 버튼 바로 위에서 키보드 움직임을 따라갑니다.

```js
// form은 제목과 저장 버튼 사이의 스크롤 영역이고, input은 입력 중인 칸입니다.
const { top: formTop, bottom: formBottom } = form.getBoundingClientRect();
const { top: inputTop, bottom: inputBottom } = input.getBoundingClientRect();

// 폼이 300px에서 끝나고 입력칸이 310px까지 내려오면 clippedBelow는 10입니다.
// 입력칸이 전부 보이면 두 값 모두 0이므로 스크롤하지 않습니다.
const clippedAbove = Math.max(0, formTop - inputTop);
const clippedBelow = Math.max(0, inputBottom - formBottom);

if (clippedAbove > 0) {
  // 폼 안의 내용을 내려서 입력칸의 윗부분을 보여 줍니다.
  form.scrollTop -= clippedAbove;
} else if (clippedBelow > 0) {
  // 폼 안의 내용을 올려서 입력칸의 아랫부분을 보여 줍니다.
  form.scrollTop += clippedBelow;
}
```

같은 iOS 실기기(iOS 18.6.2, WKWebView)에서 양쪽 모두 7편의 키보드 동기화를 켜고 같은 위치의 쿠폰 코드 입력칸을 눌렀습니다. 왼쪽은 6편의 가운데 정렬을, 오른쪽은 위 코드를 적용했습니다. 키보드가 처음 움직이는 시점을 맞췄습니다. 실제 속도로 한 번 재생한 뒤 같은 구간을 ¼배속으로 다시 보여 줍니다.

<figure>
<video controls playsinline preload="metadata" aria-label="iOS 쿠폰 코드 입력칸의 스크롤 비교. 왼쪽은 가운데 정렬, 오른쪽은 가려진 거리만 이동합니다." src="/css-bottom-sheet-7-keyboard-sync/ios-coupon-scroll-comparison.mp4" style="display:block;width:100%;border-radius:12px"></video>
<figcaption>입력칸과 저장 버튼 사이를 보세요. 처음 스크롤할 때 왼쪽은 폼을 150px 올려 두 요소 사이로 다음 항목인 ‘배송 메모’가 보입니다. 오른쪽은 가려진 35px만 올려 쿠폰 코드가 저장 버튼 바로 위에 남습니다.</figcaption>
</figure>

## 4. 웹페이지가 준비되면 앱이 마지막 키보드 높이를 다시 보낸다

키보드가 다 올라간 직후에 웹페이지가 이벤트 리스너를 등록한다고 가정하겠습니다. 이미 보낸 `end` 이벤트는 새 리스너에 도착하지 않습니다. 키보드가 멈췄으니 다음 `move`도 오지 않아, 시트가 키보드를 닫았을 때의 높이에 그대로 남을 수 있습니다. 그래서 웹은 먼저 리스너를 등록하고 앱에 준비 메시지를 보냅니다.

```js
if (requestedSync) {
  window.ReactNativeWebView.postMessage(JSON.stringify({
    type: 'keyboard-sync-ready',
    supported: nativeSync,
  }));
}
```

두 OS에서 앱은 같은 `onMessage`로 준비 메시지를 받습니다. 메시지가 도착하면 마지막으로 저장한 `move` 또는 `end` 값을 다시 전달합니다.

## 녹화에서 비교한 움직임

각 기기에서 먼저 나오는 영상은 6편처럼 뷰포트 높이로 시트를 배치하고, 다음 영상은 앱에서 받은 키보드 높이로 배치합니다. 두 영상에서 키보드가 올라오기 시작할 때 저장 버튼이 어디에 있는지 비교했습니다.

### Android

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:20px;margin:24px 0">
<figure style="margin:0">
<video controls playsinline preload="metadata" aria-label="Android 뷰포트 높이 조정 영상" src="/css-bottom-sheet-7-keyboard-sync/android-sheet-resize.mp4" style="display:block;width:100%;max-height:480px;border-radius:12px;background:#111"></video>
<figcaption style="margin-top:8px;font-size:14px">뷰포트 높이를 적용하면 저장 버튼이 먼저 올라갑니다.</figcaption>
</figure>
<figure style="margin:0">
<video controls playsinline preload="metadata" aria-label="Android 키보드 동기화 영상" src="/css-bottom-sheet-7-keyboard-sync/android-keyboard-sync.mp4" style="display:block;width:100%;max-height:480px;border-radius:12px;background:#111"></video>
<figcaption style="margin-top:8px;font-size:14px">앱의 진행 높이를 받으면 저장 버튼도 중간 위치를 거칩니다.</figcaption>
</figure>
</div>

### iOS

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:20px;margin:24px 0">
<figure style="margin:0">
<video controls playsinline preload="metadata" aria-label="iOS 뷰포트 높이 조정 영상" src="/css-bottom-sheet-7-keyboard-sync/ios-sheet-resize-overscroll-on.mp4" style="display:block;width:100%;max-height:480px;border-radius:12px;background:#111"></video>
<figcaption style="margin-top:8px;font-size:14px">뷰포트 높이를 적용하면 저장 버튼이 먼저 최종 위치에 도착하고, 키보드가 뒤따라 올라옵니다.</figcaption>
</figure>
<figure style="margin:0">
<video controls playsinline preload="metadata" aria-label="iOS 키보드 동기화 영상" src="/css-bottom-sheet-7-keyboard-sync/ios-keyboard-sync.mp4" style="display:block;width:100%;max-height:480px;border-radius:12px;background:#111"></video>
<figcaption style="margin-top:8px;font-size:14px">제목은 같은 자리에 남고 아랫변과 저장 버튼이 움직입니다.</figcaption>
</figure>
</div>

여기까지 적용하면서 확인된 한계점은 다음과 같습니다.

## 1편부터 7편까지 확인한 한계점

- **iOS Safari의 툴바 보정값.** 2편에서는 시트가 툴바 뒤로 완전히 사라지도록 React Aria의 식 `100lvh - 100svh + 58px`을 썼습니다. 이 중 `58px`을 어떻게 정했는지는 확인하지 못했습니다. iPhone 한 대의 측정 사례로 비슷한 값을 설명할 수는 있지만, 다른 기기나 주소창 설정에서도 그만큼 여백을 더하면 충분한지는 검증하지 못했습니다.

- **배경과 모서리 애니메이션의 브라우저 지원.** 4편의 효과는 시트가 화면에 얼마나 들어왔는지를 CSS 애니메이션의 진행률로 쓸 수 있어야 합니다. 스크롤 스냅으로 시트를 여닫을 수 있는 브라우저에서도 `animation-timeline`이나 `timeline-scope`를 지원하지 않으면 배경의 밝기와 모서리 모양이 손가락을 따라 바뀌지 않을 수 있습니다. 데모에는 대체 애니메이션을 넣지 않았습니다.

- **일반 브라우저에서의 키보드 동기화.** 7편은 React Native 앱이 `onMove`로 받은 키보드 높이를 WebView에 보내야 동작합니다. 일반 모바일 브라우저에는 OS 키보드의 실제 위치를 매 프레임 알려 주는 표준 API가 없습니다. `requestAnimationFrame`으로 `visualViewport.height`를 매번 읽어도 이미 최종값으로 바뀌었다면 중간 위치는 알 수 없습니다. 이 데모는 일반 브라우저에서 열거나 Android WebView에서 `navigator.virtualKeyboard`를 쓸 수 없을 때 6편 방식으로 동작합니다.

## 시리즈를 마치며

여기까지 오는 데 꽤 오래 걸렸습니다. 처음 궁금했던 건 터치 이벤트를 직접 처리하지 않고도 손가락으로 시트를 끌어내릴 수 있느냐는 것이었습니다. 마지막에는 실기기 녹화 영상을 느리게 돌려 보면서 저장 버튼이 키보드보다 먼저 올라가는 순간까지 들여다봤습니다.

그 짧은 움직임을 맞추려고 앱에서 키보드 높이를 받아 웹에 보내고, 입력칸이 가려질 때 폼을 얼마나 스크롤할지도 따로 정했습니다. 이제는 폼의 배치를 바꿀 때 웹페이지만 열어 봐서는 그 동작까지 확인하기 어렵습니다. 앱을 띄워 두 기기에서 키보드를 열어 봐야 합니다. 그렇게 확인하고도 Safari의 툴바 보정값처럼 다른 환경에서 다시 살펴봐야 할 부분이 남았습니다.

앞에서 본 한계도 있고 구현도 복잡한 만큼, 실제 화면에서 이 동작이 꼭 필요한지 먼저 따져봐야 합니다. 6편만으로도 키보드가 다 올라온 뒤에는 저장 버튼을 누를 수 있었습니다. 7편에서는 키보드가 올라오는 동안에도 버튼이 그 위를 따라가게 했습니다. 키보드와 저장 버튼의 움직임을 맞추는 데만 해도 앱과 웹 양쪽에 코드가 필요했습니다. 실제 서비스라면 그 짧은 움직임을 위해 양쪽 코드를 계속 관리할 만큼 차이가 큰지도 생각해 봐야겠습니다.
