# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개요

read0more의 개인 기술 블로그. `content/posts/`의 마크다운 파일을 **완전한 정적 사이트**
(`output: "export"`)로 빌드하는 Next.js 16(App Router, React 19) 프로젝트이며,
GitHub Actions로 GitHub Pages에 배포한다. 코드 주석은 한국어로 작성되어 있다.

## 명령어

```bash
npm run dev          # 개발 서버 (predev → 검색 인덱스 빌드 먼저 실행)
npm run build        # 검색 인덱스 → 정적 export → postbuild 정적 산출물 검증
npm run start        # 빌드된 out/ 을 BASE_PATH(기본 /blog) 하위 경로로 로컬 서빙
npm run lint         # eslint
npm run type-check   # tsc --noEmit (타입 체크만)
npm run format       # prettier --write . (전체 포맷 적용)
npm run format:check # prettier --check . (CI 포맷 검사)
npm run check:messages # 번역 키·빈 문구·ICU 구문/변수 일치 검사 (predev/prebuild 자동 실행)
npm run search-index # public/search-index.json 수동 재생성

npm test                       # Vitest 단위 + 통합 테스트 (빌드·브라우저 없이 실행)
npm run test:unit              # 순수 번역·날짜·검증 로직
npm run test:integration       # 콘텐츠/검색 파이프라인 + RTL/MSW UI 동작
npm run test:e2e               # Playwright (out/ 빌드 + :3100 서빙 후 실행)
npm run test:e2e:ui            # Playwright UI 모드
npm run test:translations      # 실제 live-code-demo 번역, /blog 경로, 데스크톱·모바일 검증
npx playwright test tests/e2e/search.spec.ts          # 단일 spec 파일
npx playwright test -g "검색"                          # 제목 패턴으로 실행
npx playwright test --project=desktop                  # 데스크톱만 (모바일 = --project=mobile)
```

E2E는 개발 서버가 아니라 **실제 정적 빌드 산출물**(`next build && serve out`)을 대상으로
돈다 — 프로덕션과 동일하고, URL 인코딩된 비ASCII(한글) 카테고리 경로에서 발생하는
dev 모드 500 문제를 우회한다. 데스크톱 테스트는 1280px, 모바일 전용 시나리오는
`*.mobile.spec.ts`에 분리되어 `mobile` 프로젝트에서 390px로 돈다.
Vitest는 `tests/unit`의 순수 로직과 `tests/integration`의 Node 파이프라인·RTL 통합 테스트를
빌드 없이 실행한다. UI는 jsdom + RTL + user-event, 네트워크 경계는 MSW를 사용한다.
**통합 테스트로 검증할 수 없는 이유가 없으면 E2E에 추가하지 않는다.** 단순 번역 문자열,
개수·초안 필터링·검색 결과·컴포넌트 조건부 렌더링은 낮은 계층에서 검증한다.
영어 E2E는 실제 정적 경로 이동/새로고침, JS 없는 링크 탐색, browser redirect,
공통 404 복귀, 모바일 CSS로 표시되는 메뉴/검색 흐름에 한정한다.
같은 시나리오를 데스크톱/모바일로 무조건 복제하지 않는다.

E2E는 **`content/posts`가 아니라 고정 픽스처 `tests/fixtures/posts/`를 빌드 대상으로 삼는다** —
`playwright.config.ts`의 `webServer.env`가 `POSTS_DIR=tests/fixtures/posts`를 주입한다(`posts.ts`·
`build-search-index.mjs`가 `POSTS_DIR` 오버라이드를 지원). 덕분에 글 개수/카테고리 수를 단언하는
테스트가 **실제 글을 추가·수정해도 깨지지 않는다**(실제 글은 `content/posts`에만, 테스트 픽스처는
`tests/fixtures/posts`에만). 같은 `env`에서 `BASE_PATH`·giscus 값도 비워, 로컬 `.env`와 무관하게
루트 경로·댓글 placeholder 상태로 결정적으로 빌드한다.

## 아키텍처

**콘텐츠 → 렌더 → 소비**가 모두 빌드 타임에 일어난다:

- `content/posts/<카테고리>/**/*.md` — 글 하나가 마크다운 파일 하나. YAML 프론트매터
  (`title`, `date` ISO-8601, `description`, 선택적 `tags`·`draft`)를 가진다.
  첫 번째 디렉토리가 대표 카테고리이고 하위 폴더는 정리 용도다. 파일명이 slug가 되므로
  폴더 이동으로 URL은 바뀌지 않는다. `src/lib/post-files.mjs`가 재귀 탐색과 중복 slug 검증을
  공유한다. 루트에 놓인 글과 중복 파일명은 초안을 포함해 빌드 오류로 처리한다.
- `src/lib/post-files.mjs` — 파일 탐색·원문/번역 연결·프론트매터 검증·초안 제외를 공유한다.
  `.en.md`는 인접한 원문에 연결하며 제목·설명·본문만 번역하고 작성일·태그·카테고리를 상속한다.
- `src/lib/posts.ts` — `loadAllPosts()`가 원문과 사용 가능한 영어 번역을
  렌더링하고, date 내림차순으로
  정렬한 뒤 **결과를 모듈 레벨 변수에 캐시**한다(빌드 한 번에 여러 번 호출됨). 모든 페이지
  데이터는 여기의 타입드 접근자(`getAllPostMeta`, `getPostBySlug`, `getCategories`, `getAllTags` 등)를 거친다.
- `src/lib/markdown.ts` — unified 파이프라인: `remark-parse → gfm → remark-rehype →
rehype-slug → rehype-extract-toc → autolink-headings → rehype-pretty-code(shiki,
github-light) → stringify`. **TOC는 `rehype-slug` 직후에 추출**해 앵커 id와 정확히 일치시킨다.
  검색용 `plainText`(텍스트 노드만, 코드블록 제외)도 함께 만든다.
- **라이브 코드 블록**: ` ```css live file=styles.css ` 처럼 meta에 `live`가 붙은 **연속** 펜스들은
  `remark-live-code.ts`가 하나의 `div[data-live-code]`(파일맵 JSON)로 묶고, 클라이언트
  `useLiveCode.tsx`가 그 자리에 `LiveCode.tsx`(Sandpack `static` 템플릿, iframe 미리보기)를 마운트한다. `file=` 필수,
  `hidden`은 탭에서 숨김, `view=both|preview|code`는 처음 보기 모드(블록 위 버튼으로 독자가 전환, 패널은
  `display`로만 숨겨 상태 유지). `rehype-raw`가 hast의 펜스 meta를 버리므로 이 처리는 반드시 remark 단계에 둔다.
- `src/app/(ko)/`는 기존 한국어 URL을 유지하고 `src/app/en/[[...segments]]`는 영어 홈·글·카테고리·태그를
  정적 생성한다. 영어 홈을 항상 포함하므로 공개 번역이 0개여도 빌드가 된다.
  각 루트 레이아웃은 `SiteLayout`에 언어를 전달하여 HTML `lang`과 해당 언어의 사이드바 데이터를 만든다.
  언어 루트 간 이동은 전체 페이지 이동이며, 언어 안에서는 Next 링크를 사용한다.
  영어 주소는 `/en/posts/<slug>/`이고 `/posts/<slug>/en/`는 정적 안내 + 브라우저 이동으로 유지한다.
  헤더 언어 전환은 현재 글의 원문/번역으로 이동한다. 한국어 전용 글은 "English home"으로
  표시하여 영어 홈으로 이동한다. 글 본문 쪽에는 별도 언어 전환 버튼을 두지 않는다.
  영어 글 경로는 공개 원문 slug마다 생성하되, 번역이 없으면 `TranslationUnavailable` 안내와
  원문 링크만 제공하고 noindex로 처리한다. 이 안내는 영어 목록·분류·검색에 집계하지 않는다.
  원문 자체가 없거나 초안으로 제외됐으면 안내 페이지도 만들지 않는다.
  HTTP redirect, middleware, cookies/headers 기반 언어 판별은 쓰지 않는다.
  `global-not-found.tsx`를 위해 `experimental.globalNotFound`를 사용한다. 공통 `404.html`은 클라이언트에서
  주소로 언어를 판별하고, no-JS 상태에서도 영어 홈 링크를 제공한다.
  글 상세는 언어별 key로 목차·라이브 코드 상태를 초기화한다. 목록·분류·검색은 각 언어의 글만 집계한다.
  `getAllPostMeta`, `getCategories`, `getAllTags` 등 접근자는 선택적인 언어 인자를 받으며 기본은 한국어다.
  UI 문구와 카테고리·태그 표시명은 `messages/{ko,en}.json`에서 관리한다.
  `use-intl/core`의 `createTranslator`를 언어별로 생성하여 `getUiTranslator(language)`로 사용한다.
  이 함수는 라이브러리 번역기를 반환하며, 문구 선택/보간/복수형 엔진을 직접 구현하지 않는다.
  정적 라우트에서 언어를 명시하므로 Provider나 요청 설정, 미들웨어는 필요 없다.
  Node 검색 빌드도 `src/lib/taxonomy.mjs`를 통해 같은 카탈로그와 라이브러리를 사용한다.
  `createFormatter`가 UTC 기준 날짜를 처리한다. JSON UI 키는 TypeScript로 검사하고,
  `check:messages`는 모든 카탈로그의 키와 ICU 변수 일치·구문·빈 문구를 검증한다.

**검색**은 서버가 아니라 빌드 타임 JSON 인덱스다:

- `scripts/build-search-index.mjs`가 `predev`/`prebuild`에서 실행되어
  `public/search-index.json`과 `public/search-index.en.json`(해당 언어의 title + description + 본문 plaintext + 태그 표시명)을 쓴다.
  `markdown.ts`의 plaintext 로직과 의도적으로 중복되어 있다 — 스크립트를 가볍게(remark만,
  shiki 없이) 유지하기 위함이다.
- 클라이언트(`src/components/search/useSearch.ts` + `src/lib/search.ts`)는 첫 검색 시
  해당 언어의 인덱스를 lazy fetch하고, 120ms 디바운스 후 부분 문자열 매칭 + 스니펫 하이라이트를 한다.

**카테고리**는 수동 설정하지 않는다. 글이 있는 최상위 디렉토리에서 distinct하게 수집하며, 표시 순서는
`posts.ts`의 `CATEGORY_ORDER` 우선 후 한글 정렬, 색상은 이름을 해시해 9색 iOS 팔레트에서
결정적으로 고른다(`src/lib/categories.ts`).

**카테고리와 태그의 역할 분담**: 카테고리는 사이드바에 나오는 큰 분류(과정 회고는 `루프팩과정`, 개인 견해는 `생각들`)이고,
세부 주제는 프론트매터 `tags`(선택, 문자열 배열)에 적는다. 태그는 사이드바에 넣지 않고
`TagChips`(`src/components/posts/TagChips.tsx`)로 목록 상단 태그 줄·글 카드·글 상세에 무채색 칩으로
보여주며 `/tag/[slug]`로 연결한다. 목록 상단 태그 줄은 `tagsOf(posts)`로 만든다(글 수 내림차순).
글 카드는 `<li>` 안에 카드 링크와 태그 칩을 형제로 둔다(칩도 링크라 중첩하면 `<a>` 안에 `<a>`가 된다).

**서버 vs 클라이언트 경계**: 렌더링/데이터는 서버 사이드, 인터랙션은 `"use client"`
컴포넌트로 격리된다. `ArticleClient.tsx`가 글 상세 페이지의 인터랙션(스크롤 스파이 TOC,
코드블록 복사 버튼)을 담당한다. 여기 두 가지 비자명한 정합성 가드가 있다: prose `<div>`는
`memo`로 감싸 `activeId` 변경 시 `dangerouslySetInnerHTML`이 재적용되지 않게 한다(재적용되면
enhance된 코드 헤더가 지워지고 TOC가 깨짐). 그리고 스크롤 스파이는 heading 노드를 캐시하지
않고 스크롤마다 다시 조회한다(캐시하면 노드가 detach되어 활성 heading 탐지가 깨짐).

## Draft와 배포

- `draft: true` 프론트매터는 **`OMIT_DRAFTS=true`일 때만** 글을 제외한다 — 이 값은 GitHub
  Actions 배포 빌드(`.github/workflows/deploy.yml`)에서*만* 주입된다. 로컬(`dev`/`build`)에서는
  `content/posts`의 draft 글도 그대로 보인다(미리보기용). 필터는 `post-files.mjs`의
  `readPostSources`를 통해 페이지와 검색에 동일하게 적용된다. 번역 초안은 번역만 제외하고
  원문 초안은 원문과 번역 모두 제외한다. (일반 E2E는 `content/posts`가 아니라 별도 고정 픽스처
  `tests/fixtures/posts`를 빌드한다 — 위 "명령어" 섹션 참조.)
  `test:translations`는 실제 `content/posts`의 `live-code-demo`와 영어 번역을 로컬 미리보기
  규칙으로 빌드한다. 일반 E2E와 동일한 `.next`/`out`을 사용하므로 순서대로 실행한다.
- 정적 export는 `next/image` 최적화를 못 쓰고(`images.unoptimized: true`), 공개 글이 **0개**면
  사이트 빌드 자체가 실패한다 — non-draft 글을 최소 하나는 유지할 것. 태그도 같다: 공개 글 전체에
  `tags`가 **하나도 없으면** `/tag/[slug]`의 `generateStaticParams`가 빈 배열이 되어
  `missing "generateStaticParams()"` 오류로 빌드가 실패한다.
- 프로젝트 페이지 배포는 빌드 시 `BASE_PATH`(예: `/blog`) 주입이 필요하다. 클라이언트에는
  `NEXT_PUBLIC_BASE_PATH`로 노출되며 **모든 자산/인덱스 fetch 경로 앞에 prefix해야** 한다
  (`useSearch.ts` 참고). 안 하면 GitHub Pages에서 404가 난다. 폴더형 정적 라우팅을 위해
  `trailingSlash: true`.
- 댓글은 giscus, `NEXT_PUBLIC_GISCUS_*` env로 설정한다(`.env.example` 참고). 설정이 없으면
  빌드 실패 대신 플레이스홀더로 폴백한다.

## 품질 게이트 (훅 · CI)

`scripts/verify-static-export.mjs`는 `postbuild`에서 원문·영어 페이지, 영어 홈, 두 검색 인덱스,
legacy 링크, 초안 제외와 미번역 안내 페이지를 확인한다. 한국어 본문을 영어 글로 폴백하지 않는다.

검증은 3단계로 강제된다:

- **pre-commit** (`.husky/pre-commit`) — `lint-staged`가 staged 파일에 `eslint --fix` +
  `prettier --write`를 돌린다(가벼움).
- **pre-push** (`.husky/pre-push`) — `npm run build`를 돌린다. `next build`가 타입 체크 +
  ESLint + 빌드를 한 번에 수행하므로 이 한 단계가 컴파일·타입·린트·빌드를 모두 검증한다.
- **CI** (`.github/workflows/deploy.yml`) — `lint` · `type-check` · `format:check` · `npm test` · `build` ·
  E2E가 **모두 통과해야만** GitHub Pages에 배포된다(PR에서도 동일 검사 실행, 배포만 생략).

## 금지 사항 (엄수)

- **git hook을 우회하지 말 것.** 훅/검사가 실패하면 `--no-verify`, `HUSKY=0`, 환경변수로
  hook을 끄는 등 **어떤 방식으로도 건너뛰지 않는다**. 실패는 신호다 — 원인을 찾아 고친다.
- **억제 주석으로 오류를 덮지 말 것.** `@ts-ignore`, `@ts-expect-error`, `eslint-disable`
  (`eslint-disable-next-line` 포함), `// prettier-ignore` 등으로 타입/린트/포맷 오류를
  숨기는 것을 **엄금**한다. 타입·린트 에러는 근본 원인을 수정해 해소한다.

## 컨벤션

- import 별칭 `@/*` → `src/*`.
- 컴포넌트 스타일은 CSS Modules(`*.module.css`), 전역 토큰은 `src/styles/tokens/`와
  `src/app/globals.css`에 있다.
- TypeScript는 `strict`. 콘텐츠 파이프라인 공통 타입은 `src/lib/types.ts`.
