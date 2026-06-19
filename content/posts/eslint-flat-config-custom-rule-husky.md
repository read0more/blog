---
title: "ESLint flat config을 처음부터 짜면서 알게 된 것들 — TS config, 커스텀 룰, 그리고 훅"
date: "2026-06-17T22:00:00.000Z"
description: "스캐폴딩이 만들어 준 flat config을 그대로 두지 않고, TS로 다시 쓰고 커스텀 룰을 붙이고 git hook까지 끼우면서 한 고민들."
category: "빌드도구"
---

## Overview

그동안 ESLint는 Next.js·Vite 스캐폴딩이 만들어 주는 설정을 그대로 써 왔다. 동작은 했지만 정작 그 안에 어떤 룰이 켜져 있는지, 내가 원하는 룰은 어떻게 더하는지는 모른 채였다. 이번엔 그걸 직접 해 보기로 했다. 그와 더불어 husky + lint-staged를 조합하여 룰을 강제하고, AI가 우회하지 못하게 CLAUDE.md에 주의사항을 추가하여 하네스를 구성해 보았다.

크게 두 축으로 진행했다.

1. **기계적 하네스** — ESLint에 husky + lint-staged를 엮어 커밋시점에 lint검사 강제, 푸시 시점에 build하여 build 통과 못하면 푸시 하지 못하게 강제
2. **CLAUDE.md** — AI가 lint를 우회하는 코드를 쓰지 못하도록 규칙으로 통제

## 기계적 하네스의 설정

### ESLint

```bash
pnpm create @eslint/config@latest
```

ESLint 자체에서도 스캐폴딩을 지원해 주며 Vite+TS+React+pnpm 환경에서의 설정에 맞게 옵션은 이렇게 골랐다.

- What do you want to lint: **JavaScript + CSS**
- How would you like to use ESLint?: **To check syntax and find problems**
- What type of modules does your project use?: **JavaScript modules (import/export)**
- Which framework does your project use?: **React**
- Does your project use TypeScript?: **Yes**
- Where does your code run?: **Browser**
- Which language do you want your configuration file be written in?: **TypeScript**

스캐폴딩이 끝나면 `eslint.config.ts`가 추가되고 devDependencies에는 이런 것들이 생긴다.

```json
{
  "@eslint/css": "^1.3.0",
  "@eslint/js": "^10.0.1",
  "eslint": "^10.5.0",
  "eslint-plugin-react": "^7.37.5",
  "globals": "^17.6.0",
  "typescript-eslint": "^8.61.1"
}
```

여기까지가 ESLint에서 해주는 스캐폴딩의 끝이지만... lint를 돌려보면 곧바로 문제가 발생하였다.

#### TS config을 실제로 돌게 만드는 jiti

스캐폴딩 시 config 파일을 TS로 쓰기로 한 순간 새 문제가 생겼다. ESLint는 Node가 `import()`로 config 파일을 불러오는데, Node 입장에서 TypeScript는 그냥 문법 오류다. 첫 실행에서 바로 깨졌다.

해결은 단순했다.

```bash
pnpm add -D jiti
```

`jiti`는 런타임에서 TS/ESM을 즉석에서 변환해 주는 로더다. 깔아 두면 ESLint가 TS config을 자연스럽게 읽는다. 여기서 든 의문점은 생각보다 설정이 번거롭지도 않은데 왜 Next.js에서는 .mjs로 만들어주고, Vite에서는 .js로 만들어 주는 걸까? 하는 생각이 들어 확인해보니

**설정 파일을 ts로 만드는 이점이 크지 않다.**

- .js여도 에디터는 타입 정보만(*.d.ts) 발견하면 자동완성이 지원된다. 심지어 파일 상단에 `// @ts-check`주석을 달아주면 타입체크도 해준다. 이런 상황에서 굳이 설정 파일을 .ts로 할 메리트가 크지 않다고 생각되어서 js 파일로 변경하였다.

#### globals.browser — `no-undef`를 피하기 위한 선언

처음에 의미가 모호했던 건 `languageOptions.globals` 였다.

```ts
languageOptions: { globals: globals.browser }
```

이게 없으면 `console.log(window)` 같은 코드가 `no-undef`에서 에러로 잡힌다. ESLint는 코드만 보고 있을 뿐, 이 코드가 어디서 실행되는지를 모르기 때문이다. `globals.browser`는 "이 환경에는 `window`, `document`, `console` 같은 게 이미 정의돼 있다"고 ESLint에게 알려주는 사전 같은 역할이었다. 노드 스크립트라면 `globals.node`를 함께 깔아야 하고, 둘이 섞이면 둘 다 넣어줘야 한다.

#### React 17+ — 알아서 꺼주던 룰을 직접 끄기

이전에는 Vite/Next 템플릿이 알아서 해 주던 일이라 의식한 적이 없었는데, 이번에 직접 ESLint를 적용해 보면서 처음 부딪쳤다.

```ts
// before — 새 파일을 만들 때마다 import React 안 했다고 잡힘
// 'React' must be in scope when using JSX  react/react-in-jsx-scope
```

React 17부터 자동 JSX runtime이 들어와서 `import React from "react"`가 더 이상 필요 없지만 `react/react-in-jsx-scope`는 그 사실을 모른다. `eslint-plugin-react`의 `flat["jsx-runtime"]` 설정이 이 룰들을 한 번에 꺼주기 때문에, 직접 적기보다는 설정을 그대로 활용하는 방법으로 갔다.
해당 사실은 [react/react-in-jsx-scope에 대한 가이드 문서](https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/react-in-jsx-scope.md)를 보고 알게 되었다.

```ts
// after
{ files: ["**/*.{jsx,tsx}"], ...pluginReact.configs.flat["jsx-runtime"] },
```

#### CSS 룰 — 잡고 싶은 것과 잡고 싶지 않은 것

`@eslint/css`의 `css/recommended`를 그대로 켰더니 여기서도 lint에서 문제가 발생했다.

첫째, `css/no-invalid-properties`가 CSS 변수까지 모르는 속성으로 잡아서 lint error가 발생했다. `index.css`에서 전역적으로 선언한 css 변수를 App.css에서 사용한건데 모른다고 나온 것이다. 하지만 전역적으로 선언한 변수를 다른 css에서 쓸 일은 디자인 시스템에서도 흔하다고 생각되어 아래와 같이 옵션 하나로 변수에 대해서만 검사를 풀어 줬다.

```ts
"css/no-invalid-properties": ["error", { allowUnknownVariables: true }],
```

둘째, `css/use-baseline`을 어디까지 켤지 고민했다. `Selector 'nesting' is not a widely available baseline feature`와 같은 lint에러가 발생했다. 처음엔 `{ available: "newly" }`를 추가하여 nesting도 허용할까 했으나 [문서](https://github.com/eslint/css/blob/main/docs/rules/use-baseline.md) 확인 결과 기본 값인 `widely`는 **최소 30개월 이상 주요 브라우저에서 안정적으로 지원된 기능만 사용한다는 의미였다**. 이 룰을 풀어 버리면 css nesting 외에도 다른 최신 css 사용 시 풀어준다는 의미이니, 누군가의 브라우저에선 깨질 가능성이 높다고 판단했다. 결국 옵션을 따로 주지 않고 기본값에 맡기는 쪽으로 갔다.

#### `recommended`에 없는 것들 — 커스텀 룰 플러그인을 직접

`@eslint/js`의 config는 두 가지를 제공한다. ESLint측에서 기본적으로 추천하는 `recommended`, JS와 관련된 모든 룰을 켜는 `all`. `all`을 켜기엔 너무 빡빡해지고, `recommended`만 쓰기엔 느슨하다. 그렇기에 그 사이를 내 기준으로 채워 볼 수 있는 작은 플러그인을 하나 만들었다.

```ts
// customLint.ts
import type { ESLint } from "eslint";

const plugin: ESLint.Plugin = {
  meta: { name: "customLint", version: "1.0.0" },
  configs: {
    all: {
      name: "customLint/all",
      rules: {
        "no-eval": "error",
        "no-console": "error",
      },
    },
  },
};

export default plugin;
```

우선 all에만 있는 rule 중 바로 눈에 띄는 2가지를 시험 삼아 넣어보았다. `no-eval`은 보안 측면에서 한 번 들어가면 사실상 사고로 이어지는 종류라 우선 골랐다. `no-console`은 디버깅의 흔적을 운영 코드에 남기지 않기 위해서다(실제로 이건 lint가 적용 안 되어 있던 환경에서 정말 많이 실수했던 부분이다).

`flat config`에서는 이렇게 넣었다.

```ts
{
  files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  plugins: { js, customLint },
  extends: ["js/recommended", "customLint/all"],
  languageOptions: { globals: globals.browser },
},
```

#### react-hooks/exhaustive-deps — warn에서 error로

```ts
// after
{
  files: ["**/*.{jsx,tsx}"],
  rules: { "react-hooks/exhaustive-deps": "error" },
},
```

기본은 warn이지만, AI가 자주 실수하는 부분이기도 하고, 이 룰의 위반은 보통 진짜 버그(stale closure)와 관련된 부분이라 error로 격상하였다.

<details>
<summary>흔하게 일어나는 stale closure케이스</summary>

```tsx
function Timer() {
  const [count, setCount] = useState(0);
  const [increment, setIncrement] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      // interval 콜백이 마운트 시점을 캡처했기 때문에 count=0, increment=1로 고정된다.
      // 따라서 언제나 setCount(1)이 호출됨
      setCount(count + increment);
    }, 1000);
    return () => clearInterval(id);
  }, []); // ESLint warn: count, increment 누락
}
```
</details>

### husky + lint-staged 적용 — git hook에 연결하여 강제하기

여기까지의 설정은 "내가 lint 명령을 직접 칠 때만" 도는 상태이므로 이를 강제하기 위해 Husky로 git hook을 걸고, git staged 상태인 파일들만 검사할 수 있게 lint-staged를 활용하였다.

```bash
pnpm exec husky init
```

설치하면 husky에서 `package.json`의 `prepare` 라이프사이클에 husky가 git hook 설정을 해주므로 동료가 클론해서 의존성 설치를 하면 연결된다.

hook은 pre-commit에서 lint체크를 강제하고, pre-push에서는 build를 시켜 빌드가 실패하면 push가 안되도록 하였다.

```bash
# .husky/pre-commit
pnpm exec lint-staged

# .husky/pre-push
pnpm build
```

```jsonc
// .lintstagedrc - lint-staged 대상 확장자 및 어떤 작업을 할지 설정
{
  "*.{js,mjs,cjs,ts,mts,cts,jsx,tsx,css}": ["eslint --fix"]
}
```

pre-push에 build를 추가한 이유는 실수로 빌드조차 안되는 불완전한 커밋이 쌓이고, github actions 등의 CI 툴에도 불필요하게 사용량이 늘어나는 상황을 막고 싶었다.

## CLAUDE.md에서 AI에게 주의 주기
추가적으로 요즘에는 직접 손으로 코딩하기보다는 AI에게 지시하는 경우가 많은데, AI는 **린트를 강제로 우회**하는 코드를 쓰는 경우나 lint가 잡지 못하는 컨벤션을 막기위해 아래와 같이 구성하였다.

### CLAUDE.md를 `.claude/rules`로 쪼개기

네이밍·단일 책임 같은 일반 원칙과 "파생값은 계산해라", "useEffect는 외부 시스템 동기화에만 써라" 같은 규칙을 추가하려 하였으나 이걸 전부 CLAUDE.md에 욱여넣으면 파일이 길어지고, [Claude Code 문서](https://code.claude.com/docs/en/memory)도 길어진 CLAUDE.md는 오히려 덜 지켜진다며 200줄 아래를 권했기 때문에 파일을 분리하였다.

그래서 Claude Code가 지원하는 `.claude/rules/` 디렉터리로 나눴다. 나누는 구성도 AI에게 관련 공식문서를 참고하여 rules를 나눠 달라고 요청 하였다.

```
CLAUDE.md                   # 절대 금지(any·as 우회, git hook 스킵) + 스택/언어/커맨드/훅
.claude/rules/
├─ code-quality.md          # 네이밍·단일 책임·에러 처리·재사용·보이스카우트 룰
└─ react.md                 # 파생값 계산·useRef·useEffect·early return - frontmatter에 paths를 추가하여 ts,tsx만 체크
```

## 결과 — 무엇이 보장되는가

위 설정을 마치고 나면 다음이 강제된다.(단, 예외적으로 사람이 직접적으로 git hook을 스킵할 수는 있겠지만...)

- **누구나 같은 환경**: 클론 후 의존성만 설치하면 동일한 훅이 깔린다(`prepare`).
- **올라가는 코드의 최소 품질**: 커밋 시 staged 파일은 자동 수정이 끝나 있고, 빌드되지 않는 코드는 push되지 않는다.
- **내가 정한 룰의 상시화**: `no-eval`·`no-console`·`exhaustive-deps` 위반과 baseline 밖 CSS는 워닝이 아니라 에러로 막힌다.

## 회고 — 룰 목록은 좋은 코드의 체크리스트

사실 이번에 가장 크게 남은 건 **ESLint의 룰을 직접 들여다본 경험 자체**였다. `recommended`와 `all`에 어떤 룰이 있는지 전부 다 읽지는 못했지만 하나씩 읽어 보며 룰 하나하나가 결국 "이런 코드는 안티패턴이다"라는 경험칙의 목록이기 때문에 단순히 룰에 대해서 이해하는 게 아닌 **좋은 코드가 무엇인지에 대한 힌트**를 함께 얻게 됐다.

마지막으로, 도구는 사람이 빼먹지 않을 때만 의미가 있다는 점이다. lint를 갖춰도 강제하지 않으면 AI던 사람이던 결국 외면하게 되는 리스크가 생긴다. git hook으로 강제하고 CLAUDE.md로 AI까지 묶고 나서야 비로소 강제 할 수 있었다.
