---
title: "히어로 이미지로 망가진 LCP를 1.2초 줄인 과정"
date: "2026-02-18T09:00:00.000Z"
description: "첫 화면의 큰 이미지 한 장이 LCP를 어떻게 망치고 있었나. 마크업 몇 줄로 끝난 개선."
category: "성능"
draft: true
---

## 범인은 히어로 이미지였다

Lighthouse가 가리킨 LCP 요소는 첫 화면의 큰 배너 이미지였다. 원본은 2400px 너비의 PNG였고, 모바일에서도 그대로 내려받고 있었다. LCP는 4.1초. 사용자가 "느리다"고 느끼는 바로 그 순간이 여기서 나왔다.

![라이트박스 확대 테스트용 이미지](/android-chrome-512x512.png)

## 세 가지를 바꿨다

첫째, 포맷을 AVIF로 바꾸고 화면 폭에 맞춘 여러 크기를 제공했다. 둘째, 이 이미지에만 fetchpriority="high"와 preload를 주어 가장 먼저 받게 했다. 셋째, 그 아래 이미지들은 모두 loading="lazy"로 미뤘다.

```html
<link rel="preload" as="image" href="/hero.avif"
      fetchpriority="high" />

<img src="/hero.avif" width="1200" height="600"
     fetchpriority="high" alt="..." />
```

width와 height를 명시한 것도 중요했다. 크기를 모르면 이미지가 도착할 때 레이아웃이 밀려 CLS가 튄다. 종횡비를 미리 알려주면 자리만 잡아두고 본문을 먼저 그린다.

### 결과

LCP는 4.1초에서 2.9초로 떨어졌다. 전송량은 히어로 한 장 기준 680KB에서 90KB로 줄었다. 코드 변경은 마크업 몇 줄이 전부였다.

## 교훈

- LCP 요소가 무엇인지부터 정확히 찾는다.
- 가장 중요한 이미지 한 장만 먼저, 나머지는 미룬다.
- width·height를 항상 명시해 CLS를 막는다.
