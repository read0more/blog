import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testDir: "./tests/translations",
  use: { ...base.use, baseURL: "http://localhost:3101" },
  projects: base.projects,
  webServer: {
    command: "npm run build && node scripts/serve-out.mjs",
    url: "http://localhost:3101/blog/",
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      POSTS_DIR: "content/posts",
      OMIT_DRAFTS: "false",
      BASE_PATH: "/blog",
      PORT: "3101",
      NEXT_PUBLIC_GISCUS_REPO: "",
      NEXT_PUBLIC_GISCUS_REPO_ID: "",
      NEXT_PUBLIC_GISCUS_CATEGORY_ID: "",
    },
  },
});
