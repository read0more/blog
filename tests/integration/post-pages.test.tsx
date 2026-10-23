import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SidebarNav } from "@/components/layout/SidebarNav";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  notFound: () => {
    throw new Error("Not found");
  },
}));

// 서버 페이지 함수를 실제 파일 파이프라인과 연결해 렌더한다.
// Next 라우팅·정적 URL 서빙은 navigation E2E의 책임이다.
beforeAll(() => {
  vi.stubEnv("POSTS_DIR", "tests/fixtures/posts");
  vi.stubEnv("OMIT_DRAFTS", "false");
});
afterAll(() => vi.unstubAllEnvs());

test("홈은 최신순 글·개수·메타를 보여주고 카드와 태그의 링크를 분리한다", async () => {
  const { default: Home } = await import("@/app/(ko)/page");
  render(await Home());
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "전체 글",
  );
  expect(screen.getByText("7개의 글 · 최신순")).toBeInTheDocument();
  const cards = screen.getAllByRole("listitem");
  expect(
    cards.map((card) => within(card).getByRole("heading").textContent),
  ).toEqual([
    "useEffect 의존성 배열, 다시 생각하기",
    "Container Query로 진짜 컴포넌트 반응형 만들기",
    "React Server Components 멘탈 모델 한 장 정리",
    "satisfies 연산자, 언제 써야 하나",
    "히어로 이미지로 망가진 LCP를 1.2초 줄인 과정",
    "Vite로 모노레포 빌드를 30초에서 8초로",
    "짧은 메모: TOC가 숨겨지는 글",
  ]);
  const first = within(cards[0]);
  const postLink = first.getByRole("link", { name: /useEffect 의존성/ });
  expect(postLink).toHaveAttribute("href", "/posts/use-effect-deps");
  expect(postLink).toHaveTextContent("React");
  expect(postLink).toHaveTextContent("2026년 5월 28일");
  const tagLink = first.getByRole("link", { name: "#Hooks" });
  expect(tagLink).toHaveAttribute("href", "/tag/Hooks");
  expect(postLink).not.toContainElement(tagLink);
  // 태그 없는 글은 상세 링크 하나만 제공한다.
  expect(within(cards[3]).getAllByRole("link")).toHaveLength(1);
  const tagLinks = screen.getAllByRole("link", { name: /^#/ });
  expect(tagLinks.slice(0, 4).map((link) => link.textContent)).toEqual([
    "#렌더링",
    "#이미지",
    "#Hooks",
    "#RSC",
  ]);
});

test("카테고리는 해당 글과 태그만 보여주며 사이드바의 현재 분류를 표시한다", async () => {
  route.pathname = "/category/React/";
  const { default: CategoryPage } =
    await import("@/app/(ko)/category/[slug]/page");
  const { getCategories } = await import("@/lib/posts");
  render(
    <>
      <SidebarNav categories={await getCategories()} totalCount={7} />
      {await CategoryPage({ params: Promise.resolve({ slug: "React" }) })}
    </>,
  );
  expect(
    screen.getAllByRole("heading", { level: 2 }).map((el) => el.textContent),
  ).toEqual([
    "useEffect 의존성 배열, 다시 생각하기",
    "React Server Components 멘탈 모델 한 장 정리",
  ]);
  expect(screen.getByText("2개의 글")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /^React\s*2$/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(
    screen.getByRole("link", { name: /^전체 글\s*7$/ }),
  ).not.toHaveAttribute("aria-current");
  expect(
    screen.queryByRole("link", { name: "#이미지" }),
  ).not.toBeInTheDocument();
  expect(
    screen
      .getAllByRole("link", { name: /^#/ })
      .slice(0, 3)
      .map((el) => el.textContent),
  ).toEqual(["#렌더링", "#Hooks", "#RSC"]);
});

test("새 한글 카테고리는 파일에서 수집되고 인코딩된 경로에서도 선택된다", async () => {
  route.pathname = `/category/${encodeURIComponent("QA메모")}/`;
  const { default: CategoryPage } =
    await import("@/app/(ko)/category/[slug]/page");
  const { getCategories } = await import("@/lib/posts");
  render(
    <>
      <SidebarNav categories={await getCategories()} totalCount={7} />
      {await CategoryPage({
        params: Promise.resolve({ slug: encodeURIComponent("QA메모") }),
      })}
    </>,
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("QA메모");
  expect(screen.getByText("1개의 글")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /^QA메모\s*1$/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.getByRole("link", { name: /^QA메모\s*1$/ })).toHaveAttribute(
    "href",
    `/category/${encodeURIComponent("QA메모")}`,
  );
});

test("태그 페이지는 매칭한 글만 보여주고 현재 태그를 표시한다", async () => {
  const { default: TagPage } = await import("@/app/(ko)/tag/[slug]/page");
  render(
    await TagPage({
      params: Promise.resolve({ slug: encodeURIComponent("렌더링") }),
    }),
  );
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "#렌더링",
  );
  expect(screen.getByText("2개의 글")).toBeInTheDocument();
  expect(
    screen.getAllByRole("heading", { level: 2 }).map((el) => el.textContent),
  ).toEqual([
    "useEffect 의존성 배열, 다시 생각하기",
    "React Server Components 멘탈 모델 한 장 정리",
  ]);
  expect(screen.getAllByRole("link", { name: "#렌더링" })[0]).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(
    screen.getAllByRole("link", { name: "#Hooks" })[0],
  ).not.toHaveAttribute("aria-current");
  expect(screen.getByRole("link", { name: "#이미지" })).toBeInTheDocument();
});
