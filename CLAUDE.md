# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개요

read0more의 개인 기술 블로그. `content/posts/`의 마크다운 파일을 **완전한 정적 사이트**
(`output: "export"`)로 빌드하는 Next.js 16(App Router, React 19) 프로젝트이며,
GitHub Actions로 GitHub Pages에 배포한다. 코드 주석은 한국어로 작성되어 있다.

## 명령어

```bash
npm run dev          # 개발 서버 (predev → 검색 인덱스 빌드 먼저 실행)
npm run build        # out/ 으로 정적 export (prebuild → 검색 인덱스 빌드 먼저 실행)
npm run start        # 빌드된 out/ 을 BASE_PATH(기본 /blog) 하위 경로로 로컬 서빙
npm run lint         # eslint
npm run search-index # public/search-index.json 수동 재생성

npm run test:e2e               # Playwright (out/ 빌드 + :3100 서빙 후 실행)
npm run test:e2e:ui            # Playwright UI 모드
npx playwright test tests/e2e/search.spec.ts          # 단일 spec 파일
npx playwright test -g "검색"                          # 제목 패턴으로 실행
npx playwright test --project=desktop                  # 데스크톱만 (모바일 = --project=mobile)
```

E2E는 개발 서버가 아니라 **실제 정적 빌드 산출물**(`next build && serve out`)을 대상으로
돈다 — 프로덕션과 동일하고, URL 인코딩된 비ASCII(한글) 카테고리 경로에서 발생하는
dev 모드 500 문제를 우회한다. 데스크톱 테스트는 1280px, 모바일 전용 시나리오는
`*.mobile.spec.ts`에 분리되어 `mobile` 프로젝트에서 390px로 돈다. 유닛 테스트 러너는
없으며 E2E가 유일한 테스트 계층이다.

E2E는 **`content/posts`가 아니라 고정 픽스처 `tests/fixtures/posts/`를 빌드 대상으로 삼는다** —
`playwright.config.ts`의 `webServer.env`가 `POSTS_DIR=tests/fixtures/posts`를 주입한다(`posts.ts`·
`build-search-index.mjs`가 `POSTS_DIR` 오버라이드를 지원). 덕분에 글 개수/카테고리 수를 단언하는
테스트가 **실제 글을 추가·수정해도 깨지지 않는다**(실제 글은 `content/posts`에만, 테스트 픽스처는
`tests/fixtures/posts`에만). 같은 `env`에서 `BASE_PATH`·giscus 값도 비워, 로컬 `.env`와 무관하게
루트 경로·댓글 placeholder 상태로 결정적으로 빌드한다.

## 아키텍처

**콘텐츠 → 렌더 → 소비**가 모두 빌드 타임에 일어난다:

- `content/posts/*.md` — 글 하나가 마크다운 파일 하나. YAML 프론트매터
  (`title`, `date` ISO-8601, `description`, `category`, 선택적 `draft`)를 가진다.
  파일명이 slug가 된다.
- `src/lib/posts.ts` — 단일 진실 공급원(single source of truth). `loadAllPosts()`가 모든
  `.md`를 읽어 프론트매터를 검증(형식 오류 시 throw)하고, 렌더링하고, date 내림차순으로
  정렬한 뒤 **결과를 모듈 레벨 변수에 캐시**한다(빌드 한 번에 여러 번 호출됨). 모든 페이지
  데이터는 여기의 타입드 접근자(`getAllPostMeta`, `getPostBySlug`, `getCategories` 등)를 거친다.
- `src/lib/markdown.ts` — unified 파이프라인: `remark-parse → gfm → remark-rehype →
rehype-slug → rehype-extract-toc → autolink-headings → rehype-pretty-code(shiki,
github-light) → stringify`. **TOC는 `rehype-slug` 직후에 추출**해 앵커 id와 정확히 일치시킨다.
  검색용 `plainText`(텍스트 노드만, 코드블록 제외)도 함께 만든다.
- `src/app/`의 라우트: `page.tsx`(홈), `posts/[slug]`, `category/[slug]`, `not-found.tsx`.
  동적 라우트는 모두 `generateStaticParams`를 쓴다. `layout.tsx`는 카테고리 + 글 개수를
  로드해 전체를 `<AppShell>`로 감싸는 서버 컴포넌트다.

**검색**은 서버가 아니라 빌드 타임 JSON 인덱스다:

- `scripts/build-search-index.mjs`가 `predev`/`prebuild`에서 실행되어
  `public/search-index.json`(글마다 title + description + 본문 plaintext)을 쓴다.
  `markdown.ts`의 plaintext 로직과 의도적으로 중복되어 있다 — 스크립트를 가볍게(remark만,
  shiki 없이) 유지하기 위함이다.
- 클라이언트(`src/components/search/useSearch.ts` + `src/lib/search.ts`)는 첫 검색 시
  인덱스를 lazy fetch하고, 120ms 디바운스 후 부분 문자열 매칭 + 스니펫 하이라이트를 한다.

**카테고리**는 수동 설정하지 않는다. 프론트매터에서 distinct하게 수집하며, 표시 순서는
`posts.ts`의 `CATEGORY_ORDER` 우선 후 한글 정렬, 색상은 이름을 해시해 9색 iOS 팔레트에서
결정적으로 고른다(`src/lib/categories.ts`).

**서버 vs 클라이언트 경계**: 렌더링/데이터는 서버 사이드, 인터랙션은 `"use client"`
컴포넌트로 격리된다. `ArticleClient.tsx`가 글 상세 페이지의 인터랙션(스크롤 스파이 TOC,
코드블록 복사 버튼)을 담당한다. 여기 두 가지 비자명한 정합성 가드가 있다: prose `<div>`는
`memo`로 감싸 `activeId` 변경 시 `dangerouslySetInnerHTML`이 재적용되지 않게 한다(재적용되면
enhance된 코드 헤더가 지워지고 TOC가 깨짐). 그리고 스크롤 스파이는 heading 노드를 캐시하지
않고 스크롤마다 다시 조회한다(캐시하면 노드가 detach되어 활성 heading 탐지가 깨짐).

## Draft와 배포

- `draft: true` 프론트매터는 **`OMIT_DRAFTS=true`일 때만** 글을 제외한다 — 이 값은 GitHub
  Actions 배포 빌드(`.github/workflows/deploy.yml`)에서*만* 주입된다. 로컬(`dev`/`build`)과
  E2E에서는 draft 글도 전부 보인다(미리보기 + 테스트 픽스처용). 필터는 `posts.ts`와
  `build-search-index.mjs` 양쪽에 있다.
- 정적 export는 `next/image` 최적화를 못 쓰고(`images.unoptimized: true`), 공개 글이 **0개**면
  사이트 빌드 자체가 실패한다 — non-draft 글을 최소 하나는 유지할 것.
- 프로젝트 페이지 배포는 빌드 시 `BASE_PATH`(예: `/blog`) 주입이 필요하다. 클라이언트에는
  `NEXT_PUBLIC_BASE_PATH`로 노출되며 **모든 자산/인덱스 fetch 경로 앞에 prefix해야** 한다
  (`useSearch.ts` 참고). 안 하면 GitHub Pages에서 404가 난다. 폴더형 정적 라우팅을 위해
  `trailingSlash: true`.
- 댓글은 giscus, `NEXT_PUBLIC_GISCUS_*` env로 설정한다(`.env.example` 참고). 설정이 없으면
  빌드 실패 대신 플레이스홀더로 폴백한다.

## 컨벤션

- import 별칭 `@/*` → `src/*`.
- 컴포넌트 스타일은 CSS Modules(`*.module.css`), 전역 토큰은 `src/styles/tokens/`와
  `src/app/globals.css`에 있다.
- TypeScript는 `strict`. 콘텐츠 파이프라인 공통 타입은 `src/lib/types.ts`.
