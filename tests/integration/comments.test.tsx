import { afterAll, afterEach, expect, test, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";

// Comments 는 모듈을 불러올 때 env 를 읽으므로 import 전에 설정한다.
vi.stubEnv("NEXT_PUBLIC_GISCUS_REPO", "owner/repo");
vi.stubEnv("NEXT_PUBLIC_GISCUS_REPO_ID", "repo-id");
vi.stubEnv("NEXT_PUBLIC_GISCUS_CATEGORY_ID", "category-id");
afterAll(() => vi.unstubAllEnvs());
afterEach(() => {
  delete document.documentElement.dataset.theme;
});

const setConfig = (theme: string) =>
  [{ giscus: { setConfig: { theme } } }, "https://giscus.app"] as const;

test("giscus 는 현재 테마로 처음 불러오고, 테마가 바뀌면 스크립트를 다시 넣지 않고 설정 변경만 보낸다", async () => {
  document.documentElement.dataset.theme = "dark";
  const { Comments } = await import("@/components/post/Comments");
  render(<Comments />);
  const mount = screen.getByTestId("giscus-mount");
  expect(mount.querySelector("script")).toHaveAttribute("data-theme", "dark");

  // giscus client.js 가 만드는 iframe 을 대신 둔다(외부 스크립트 경계).
  const iframe = document.createElement("iframe");
  iframe.className = "giscus-frame";
  mount.append(iframe);
  const postMessage = vi.spyOn(iframe.contentWindow!, "postMessage");

  act(() => {
    document.documentElement.dataset.theme = "light";
  });
  await waitFor(() =>
    expect(postMessage).toHaveBeenLastCalledWith(...setConfig("light")),
  );
  expect(mount.querySelectorAll("script")).toHaveLength(1);

  // lazy iframe 은 준비되기 전 메시지를 버리므로, giscus 가 처음 말을 걸면 현재 테마를 다시 보낸다.
  postMessage.mockClear();
  act(() => {
    window.dispatchEvent(
      new MessageEvent("message", { origin: "https://other.example" }),
    );
  });
  expect(postMessage).not.toHaveBeenCalled();
  act(() => {
    window.dispatchEvent(
      new MessageEvent("message", { origin: "https://giscus.app" }),
    );
  });
  expect(postMessage).toHaveBeenCalledExactlyOnceWith(...setConfig("light"));
});
