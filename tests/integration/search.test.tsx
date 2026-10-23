import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { DesktopSearch } from "@/components/search/DesktopSearch";
import { useSearch } from "@/components/search/useSearch";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const server = setupServer(
  http.get("http://localhost/search-index.json", () =>
    HttpResponse.json([
      {
        slug: "container-query",
        title: "Container Query",
        categories: ["CSS"],
        text: "뷰포트가 아니라 컨테이너",
      },
      {
        slug: "effect",
        title: "의존성 배열",
        categories: ["React"],
        text: "effect의 의존성 Hooks",
      },
    ]),
  ),
);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function SearchScreen() {
  return <DesktopSearch search={useSearch()} tags={["Hooks", "렌더링"]} />;
}

test("본문 검색은 결과와 강조를 보여주고 지우면 결과 패널을 닫는다", async () => {
  const user = userEvent.setup();
  render(<SearchScreen />);
  await user.type(screen.getByRole("textbox"), "컨테이너");
  const result = await screen.findByRole("link", { name: /Container Query/ });
  expect(result).toHaveAttribute("href", "/posts/container-query");
  expect(screen.getByText("1개의 결과")).toBeInTheDocument();
  expect(
    within(result).getByText("컨테이너", { selector: "mark" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "지우기" }));
  expect(screen.getByRole("textbox")).toHaveValue("");
  expect(
    screen.queryByRole("link", { name: /Container Query/ }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("1개의 결과")).not.toBeInTheDocument();
});

test("태그 검색 후 미일치 검색은 이전 결과를 지우고 태그 탐색을 안내한다", async () => {
  const user = userEvent.setup();
  render(<SearchScreen />);
  const input = screen.getByRole("textbox");
  await user.type(input, "Hooks");
  expect(
    await screen.findByRole("link", { name: /의존성 배열/ }),
  ).toHaveAttribute("href", "/posts/effect");
  await user.clear(input);
  await user.type(input, "graphql");
  expect(
    await screen.findByText(/graphql.*결과가 없습니다/),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /의존성 배열/ }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "#Hooks" })).toHaveAttribute(
    "href",
    "/tag/Hooks",
  );
  expect(screen.getByRole("link", { name: "#렌더링" })).toHaveAttribute(
    "href",
    `/tag/${encodeURIComponent("렌더링")}`,
  );
});
