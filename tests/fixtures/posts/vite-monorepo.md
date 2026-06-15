---
title: "Vite로 모노레포 빌드를 30초에서 8초로"
date: "2026-01-30T09:00:00.000Z"
description: "의존성 사전 번들링과 캐시 전략으로 줄인 빌드 시간. 새 도구가 아니라 \"다시 안 하기\"가 핵심이었다."
category: "빌드도구"
draft: true
---

## 빌드가 느려진 이유

패키지가 늘면서 빌드가 30초를 넘겼다. 원인은 두 가지였다. 매번 처음부터 의존성을 변환했고, 패키지 간 빌드 결과를 재사용하지 못했다. CI에서는 캐시가 없어 더 심했다.

## 의존성 사전 번들링

Vite는 node_modules의 의존성을 esbuild로 한 번 사전 번들링하고 캐시한다. optimizeDeps.include에 큰 의존성을 명시해 두면, 페이지를 처음 열 때 발생하던 요청 폭주가 사라진다.

```js
// vite.config.js
export default {
  optimizeDeps: {
    include: ["react", "react-dom", "lodash-es"],
  },
};
```

## 캐시를 CI까지 끌고 가기

로컬에선 빠른데 CI에서 느리다면 캐시가 휘발되고 있을 가능성이 높다. node_modules/.vite 디렉터리를 잠금 파일 해시 기준으로 보존하면 두 번째 실행부터 사전 번들링을 건너뛴다.

```yaml
- uses: actions/cache@v4
  with:
    path: node_modules/.vite
    key: vite-${{ hashFiles('**/pnpm-lock.yaml') }}
```

### 결과

변경 없는 빌드는 30초에서 8초로 줄었다. 핵심은 새 도구가 아니라, 한 번 한 일을 다시 하지 않게 만든 것이었다.
