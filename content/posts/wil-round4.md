---
title: "[WIL] Round4 - 두 헤드리스 UI, 그리고 놓친 중첩 Dialog"
date: "2026-07-12T13:00:00.000Z"
description: "4주차를 진행하면서 배운것들"
category: "WIL(LOOP:PAK frontend)"
---

이번 주차의 작업 자체는 별도의 글로 자세히 정리했다 — [두 헤드리스 UI — 훅+prop getter Select와 Compound Dialog](/blog/posts/headless-select-compound-dialog/). Select는 훅+prop getter로, Dialog는 Compound로 라이브러리를 참고해 직접 구현했고, 그 과정에서 내린 설계 판단과 잡은 실수를 담았다. 여기서는 새로 배운 것·고민한 것·발제에서 드러난 놓친 것만 짧게 WIL 형식으로 남긴다.

## 🧠 이번 주에 새로 배운 것

- 헤드리스 UI 라이브러리를 따로 써 본 적이 없어 hook(Select)·compound(Dialog) 형식을 하나씩 직접 만들어 보며 차이를 확인해 보았다.
- downshift·Radix 코드를 벤치마킹하면서 익혔다. Select의 prop getter들은 downshift getter에 하나씩 대응시켰고(바깥클릭 경계용 `getBoundaryProps`는 downshift hooks엔 없어 직접 확장), Dialog의 compound+Context·asChild/Slot 구조는 Radix를 따라가며 배웠다.

## 💭 고민 점들
- downshift는 `optionToKey`가 optional(참조 동등성 fallback)이지만, React Query `refetchOnWindowFocus` 등으로 새 객체가 온다면 선택이 조용히 풀린다 — 그래서 downshift처럼 optional로 둘지 고민했지만 결국 **필수**로 바꿨다.
- AI 초안에서 생각보다 구멍이 꽤 존재했다. 스크롤 잠금을 `body`에 걸었지만 Next 보일러플레이트 `overflow-x: hidden` 탓에 실제 컨테이너는 `html`이라 안 먹던 것, 스크롤바 폭만큼 덜컹거리던 것, `pointerdown` 하나면 될 걸 `mousedown`·`touchstart`로 나눠 걸던 것 등.


## 🤔 놓친 것 — 중첩 Dialog

다중 Dialog는 FE 입장에서 되도록 피하고 싶은 구조지만, **정말 구현해야 하는 경우**가 있다는 것을 다음 주 발제 피드백에서 받았다. 안쪽을 닫아도 바깥은 열려 있어야 하니 배경 스크롤은 계속 잠겨 있어야 하고, Esc는 가장 위 Dialog 하나만 닫아야 한다.

내 구현은 Dialog 하나만 열 때는 잘 돌았지만, 여러 개를 열면 **Esc 한 번에 열린 게 전부 닫히고, 먼저 연 것을 닫으면 아직 열린 게 남았는데도 배경 스크롤이 풀렸다.** 각 Dialog가 `html`/`body` 스타일과 `document` keydown을 서로 모른 채 자기 것만 저장·복원했기 때문이다.

이 부분을 과제 피드백 시 알게 된 **`useImperativeHandle`로 각 Dialog가 `close()` 같은 명령형 핸들을 ref로 밖에 노출하게 해서** 해결했으면 좋았을 것이다. 처음부터 "Dialog 하나"만 상정하고 만든 부분이 다시 생각해도 아쉬운 부분이다.
