# 본문 이미지 라이트박스 설계

작성일: 2026-08-07

## 배경 · 목적

이 블로그의 글에는 네트워크 패널, 프로파일러, 계측 결과 같은 **디테일이 중요한
스크린샷**이 많다. 본문 폭에 맞춰 축소되면 글씨나 수치가 안 보이는 이미지가 있고,
특히 **가로로 긴 이미지**는 세로 스크롤이 아니라 **width가 부족**해 제대로 읽히지 않는다.

목표: 본문 이미지를 클릭/탭하면 **최대한 원본 크기에 가깝게** 볼 수 있게 한다.
PC·모바일에서 동작이 통일되고, 유지보수가 단순해야 한다.

## 결정 사항 (브레인스토밍 결과)

1. **인터랙션: 클릭/탭 → 라이트박스.** 호버-줌(돋보기 렌즈)은 쓰지 않는다.
   - 호버는 모바일에 없어 두 벌 구현이 필요하고, 읽는 중 오작동이 잦다.
   - 호버는 버리지 않고 **어포던스(신호)로만** 쓴다: PC에서 이미지 위에 마우스를
     올리면 커서가 `zoom-in`으로 바뀌고 미세하게 하이라이트된다. **확대는 클릭할 때만.**
   - Medium·Notion·GitHub 등 대다수 기술 블로그의 표준 패턴이며, PC 클릭과 모바일
     탭이 **동일 코드로 통일**된다.
2. **적용 대상: 본문 모든 이미지.** `figure.md-figure img` 전부 자동 적용.
   글쓴이가 별도 표기할 필요 없음. (코드블록 figure는 `data-rehype-pretty-code-figure`
   라 자연히 제외된다.)
3. **확대 수준: fit + 원본 토글(레벨 B).**
   - PC: 클릭하면 화면맞춤(fit) ↔ 실제 픽셀(100%) 전환, 드래그로 이동(pan).
   - 모바일: **핀치 줌 + 드래그 팬**으로 가로 픽셀까지 도달 → width 문제 해결.
   - 자유 무단계 줌(레벨 C)은 기술 블로그엔 과하므로 제외.
4. **구현: 라이브러리 사용(PhotoSwipe v5).** 핀치/팬/관성/토글/접근성을 직접
   구현하면 버그 리스크가 크다. 이 기능의 사실상 표준인 PhotoSwipe로 안전하게 간다.

## 라이브러리 · 통합 지점

- **PhotoSwipe v5** (`photoswipe`, ESM). 정적 export(`output: "export"`)·번들과 호환.
  핀치·팬·fit↔100% 토글·키보드·포커스 트랩·`prefers-reduced-motion`을 내장한다.
- 통합은 **`ArticleClient.tsx`의 enhance 패턴을 재사용**한다. 지금 코드블록을 마운트
  후 `useEffect`에서 DOM을 조회해 enhance하듯, 본문 이미지도 같은 방식으로 enhance한다.
- 단, `ArticleClient`가 비대해지지 않도록 **라이트박스 로직은 별도 모듈로 분리**한다
  (예: `src/components/post/useImageLightbox.ts` 훅 또는 `enhanceImages` 함수).
  `ArticleClient`는 이를 호출만 한다.
- PhotoSwipe는 **동적 import**(`await import("photoswipe/lightbox")`)로 클라이언트
  이펙트 안에서 로드한다 — SSR/정적 export에서 window 접근 문제를 피한다.

## 동작 명세 (PC / 모바일 통일)

### PC

- 이미지 호버 → 커서 `zoom-in` + 미세 하이라이트(어포던스). 확대는 일어나지 않는다.
- **클릭** → 라이트박스 오픈.
- 라이트박스 안: **클릭으로 fit ↔ 100% 토글**, 드래그로 이동(pan).
- 닫기: 배경 클릭 · ESC · 닫기 버튼.

### 모바일

- **탭** → 라이트박스 오픈.
- **핀치 줌 + 드래그 팬**으로 원하는 부분(특히 가로 픽셀)까지 확대.
- 닫기: 아래로 스와이프(PhotoSwipe 기본) · 닫기 버튼.

## 이미지 크기 데이터

PhotoSwipe는 원본 width/height가 필요하다. 우리 `<img>`는 마크다운에서 온 raw HTML이라
치수 정보가 없다. 처리 방식:

- enhance 시 각 이미지의 **`naturalWidth`/`naturalHeight`를 읽어** PhotoSwipe에 넘긴다.
  본문 인라인 이미지라 로드되어 있으며, 아직 로드 전이면 `img.complete`를 확인하고
  `load` 이벤트를 기다렸다가 등록한다.
- 원본 파일 자체가 풀사이즈(스크린샷)이므로 **썸네일↔원본 구분 없이 같은 `src`를 확대**한다.
- basePath는 이미 `rehype-figure.ts`가 `src`에 prefix해 두었으므로 그대로 사용한다.

## 캡션

- `figure.md-figure > figcaption`(= alt 텍스트)을 **라이트박스 안 캡션으로도 표시**한다.
  주석 달린 스크린샷이 많아 확대 상태에서 설명이 보이면 유용하다.
- PhotoSwipe의 caption UI(커스텀 엘리먼트 또는 `photoswipe-dynamic-caption` 방식)로,
  각 이미지의 figcaption 텍스트를 가져와 노출한다. figcaption이 없는 이미지는 캡션 생략.

## 스타일 · 접근성

- 호버 어포던스(커서 `zoom-in`, 미세 하이라이트)는 `Article.module.css`에 CSS로 추가.
- 딤 배경은 PhotoSwipe 기본(어두운 배경)을 사용 — 밝은(github-light) 사이트 위에 대비가 좋다.
- PhotoSwipe 기본 CSS(`photoswipe/style.css`)를 import한다.
- 키보드 조작·포커스 트랩·`prefers-reduced-motion`은 PhotoSwipe가 처리한다.

## 범위 밖 (YAGNI)

- **이미지 간 좌우 네비게이션 없음.** 글에 이미지가 여러 개여도 각 이미지는 **독립
  라이트박스**로 열린다(갤러리 슬라이드 X).
- 썸네일 스트립, 공유/다운로드 버튼, 슬라이드쇼 미포함.

## 테스트 (E2E)

- 픽스처(`tests/fixtures/posts`)에 이미지를 포함한 글이 있는지 확인하고, 없으면 추가한다.
- 본문 이미지 클릭 → 라이트박스(PhotoSwipe 루트 `.pswp`) 오픈 확인.
- ESC 또는 닫기 버튼으로 닫힘 확인.
- 데스크톱/모바일 프로젝트 양쪽에서 오픈 동작 확인.
- E2E는 실제 정적 빌드 산출물을 대상으로 돌므로, 동적 import·정적 export 호환이
  자연히 검증된다.

## 품질 게이트

- 기존 규칙 준수: git hook 우회 금지, 억제 주석(`@ts-ignore`·`eslint-disable` 등) 금지.
- `npm run build`(pre-push)와 CI(lint·type-check·format·build·E2E)를 모두 통과해야 한다.
