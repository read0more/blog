# 본문 이미지 라이트박스 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 본문 이미지를 클릭/탭하면 PhotoSwipe 라이트박스로 열어 원본 크기(fit↔100%, 모바일 핀치 줌)까지 볼 수 있게 한다.

**Architecture:** `ArticleClient.tsx`가 마운트 후 DOM을 enhance하는 기존 패턴(코드블록 헤더/복사버튼)을 그대로 따라, 본문 `figure.md-figure > img`를 `<a class="pswp-anchor">`로 감싸고 PhotoSwipe v5 lightbox를 초기화한다. 라이트박스 로직은 `useImageLightbox` 훅으로 분리한다. 이미지 치수는 열 때 `naturalWidth/Height`를 읽어 넘긴다. E2E는 실제 정적 빌드 산출물을 대상으로 돈다.

**Tech Stack:** Next.js 16 (App Router, output: export), React 19, TypeScript strict, PhotoSwipe 5.4.4, Playwright.

## Global Constraints

- **git hook 우회 금지.** `--no-verify`·`HUSKY=0`·환경변수로 hook을 끄지 않는다. 실패는 원인을 고친다.
- **억제 주석 금지.** `@ts-ignore`·`@ts-expect-error`·`eslint-disable`(next-line 포함)·`// prettier-ignore`로 오류를 덮지 않는다. 근본 원인을 수정한다.
- 코드 주석은 **한국어**로 작성한다.
- import 별칭 `@/*` → `src/*`. 컴포넌트 스타일은 CSS Modules(`*.module.css`), 전역 스타일은 `src/app/globals.css`.
- TypeScript는 `strict`.
- E2E는 `content/posts`가 아니라 픽스처 `tests/fixtures/posts`를 빌드한다(`playwright.config.ts`의 `POSTS_DIR`). 데스크톱=1280px, 모바일 전용 시나리오는 `*.mobile.spec.ts`에 두어 `mobile`(390px) 프로젝트에서 돈다.
- **글/카테고리 개수 단언을 깨지 않는다.** 새 픽스처 글을 추가하지 말 것(home=7 카드, 성능 카테고리=1, 카테고리=6 단언이 존재). 테스트용 이미지는 **기존 픽스처 글 `image-lcp.md`에 추가**하고, 항상 존재하는 정적 자산 `/android-chrome-512x512.png`를 참조한다(글 생명주기와 분리, 개수 무변화).
- 품질 게이트: `npm run lint` · `npm run type-check` · `npm run format:check` · `npm run build` · `npm run test:e2e`가 모두 통과해야 한다.

---

## File Structure

- **Create** `src/components/post/useImageLightbox.ts` — 라이트박스 훅. 본문 이미지를 `<a.pswp-anchor>`로 감싸고 PhotoSwipe lightbox를 init/destroy한다. 열 때 `naturalWidth/Height`로 치수를, figcaption으로 캡션을 넘긴다.
- **Modify** `src/components/post/ArticleClient.tsx` — PhotoSwipe 전역 CSS import + `useImageLightbox(bodyRef, post.contentHtml)` 호출.
- **Modify** `src/components/post/Article.module.css` — 호버 어포던스(커서 `zoom-in`, 미세 하이라이트).
- **Modify** `src/app/globals.css` — 라이트박스 캡션(`.pswp-blog-caption`) 스타일(PhotoSwipe UI는 body 하위라 전역 스타일 필요).
- **Modify** `tests/fixtures/posts/image-lcp.md` — 본문 이미지 한 장 추가(E2E 대상).
- **Create** `tests/e2e/lightbox.spec.ts` — 데스크톱: 클릭 오픈 + ESC 닫기.
- **Create** `tests/e2e/lightbox.mobile.spec.ts` — 모바일: 탭 오픈.
- **Modify** `package.json` / `package-lock.json` — `photoswipe` 의존성.

---

## Task 1: 의존성 · 픽스처 · 실패하는 E2E 테스트

라이트박스가 아직 없으므로 이 테스트는 **실패**해야 한다(red).

**Files:**

- Modify: `package.json`, `package-lock.json` (photoswipe 설치)
- Modify: `tests/fixtures/posts/image-lcp.md`
- Create: `tests/e2e/lightbox.spec.ts`
- Create: `tests/e2e/lightbox.mobile.spec.ts`

**Interfaces:**

- Produces: 본문에 `figure.md-figure img` 1개를 가진 `/posts/image-lcp/` 페이지. 라이트박스 열림 시 `document.body` 하위에 `.pswp` 엘리먼트가 생김(Task 2가 구현).

- [ ] **Step 1: PhotoSwipe 설치**

Run:

```bash
npm install photoswipe@5.4.4
```

Expected: `package.json`의 `dependencies`에 `"photoswipe": "5.4.4"`(또는 `^5.4.4`) 추가, `package-lock.json` 갱신.

- [ ] **Step 2: 픽스처 글에 본문 이미지 추가**

`tests/fixtures/posts/image-lcp.md`에서 아래 문단

```markdown
Lighthouse가 가리킨 LCP 요소는 첫 화면의 큰 배너 이미지였다. 원본은 2400px 너비의 PNG였고, 모바일에서도 그대로 내려받고 있었다. LCP는 4.1초. 사용자가 "느리다"고 느끼는 바로 그 순간이 여기서 나왔다.
```

바로 다음에 이미지 한 줄을 추가한다(앞뒤로 빈 줄 유지 — 이미지 단독 문단이어야 `figure.md-figure`로 승격됨):

```markdown
Lighthouse가 가리킨 LCP 요소는 첫 화면의 큰 배너 이미지였다. 원본은 2400px 너비의 PNG였고, 모바일에서도 그대로 내려받고 있었다. LCP는 4.1초. 사용자가 "느리다"고 느끼는 바로 그 순간이 여기서 나왔다.

![라이트박스 확대 테스트용 이미지](/android-chrome-512x512.png)
```

주의: `/android-chrome-512x512.png`는 `public/`에 항상 존재하는 정적 자산이라 E2E 빌드(`out/`)에서 그대로 서빙되고, `rehype-figure`가 빈 `BASE_PATH`를 prefix해 `/android-chrome-512x512.png`로 로드된다. 새 픽스처 글이 아니므로 개수 단언에 영향 없다.

- [ ] **Step 3: 데스크톱 E2E 스펙 작성**

Create `tests/e2e/lightbox.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("이미지 라이트박스", () => {
  test("본문 이미지 클릭 → 라이트박스가 열리고 ESC로 닫힌다", async ({
    page,
  }) => {
    await page.goto("/posts/image-lcp/");

    const img = page
      .getByTestId("article-body")
      .locator("figure.md-figure img");
    await expect(img).toHaveCount(1);

    await img.first().click();

    // PhotoSwipe 는 body 하위에 .pswp 를 붙이고 열린다.
    await expect(page.locator(".pswp")).toBeVisible();

    await page.keyboard.press("Escape");

    // 닫히면 PhotoSwipe 가 DOM 을 제거한다.
    await expect(page.locator(".pswp")).toHaveCount(0);
  });
});
```

- [ ] **Step 4: 모바일 E2E 스펙 작성**

Create `tests/e2e/lightbox.mobile.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("이미지 라이트박스(모바일)", () => {
  test("본문 이미지 탭 → 라이트박스가 열린다", async ({ page }) => {
    await page.goto("/posts/image-lcp/");

    const img = page
      .getByTestId("article-body")
      .locator("figure.md-figure img")
      .first();
    await img.tap();

    await expect(page.locator(".pswp")).toBeVisible();
  });
});
```

- [ ] **Step 5: E2E 실행 → 실패 확인**

Run:

```bash
npx playwright test lightbox
```

Expected: FAIL — 이미지를 클릭/탭해도 `.pswp`가 나타나지 않아 `toBeVisible`에서 타임아웃. (빌드는 성공해야 함 — 실패는 라이트박스 미구현 때문이지 컴파일 오류가 아니어야 한다.)

- [ ] **Step 6: 커밋**

```bash
git add package.json package-lock.json tests/fixtures/posts/image-lcp.md tests/e2e/lightbox.spec.ts tests/e2e/lightbox.mobile.spec.ts
git commit -m "test: 본문 이미지 라이트박스 E2E(실패) + PhotoSwipe 의존성"
```

---

## Task 2: 라이트박스 구현 (훅 · 연결 · 스타일)

Task 1의 E2E를 **통과**시킨다(green).

**Files:**

- Create: `src/components/post/useImageLightbox.ts`
- Modify: `src/components/post/ArticleClient.tsx`
- Modify: `src/components/post/Article.module.css`
- Modify: `src/app/globals.css`

**Interfaces:**

- Consumes: `bodyRef: React.RefObject<HTMLDivElement | null>`(본문 prose 루트), `contentHtml: string`(enhance 재실행 트리거). `figure.md-figure > img`(+선택적 `figcaption`) DOM 구조.
- Produces: `useImageLightbox(bodyRef, contentHtml): void` — 마운트 후 이미지를 `<a.pswp-anchor>`로 감싸고 PhotoSwipe lightbox를 init, 언마운트/재실행 시 destroy.

- [ ] **Step 1: 라이트박스 훅 작성**

Create `src/components/post/useImageLightbox.ts`:

```typescript
import { useEffect } from "react";
import type PhotoSwipeLightbox from "photoswipe/lightbox";

/**
 * 본문 이미지 라이트박스.
 * ArticleClient 의 코드블록 enhance 와 동일하게, 마운트 후 본문 DOM 을 조회해
 * figure.md-figure > img 를 <a.pswp-anchor> 로 감싸고 PhotoSwipe(v5) lightbox 를 건다.
 * - 클릭/탭 → 라이트박스. 안에서 클릭/탭으로 fit↔100% 토글, 드래그 팬, 모바일 핀치 줌.
 * - 이미지 치수는 열 때 naturalWidth/Height 를 읽어 넘긴다(원본 파일이 곧 풀사이즈).
 * - figcaption(=alt) 텍스트를 라이트박스 캡션으로도 노출한다.
 * PhotoSwipe 는 window 에 의존하므로 이펙트 안에서 동적 import 한다(정적 export 호환).
 */
export function useImageLightbox(
  bodyRef: React.RefObject<HTMLDivElement | null>,
  contentHtml: string,
): void {
  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;

    // 1) 각 본문 이미지를 앵커로 감싼다(중복 실행 가드).
    const figures = root.querySelectorAll<HTMLElement>("figure.md-figure");
    figures.forEach((figure) => {
      if (figure.dataset.lightbox === "true") return;
      figure.dataset.lightbox = "true";

      const img = figure.querySelector("img");
      if (!img) return;

      const anchor = document.createElement("a");
      anchor.className = "pswp-anchor";
      // href 는 PhotoSwipe 가 요구하는 형식상 채워두고, 실제 src/치수는 아래 filter 로 넘긴다.
      anchor.href = img.getAttribute("src") ?? img.src;

      const caption = figure.querySelector("figcaption");
      if (caption?.textContent)
        anchor.dataset.pswpCaption = caption.textContent;

      img.parentNode?.insertBefore(anchor, img);
      anchor.appendChild(img);
    });

    // 2) PhotoSwipe lightbox 초기화(동적 import).
    let lightbox: PhotoSwipeLightbox | undefined;
    let cancelled = false;

    (async () => {
      const { default: PhotoSwipeLightboxCtor } =
        await import("photoswipe/lightbox");
      if (cancelled) return;

      // gallery 를 '문자열 셀렉터'로 주면 PhotoSwipe 가 매칭되는 figure 마다
      // '독립 갤러리'를 만든다 → 각 라이트박스는 그 이미지 1장만 담아 좌우
      // 네비게이션이 생기지 않는다(스펙: 이미지 간 이동 없음). element 를 넘기면
      // 모든 앵커가 한 갤러리로 묶여 화살표가 생기므로 안 된다.
      // 코드블록 figure 는 .md-figure 가 아니라 자연히 제외된다.
      lightbox = new PhotoSwipeLightboxCtor({
        gallery: "figure.md-figure",
        children: "a.pswp-anchor",
        pswpModule: () => import("photoswipe"),
      });

      // 열 때 img 의 실제 픽셀 치수/원본 src 를 슬라이드 데이터로 넣는다.
      lightbox.addFilter("domItemData", (itemData, element) => {
        const img = element.querySelector("img");
        if (img) {
          itemData.src = img.currentSrc || img.src;
          itemData.width = img.naturalWidth;
          itemData.height = img.naturalHeight;
          itemData.msrc = img.currentSrc || img.src;
          itemData.alt = img.alt;
        }
        return itemData;
      });

      // figcaption 텍스트를 라이트박스 하단 캡션으로 렌더한다.
      lightbox.on("uiRegister", () => {
        lightbox?.pswp?.ui?.registerElement({
          name: "blog-caption",
          order: 9,
          isButton: false,
          appendTo: "root",
          onInit: (el, pswp) => {
            el.className = "pswp-blog-caption";
            const update = () => {
              const element = pswp.currSlide?.data?.element;
              const text =
                element instanceof HTMLElement
                  ? (element.dataset.pswpCaption ?? "")
                  : "";
              el.textContent = text;
              el.style.display = text ? "" : "none";
            };
            pswp.on("change", update);
            update();
          },
        });
      });

      lightbox.init();
    })();

    return () => {
      cancelled = true;
      lightbox?.destroy();
    };
  }, [bodyRef, contentHtml]);
}
```

주의: `element.querySelector`·`instanceof HTMLElement` 로 타입을 좁혀 억제 주석 없이 strict 를 통과시킨다. `pswp.ui?.registerElement`의 콜백 파라미터(`el`, `pswp`)는 PhotoSwipe 타입에서 추론된다.

- [ ] **Step 2: ArticleClient 에 연결 + CSS import**

`src/components/post/ArticleClient.tsx` 상단 import 구역에 추가:

```typescript
import "photoswipe/style.css";
import { useImageLightbox } from "./useImageLightbox";
```

그리고 `ArticleClient` 컴포넌트 본문에서 `bodyRef` 선언 이후(예: 코드블록 enhance `useEffect` 근처)에 훅 호출을 추가:

```typescript
// ---- 본문 이미지 라이트박스 ----
useImageLightbox(bodyRef, post.contentHtml);
```

(기존 `bodyRef`·`post.contentHtml`를 그대로 재사용한다. 코드블록 enhance 와 동일한 트리거.)

- [ ] **Step 3: 호버 어포던스 CSS 추가**

`src/components/post/Article.module.css`의 `figure.md-figure img` 블록(현재 `border-radius: 10px;`로 끝나는 규칙) 뒤에 추가:

```css
/* 라이트박스 어포던스: JS 가 img 를 a.pswp-anchor 로 감싼 뒤에만 적용된다.
   호버 시 '확대 가능' 신호(커서/미세 밝기)만 주고, 확대는 클릭할 때 일어난다. */
.prose :global(figure.md-figure) :global(a.pswp-anchor) {
  display: block;
  cursor: zoom-in;
}
.prose :global(figure.md-figure) :global(img) {
  transition: opacity 0.15s ease;
}
.prose :global(figure.md-figure) :global(a.pswp-anchor:hover) :global(img) {
  opacity: 0.92;
}
```

- [ ] **Step 4: 라이트박스 캡션 스타일 추가**

`src/app/globals.css` 끝에 추가(PhotoSwipe UI 는 body 하위라 전역 스타일 필요):

```css
/* 라이트박스(PhotoSwipe) 캡션 — figcaption(alt) 텍스트를 하단 중앙에 표시 */
.pswp-blog-caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 16px;
  margin: 0 auto;
  max-width: 80%;
  padding: 8px 14px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
}

/* 각 이미지가 1장짜리 독립 갤러리라 '1 / 1' 카운터는 불필요하므로 숨긴다. */
.pswp__counter {
  display: none;
}
```

- [ ] **Step 5: 타입 · 린트 · 포맷 확인**

Run:

```bash
npm run type-check && npm run lint && npm run format:check
```

Expected: 모두 PASS. (실패 시 억제 주석이 아니라 근본 원인을 수정한다. `format:check` 실패는 `npm run format`으로 정리.)

- [ ] **Step 6: E2E 실행 → 통과 확인**

Run:

```bash
npx playwright test lightbox
```

Expected: PASS — 데스크톱(클릭→`.pswp` 표시→ESC→제거)·모바일(탭→`.pswp` 표시) 모두 그린.

- [ ] **Step 7: 커밋**

```bash
git add src/components/post/useImageLightbox.ts src/components/post/ArticleClient.tsx src/components/post/Article.module.css src/app/globals.css
git commit -m "feat: 본문 이미지 클릭 시 PhotoSwipe 라이트박스로 확대"
```

---

## Task 3: 전체 게이트 · 수동 검증

**Files:** 없음(검증만). 문제 발견 시 해당 파일 수정.

- [ ] **Step 1: 전체 품질 게이트 실행**

Run:

```bash
npm run lint && npm run type-check && npm run format:check && npm run build && npm run test:e2e
```

Expected: 전부 PASS(CI 와 동일 구성). `build`는 실제 글(`content/posts`) 기준으로도 컴파일/렌더가 깨지지 않는지 확인한다.

- [ ] **Step 2: 실제 앱에서 수동 검증(자동화 밖 동작)**

Run:

```bash
npm run dev
```

그리고 이미지가 있는 실제 글(예: `/posts/week7-performance-lcp-metadata/` 또는 `/posts/headless-select-compound-dialog/`)을 열어 확인:

- PC: 이미지 위 호버 시 커서가 `zoom-in`으로 바뀌고 살짝 밝아진다(어포던스). 클릭 → 라이트박스. 이미지 클릭 시 fit↔100% 토글, 드래그 팬. figcaption 이 하단 캡션으로 보인다.
- 브라우저 창을 모바일 폭(≤390px)으로 줄이고 터치 에뮬레이션으로 탭 → 라이트박스, **핀치 줌으로 가로 픽셀까지** 확대되는지(width 문제 해결) 확인.
- ESC/배경 클릭/닫기 버튼으로 닫힘.
- 코드블록(shiki figure)에는 라이트박스가 걸리지 않는지 확인(대상은 `figure.md-figure`뿐).

- [ ] **Step 3: (선택) 브랜치 마무리**

`superpowers:finishing-a-development-branch` 스킬로 병합/PR/정리 방식을 결정한다.

```

```
