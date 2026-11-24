import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom 에는 matchMedia 가 없다. AppShell 의 테마 전환 버튼이 시스템 설정을 읽으므로 라이트 시스템으로 둔다.
// 시스템 설정을 바꿔 보는 테스트(theme.test.tsx)는 vi.stubGlobal 로 덮어쓴다.
window.matchMedia ??= (media: string) => ({
  matches: false,
  media,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});

afterEach(cleanup);
