import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * 일반·번역 E2E가 /blog 고정 픽스처 빌드 하나를 공유한다.
 * 실제 콘텐츠·초안 제외는 CI의 별도 배포 빌드 + postbuild가 검증한다.
 * 내용·개수·상태 분기는 Vitest에 두고 실제 브라우저 경계만 여기 남긴다.
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
      },
      testIgnore: /\.mobile\.spec\.ts$/,
    },
    {
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
  webServer: {
    command: "npm run build && node scripts/serve-out.mjs",
    url: `${BASE_URL}/blog/`,
    // 같은 포트의 다른 콘텐츠·basePath 빌드를 잘못 재사용하지 않는다.
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      POSTS_DIR: "tests/fixtures/posts",
      OMIT_DRAFTS: "false",
      BASE_PATH: "/blog",
      NEXT_PUBLIC_BASE_PATH: "/blog",
      PORT: String(PORT),
      NEXT_PUBLIC_GISCUS_REPO: "",
      NEXT_PUBLIC_GISCUS_REPO_ID: "",
      NEXT_PUBLIC_GISCUS_CATEGORY_ID: "",
    },
  },
});
