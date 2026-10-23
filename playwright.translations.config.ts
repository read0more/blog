import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// 번역만 점검하는 로컬 명령. CI에서는 기본 설정으로 모든 E2E를 한 번에 실행한다.
export default defineConfig({
  ...base,
  testDir: "./tests/translations",
});
