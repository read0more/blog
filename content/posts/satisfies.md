---
title: "(테스트용 AI 더미 post) satisfies 연산자, 언제 써야 하나"
date: "2026-03-21T09:00:00.000Z"
description: "타입을 좁히면서도 추론은 유지하는 satisfies의 쓸모. 타입 주석과 무엇이 다른가."
category: "TypeScript"
---

## 타입을 좁히되 추론은 잃지 않기

객체에 타입을 명시(: Type)하면 안전하지만, 그 순간 구체적인 리터럴 추론을 잃는다. 반대로 아무 주석도 안 달면 추론은 살지만 오타나 누락을 못 잡는다. satisfies는 이 둘 사이의 빈틈을 메운다.

```ts
const palette = {
  primary: "#007aff",
  danger: "#ff3b30",
} satisfies Record<string, `#${string}`>;

// palette.primary는 여전히 리터럴로 추론됨
```

satisfies는 "이 값이 이 타입을 만족하는지"만 검사하고, 변수의 타입은 원래 추론을 유지한다. 그래서 palette.primary에 자동완성이 그대로 살아 있으면서도, 잘못된 색상 형식은 컴파일 단계에서 걸린다.

## : Type 과 무엇이 다른가

타입 주석은 값을 "넓힌다". const config: Config = {…} 라고 쓰면 config는 Config로 간주되어 구체적인 키나 리터럴 정보가 사라진다. satisfies는 검증은 같지만 넓히지 않는다 — 키 목록, 리터럴 유니온, 튜플 길이가 모두 보존된다.

### 자주 쓰는 패턴

- 설정 객체를 스키마로 검증하면서 키 자동완성 유지
- as const 없이 리터럴 타입 보존
- 라우트 테이블·색상 토큰처럼 키가 중요한 맵

## 한 줄 요약

> "검증은 하되 좁히지는 마라"가 필요할 때 satisfies를 쓴다. 타입 주석은 계약, satisfies는 검산이다.
