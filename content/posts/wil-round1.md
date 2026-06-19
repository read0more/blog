---
title: "[WIL] Round1 - 코드 리뷰 & AI 협업 환경 구축"
date: "2026-06-18T13:00:00.000Z"
description: "1주차를 진행하면서 배운것들"
category: "WIL(LOOP:PAK frontend)"
---

## 🧠 이번 주에 새로 배운 것

- 그동안 ESLint는 Next·Vite 스캐폴딩이 깔아주는 설정을 그대로 써 왔다. 이번엔
  `pnpm create @eslint/config`부터 직접 짜보면서, 그냥 warn이나 error가 나오면 이런 게 있네? 하고 확인하는 정도였지,
  이번에 처음으로 내가 쓰던 설정 안에 사실 어떤 룰이 켜져 있었는지 들여다봤다.
- Next·Vite에서 ESLint 설정 파일을 TS로 안 하는 이유.

## 💭 고민 점들

- 솔직하게 제일 찔린 건 `react-hooks/exhaustive-deps`였다. 스캐폴딩이 기본으로 `warn`을
  주길래 나도 별생각 없이 warn으로 뒀었다. 그런데 이 룰 위반은 대부분 진짜 버그가 일어나기 쉽다(stale
  closure). 심지어 예전에 AI가 의존성 배열을 빠뜨리는 걸 직접 본 적이 있었는데도, 그땐 error로 격상할 생각을 안 하고 "돌아는 가네?" 하고 넘겼었다.
  스캐폴딩을 그대로만 쓴다는 게 곧 "내가 판단하지 않고 있었다"는 뜻이었구나 싶었다.
- TS config을 두고도 고민했다. 처음엔 "설정도 타입 안전하게 `.ts`로 쓰는 게 당연히 좋지
  않나" 했는데, lint를 돌려보니 바로 에러가 났다. 해결 자체는 쉬웠다.([내가 확인한 과정](/posts/eslint-flat-config-custom-rule-husky/#ts-config%EC%9D%84-%EC%8B%A4%EC%A0%9C%EB%A1%9C-%EB%8F%8C%EA%B2%8C-%EB%A7%8C%EB%93%9C%EB%8A%94-jiti)) 다른 프레임워크들이 왜 굳이 `.ts`를 안 쓰는지 찾아보면서 생각이 바뀌었다. `.js` + `// @ts-check` 만으로도 자동완성·타입체크가 다 되니, 설정 파일을 `.ts`로 바꾸는 건 결국 불필요하다는 생각이 들어 `.js`로 되돌렸다.
- lint에서 다음과 같은 워닝이 발생했다 `Warning: React version not specified in eslint-plugin-react settings`. 확인해보니 일반적으로는 `settings: { react: { version: "detect" } }`으로 버전을 감지 할 수 있음을 확인하여 처음에는 detect로 시도하였으나 lint시 확인해보니 `TypeError: Error while loading rule 'react/display-name': contextOrFilename.getFilename is not a function` 에러가 발생하였다. 확인해보니 eslint의 deprecated 상태였던 getFilename 메서드가 eslint v10에서 제거되면서 동작하지 않음을 확인했다 [문서](https://eslint.org/blog/2026/02/eslint-v10.0.0-released/). 별 수 없이 "19.2"로 직접 지정하였다.

## 🤔 아쉬웠던 점
- `@eslint/js`의 `recommended`를 조금씩 읽어보는 것만 해도 생각보다 시간을 잡아먹어서 다른 룰의 커스텀을 그다지 적극적으로 넣었으면 좋았을 것 같다.
- CLAUDE.md의 AI 컨벤션을 사실상 루프팩 발제 주제에 있는 예시를 그대로 쓰고 나누기만 했는데, 다른 좋은 케이스들도 찾아서 합쳐 봤으면 좋알을 것 같다.
