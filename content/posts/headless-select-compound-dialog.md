---
title: "두 헤드리스 UI — 훅+prop getter Select와 Compound Dialog"
date: "2026-07-10T13:00:00.000Z"
description: "두 헤드리스 UI 구현 Select는 훅+prop getter로, Dialog는 Compound로 라이브러리 직접 구현. 그 과정에서 내린 설계 판단과 잡은 실수의 기록."
category: ["React"]
---

## Overview

select와 dialog는 흔하게 사용하는 UI이다. 이번엔 라이브러리를 참고하여 조금 라이트하게 두 가지를 직접 구현했다 — **Select는 훅+prop getter**, **Dialog는 Compound**. 두 컴포넌트 모두 controlled/uncontrolled를 겸하도록 만들었다. 아래는 "어떻게 만들었나"보다 **왜 그렇게 설계했나**에 대한 기록이다. 대부분은 설계 판단이고, 그중 몇 개는 AI에게 초안을 맡긴 뒤 직접 화면을 돌려 보다 잡은 것이다.

## Select — 로직 한 벌, 생김새는 사용처가

`useSelect` 훅은 DOM을 렌더하지 않는다. 상태와 getter만 반환한다. 이는 [Downshift](https://github.com/downshift-js/downshift/tree/master/src/hooks/useSelect)를 참고하였다.

```ts
const { isOpen, selectedOption, getTriggerProps, getListProps, optionItems } = useSelect({ ... });
```

이 구조를 통하여 로직만 있고 UI는 사용자에게 맡길 수 있다. 마크업이 완전히 다른 세 옵션 UI가 모두 같은 훅 한 벌 위에서 돈다. 옵션의 열림/닫힘, 키보드 이동, state는 훅이 쥔다(uncontrolled일 때만). 이를 위해 사용처는 `getTriggerProps()`, `getListProps()`, `getOptionProps()`를 spread하여 훅에서 처리하는 이벤트들을 할당한다. 

![useSelect로 로직은 공통으로 사용하고, 마크업만 다른 세 UI](/headless-select-compound-dialog/select.jpg)

### `optionToKey`를 필수로 강제한 이유

downshift는 key 함수가 optional이고, 없으면 참조 동등성(`===`)으로 선택을 판별한다. 나는 이걸 **필수**로 바꿨다.

```ts
/** 같은 옵션이 새 객체로 와도 선택이 유지되도록, 참조 동일성(===) 대신 이 키로 비교한다. */
optionToKey: (option: T) => unknown;

const selectedIndex = selectedOption === null ? NOT_FOUND
  : options.findIndex(o => optionToKey(o) === optionToKey(selectedOption));
```

참조 동등성만 믿으면 눈에 잘 안 띄는 버그가 난다. 예컨대 React Query `refetchOnWindowFocus`로 옵션 목록을 다시 받아오면, **내용은 같지만 새 객체**가 들어올 수도 있다. 그 순간 `===`는 깨지고 선택이 조용히 풀린다. key 함수를 필수로 받아 두면 매 렌더 새 배열/객체가 와도 선택이 유지된다. optional로 두면 **"안 넘겨도 되는데 안 넘기면 가끔 터지는"** 함정이 그대로 남는다 — 그래서 강제했다.

### controlled / uncontrolled 이중 API

Select도 Dialog도 controlled/uncontrolled를 겸한다. 여기엔 판단이 하나 깔려 있다.

> 바깥에서 상태를 알아야 하면 controlled다. 예를 들어 compound로 조립한 모달인데 트리거가 여기저기 흩어져 있으면 compound만으론 부족해 바깥(controlled)에서 관리해야 한다. 다만 설계 시점과 실제 사용이 달라질 수 있어 보통 둘 다 지원한다.

그래서 **prop 유무로 런타임에 판별**하게 했다. `open`(또는 `selectedOption`)이 `undefined`면 uncontrolled로 내부 state를 쓰고, 값이 있으면 controlled로 부모 값을 따른다.

```ts
function useControllableState<T>(controlledValue: T | undefined, defaultValue: T) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const setValue = (next: T) => { if (!isControlled) setUncontrolledValue(next); };
  return [value, setValue] as const;
}
```

위의 함수를 통하여 controlled/uncontrolled 시의 state를 처리했다. controlled 데모에선 부모가 `open`과 `selectedOption`을 소유하고 state를 조작한다.

한 가지 덧붙이면, 열림/닫힘 시 하이라이트 리셋은 [렌더 중 prop 바뀔 때 state 조정](https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)하는 패턴으로 처리했다.

```ts
const [isOpen, setIsOpen] = useControllableState(open, defaultOpen);
const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
if (isOpen !== prevIsOpen) {
  setPrevIsOpen(isOpen);
  setHighlightedIndex(isOpen ? computeHighlightStartIndex() : NO_HIGHLIGHT);
}
```

controlled로 부모가 `open`을 직접 밀어 이벤트 핸들러를 우회해도 리셋이 걸리고, effect 대신 렌더 중 조정이라 깜빡임도 없다.

### 바깥 클릭 닫힘과 `getBoundaryProps`

바깥을 누르면 닫혀야 한다. 훅은 document `pointerdown`을 듣다가, 누른 지점이 트리거·리스트 **안**이 아니면 닫는다.

문제는 controlled로 쓸 때다. 열림을 조종하는 컨트롤이 트리거·리스트 DOM **밖**에 있으면, 훅은 그 클릭을 "바깥"으로 오인해 닫아버린다. 열림/닫힘 토글 버튼이 열림을 토글하면 → 훅이 먼저 닫고(`pointerdown`) → 이어진 `click`이 다시 열어, "닫혔다 곧바로 다시 열림"으로 싸운다.

그래서 세 번째 "안쪽" 후보인 `boundaryRef`를 뒀다. 리스트 밖 요소에 `getBoundaryProps()`를 spread하면 훅이 그 노드에도 ref를 주입해 containment 검사에 함께 넣게 하였다. 이렇게 하면 그 안쪽 클릭은 더 이상 바깥이 아니다.

```ts
const isInsideTrigger = triggerRef.current?.contains(target) ?? false;
const isInsideList = listRef.current?.contains(target) ?? false;
const isInsideBoundary = boundaryRef.current?.contains(target) ?? false;
if (!isInsideTrigger && !isInsideList && !isInsideBoundary) closeOnOutside();
```

![boundaryRef를 이용하여 수정 전까진 상단의 리스트 닫기 버튼을 클릭 시 위에서 설명한 문제가 터졌다.](/headless-select-compound-dialog/boundaryRef.jpg)

ref를 소비자에게 노출하지 않고 getter로 주입하는 건 `getTriggerProps`/`getListProps`와 같다(소비자가 ref를 만들 필요가 없다). 트리거가 곧 열림 컨트롤인 평범한 select엔 필요 없어서 downshift에도 대응 API가 없는 것으로 보였지만 데모를 구성하면서 직접 해당 패턴을 구현해보는 좋은 기회가 되었다.

## Dialog — Compound로 조립하고, 닫힘·잠금은 안에서

Dialog는 `Trigger` / `Overlay` / `Content` / `Title` / `Description` / `Close`로 조립하는 Compound로 구현하였다. asChild를 사용하여 사용자가 원하는 HTML 구조로 그려줄 수 있게 해주는 부분은 [Radix](https://www.radix-ui.com/primitives/docs/components/dialog)를 보고 참고하였다.

```ts
Dialog.Trigger = DialogTrigger;
Dialog.Overlay = DialogOverlay;
Dialog.Content = DialogContent;
// ... Title / Description / Close
```

각 `Trigger` / `Overlay` / `Content` / `Title` / `Description` / `Close`들은 사용처가 자기 JSX 안 **원하는 자리에 흩어** 놓는다. 그런데 이들은 **하나의 열림 상태를 함께 봐야** 한다 — `Trigger`가 열고, `Overlay` 클릭이 닫고, `Content`·`Overlay`는 열렸을 때만 그려진다. 사용처가 조각을 자유롭게 배치하는 이상 부모가 props로 상태를 내려줄 방법이 없다. 그래서 상태를 Context를 사용하여 공유했다.

나머지는 Dialog가 안에서 책임진다 — Portal로 `document.body`에 삽입하고, Esc·오버레이 클릭으로 닫히며, 열려 있는 동안 배경 스크롤을 잠근다.

### 스크롤 잠금은 body가 아니라 html에

여기서 AI에게 맡긴 초안을 직접 돌려 보다 AI가 못 잡은 부분이 있었다. 배경 스크롤 잠금을 **body**에 걸어 뒀는데, 아무리 걸어도 배경이 계속 스크롤됐다. create-next-app 기본 globals.css의 `overflow-x: hidden` 탓에 실제 스크롤 컨테이너가 body가 아니라 **html(viewport)**이었기 때문이다. 대상을 html로 변경하여 간단하게 수정했다.

또한 AI가 스크롤바가 사라지며 그 폭만큼 콘텐츠가 오른쪽으로 밀리는 덜컹거림을 고려하지 않았다. 잠그기 직전에 스크롤바 폭을 재서 `body`에 `paddingRight`로 채워 상쇄했다.

```ts
useEffect(() => {
  if (!isOpen) return;
  const html = document.documentElement;
  const scrollbarWidth = window.innerWidth - html.clientWidth;   // 잠그기 전 측정
  const previousOverflow = html.style.overflow;
  const previousPaddingRight = document.body.style.paddingRight;
  html.style.overflow = "hidden";
  if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;  // 덜컹 방지
  return () => {
    html.style.overflow = previousOverflow;
    document.body.style.paddingRight = previousPaddingRight;
  };
}, [isOpen]);
```

### asChild + Slot으로 태그를 소비자에게

처음엔 `Content`는 `div`, `Title`은 `h2`처럼 태그를 고정해 뒀다. 그런데 Trigger를 `<a role="button">`으로 쓰거나 Title을 `<h1>`로 쓰는 등 자유도를 주기 위해 Radix의 asChild 패턴을 참고하여 적용하였다.

```ts
// asChild면 자식 태그를 그대로 쓰고(Slot), 아니면 기본 태그로 렌더한다
function DialogTrigger({ asChild, onClick, ...props }: ButtonProps) {
  const { setOpen } = useDialogContext();
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    setOpen(true);
  };
  const Comp: ElementType = asChild ? Slot : "button";
  return <Comp {...(asChild ? {} : { type: "button" })} onClick={handleClick} {...props} />;
}

// Slot: 자식 엘리먼트를 복제하며 주입 props를 얹는다
function Slot({ children, ...slotProps }: { children: ReactNode } & UnknownProps) {
  if (!isValidElement(children)) {
    throw new Error("asChild 를 쓰면 React 엘리먼트를 자식으로 넘겨야 한다.");
  }
  const childProps = isRecord(children.props) ? children.props : {};
  // 자식 태그는 그대로 두고 props만 병합해 갈아끼우는 게 asChild의 핵심
  return cloneElement(children, mergeProps(slotProps, childProps));
}

// mergeProps: 주입분(slot)과 자식 원본 props를 합친다
function mergeProps(slotProps: UnknownProps, childProps: UnknownProps): UnknownProps {
  const merged: UnknownProps = { ...slotProps };
  for (const key of Object.keys(childProps)) {
    const slotValue = slotProps[key];
    const childValue = childProps[key];
    if (/^on[A-Z]/.test(key) && isFunction(slotValue) && isFunction(childValue)) {
      // 이벤트 핸들러: 자식 먼저 → 주입 나중. 둘 다 산다
      merged[key] = (...args: unknown[]) => { childValue(...args); slotValue(...args); };
    } else if (key === "className") {
      merged[key] = [slotValue, childValue].filter(Boolean).join(" "); // 이어붙임
    } else if (key === "style") {
      const slotStyle = isRecord(slotValue) ? slotValue : {};
      const childStyle = isRecord(childValue) ? childValue : {};
      merged[key] = { ...slotStyle, ...childStyle }; // 병합
    } else {
      merged[key] = childValue; // 그 외는 자식 우선
    }
  }
  return merged;
}
```

여기서 핸들러 충돌을 다뤄야 했다. 소비자가 `<a onClick={preventDefault}>`를 넘기고 Dialog도 열기 핸들러를 얹으면 둘 다 살아야 한다. `mergeProps`가 **자식 핸들러 먼저, 주입 핸들러 나중** 순으로 합성하고, `className`은 이어붙이고 `style`은 병합한다.

## AI가 놓친 디테일

AI가 대체적으로 지시대로 잘 짜주지만 여전히 디테일한 부분을 자주 놓치는 부분들이 있었다. 스크롤 잠금(body→html) 말고도:

- 여기서 필요한 판정은 "포인터가 위젯 밖에서 눌렸는가"뿐이고, `pointerdown`은 마우스·터치·펜을 한 이벤트로 묶어 발생시키므로 리스너 하나면 충분하다고 판단하였다. 그런데 AI는 마우스용(`mousedown`)·터치용(`touchstart`)을 따로 걸었기 때문에 `pointerdown` 하나로 합쳤다.
- 매직넘버 다수 사용, 클라이언트 컴포넌트일 필요가 없는 컴포넌트에도 `"use client"` 붙임

## 회고

사실 headless UI 라이브러리를 따로 써 본 적이 없었다. 그래서 hooks 형식(Select)과 compound 형식(Dialog)과 같이 다른 식으로 구현 방식에 차이가 있는지 몰랐고, 하나씩 직접 구현해 두 방식을 나란히 놓고 보니 결이 확실히 달랐다.

compound는 라이브러리가 조각(`Dialog.Trigger`·`Content`…)을 렌더하고 소비자는 그걸 선언적으로 조립한다 — 진입은 쉽지만 정해진 구조를 벗어나려면 `asChild` 같은 문을 따로 열어 줘야 한다. hook은 반대로 DOM을 아예 그리지 않고 상태·동작만 넘겨, 소비자가 getter를 spread해 자기 마크업을 그린다 — 렌더를 완전히 통제하는 대신 보일러플레이트가 늘고, 새 요구가 생기면 `getBoundaryProps`처럼 API 표면이 자라기도 한다. 결국 **로직과 표현의 경계를 어디에 긋고, 그걸 어떤 모양으로 노출하느냐**의 차이라고 생각했다.

그럼 어느 쪽을 언제 고르는 게 좋을까. **구조가 대체로 고정이고, 팀이 함께 쓰는 디자인 시스템처럼 "같은 모양으로 여러 곳에" 배포할 컴포넌트라면 compound**가 낫다고 생각했다. — 소비자는 조각을 선언적으로 조립만 하면 되고, 접근성·이벤트 배선을 라이브러리가 숨겨 주니 잘못 쓸 여지가 적다. 

반대로 **마크업이 매번 달라지거나, 로직만 재사용하고 껍데기는 자유롭게 그려야 한다면 hook**이라 생각했다. 물론 compound에도 `asChild`가 있어 "그럼 태그 바꾸는 자유는 compound도 되잖아?" 싶을 수 있다. 하지만 `asChild`는 **정해진 슬롯(Trigger·Content…)의 겉 태그를 갈아끼우는** 수준이지, 위젯의 속 구조 자체를 새로 짜는 건 아니다 — 조각의 종류와 배치라는 뼈대는 여전히 라이브러리가 쥐고 있다. hook은 아예 DOM을 안 그리니 소비자가 **트리를 통째로** 원하는 대로 세운다.

compound는 Context·Slot·mergeProps 같은 다소 복잡한 구현을, hook은 소비자가 getter를 빠뜨리면 동작·접근성이 조용히 사라진다. 그래서 단순한 버튼·토글까지 헤드리스로 만들 필요는 없고 평범한 props가 답일 때가 많다는 말에도 고개가 끄덕여졌다. 짧게 정리하자면 나는 **생김새가 고정이냐 유동이냐를 1차 기준으로 두고, 그다음 "소비자에게 실수 없이 넘기고 싶으면 compound, 통제권을 완전히 주고 싶으면 hook"으로 보기로 했다.**

## 참고 자료

- [Downshift — useSelect](https://github.com/downshift-js/downshift/tree/master/src/hooks/useSelect)
- [Radix UI — Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- [React — You Might Not Need an Effect: 프롭이 바뀔 때 state 조정](https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
