---
title: "(테스트용 AI 더미 post) Container Query로 진짜 컴포넌트 반응형 만들기"
date: "2026-05-09T09:00:00.000Z"
description: "뷰포트가 아니라 컴포넌트가 놓인 공간에 반응하는 레이아웃. 미디어 쿼리로는 못 풀던 문제를 푼다."
category: "CSS"
draft: true
---

## 뷰포트가 아니라 컨테이너

미디어 쿼리는 항상 뷰포트를 기준으로 한다. 하지만 같은 카드 컴포넌트가 사이드바에선 좁게, 본문에선 넓게 놓인다면 기준은 뷰포트가 아니라 "컴포넌트가 놓인 공간"이어야 한다. 컨테이너 쿼리가 정확히 이 문제를 푼다.

```css
.card-wrap { container-type: inline-size; }

@container (min-width: 360px) {
  .card { grid-template-columns: 120px 1fr; }
}
```

container-type: inline-size로 컨테이너를 선언하면, 그 안의 요소는 @container 규칙으로 컨테이너 너비에 반응한다. 부모가 어디에 놓이든 컴포넌트는 자기 폭만 보고 레이아웃을 바꾼다.

## 컨테이너 단위: cqi

길이 단위도 함께 쓸 수 있다. cqi는 컨테이너 인라인 크기의 1%다. 폰트 크기를 cqi로 주면 컨테이너가 커질수록 제목이 비례해 커지는 진짜 유동 타이포가 된다.

```css
.title { font-size: clamp(1rem, 4cqi, 1.6rem); }
```

### 지원 범위

컨테이너 쿼리는 모든 최신 브라우저에서 안정적으로 동작한다. 구형 환경이 걱정된다면 @supports (container-type: inline-size)로 점진적 향상을 적용하면 된다.

## 언제 쓰면 좋은가

- 같은 컴포넌트가 여러 폭의 슬롯에 재사용될 때
- 디자인 시스템의 카드·리스트·미디어 객체
- 뷰포트 기준 분기가 컴포넌트 단위와 어긋날 때
