import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * E2E 설정.
 * - webServer: `next build`(output:export) 로 정적 산출물(out/)을 만든 뒤
 *   `serve out` 으로 서빙한다. prebuild 단계에서 search-index.json 도 생성되어
 *   검색이 동작한다. 프로덕션(GitHub Pages) 배포물과 동일한 정적 파일을 대상으로
 *   돌므로 더 정확하고, dev 모드의 한글 동적 경로 500 한계도 우회한다.
 *   기본 포트와 충돌을 피해 3100 사용.
 * - 데스크톱(chromium 1280) + 모바일(390px) 두 프로젝트로 반응형을 함께 검증한다.
 *   모바일 전용 시나리오는 *.mobile.spec.ts 로 분리해 프로젝트별로 매칭한다.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      // 데스크톱: 모바일 전용 시나리오(*.mobile.spec.ts)는 제외.
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
      },
      testIgnore: /\.mobile\.spec\.ts$/,
    },
    {
      // 모바일(390px): 모바일 전용 시나리오만 실행.
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 800 },
        isMobile: true,
        hasTouch: true,
      },
      testMatch: /\.mobile\.spec\.ts$/,
    },
  ],
  // SSG(output: export) 사이트이므로 정적 빌드 산출물(out/)을 그대로 서빙해
  // 테스트한다 — 프로덕션 배포물과 동일하고, dev 모드의 한글 동적 경로 처리
  // 한계(인코딩된 비ASCII 카테고리 직접 요청 시 500)를 우회한다.
  webServer: {
    command: `npm run build && npx serve out -l ${PORT} --no-port-switching`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // E2E 빌드 환경을 결정적으로 고정한다. 로컬 .env(BASE_PATH=/blog, giscus 등)의 영향을
    // 차단해 어디서 돌리든 동일하게 동작하게 한다.
    //  - POSTS_DIR: 실제 글(content/posts)이 아니라 고정 픽스처를 빌드 → 실제 글을
    //    추가/수정해도 테스트 카운트가 깨지지 않는다.
    //  - BASE_PATH="": 루트 경로(링크/자산)로 빌드(테스트는 / 기준).
    //  - giscus 빈값: 댓글 placeholder가 보이는 상태(post.spec 기대)로 빌드.
    env: {
      POSTS_DIR: "tests/fixtures/posts",
      BASE_PATH: "",
      NEXT_PUBLIC_BASE_PATH: "",
      NEXT_PUBLIC_GISCUS_REPO: "",
      NEXT_PUBLIC_GISCUS_REPO_ID: "",
      NEXT_PUBLIC_GISCUS_CATEGORY_ID: "",
    },
  },
});
