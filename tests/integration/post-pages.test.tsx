import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { PostList } from "@/components/posts/PostList";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  notFound: () => {
    throw new Error("Not found");
  },
}));

// 서버 페이지 함수를 실제 파일 파이프라인과 연결해 렌더한다.
// Next 라우팅·정적 URL 서빙은 navigation E2E의 책임이다.
beforeAll(async () => {
  vi.stubEnv("POSTS_DIR", "tests/fixtures/posts");
  vi.stubEnv("OMIT_DRAFTS", "false");
  // 공통 픽스처의 마크다운 렌더링을 페이지 단언 전에 마친다.
  const { getAllPostMeta } = await import("@/lib/posts");
  await getAllPostMeta();
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
  // 목록 아래 태그 줄은 홈 글들의 태그를 글 수 내림차순으로 모두 보여준다.
  const tagRow = within(screen.getByRole("group", { name: "태그" }));
  expect(tagRow.getAllByRole("link").map((link) => link.textContent)).toEqual([
    "#렌더링",
    "#이미지",
    "#Hooks",
    "#RSC",
  ]);
});

test("목록은 최신 글 1개, 이어서 읽기 4개, 나머지 그리드로 나누고 글마다 카드 링크를 하나씩 둔다", async () => {
  const { default: Home } = await import("@/app/(ko)/page");
  const { getAllPostMeta } = await import("@/lib/posts");
  const posts = await getAllPostMeta();
  render(await Home());
  const [lead, next, grid] = screen.getAllByRole("list");
  expect(within(lead).getAllByRole("listitem")).toHaveLength(1);
  expect(lead).toHaveTextContent("최신 글");
  expect(next).toBe(screen.getByRole("list", { name: "이어서 읽기" }));
  expect(within(next).getAllByRole("listitem")).toHaveLength(4);
  expect(within(grid).getAllByRole("listitem")).toHaveLength(posts.length - 5);
  expect(
    screen
      .getAllByTestId(/^post-card-/)
      .map((card) => card.getAttribute("data-testid")),
  ).toEqual(posts.map((post) => `post-card-${post.slug}`));
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
    within(screen.getByRole("group", { name: "태그" }))
      .getAllByRole("link")
      .map((el) => el.textContent),
  ).toEqual(["#렌더링", "#Hooks", "#RSC"]);
});

test("헤더 카테고리 내비는 현재 분류를 표시하고, 모바일 메뉴는 열린 동안에만 접근성 트리에 나타난다", async () => {
  route.pathname = "/category/React/";
  const { getCategories } = await import("@/lib/posts");
  const user = userEvent.setup();
  render(
    <AppShell categories={await getCategories()} tags={[]} totalCount={7}>
      {null}
    </AppShell>,
  );
  const headerNav = within(screen.getByRole("banner")).getByRole("navigation", {
    name: "카테고리",
  });
  expect(
    within(headerNav).getByRole("link", { name: /^React\s*2$/ }),
  ).toHaveAttribute("aria-current", "page");
  // 닫힌 모바일 메뉴의 같은 내비는 aria-hidden 으로 빠져 헤더 내비 하나만 남는다.
  expect(screen.getAllByRole("navigation")).toEqual([headerNav]);

  const drawer = screen.getByTestId("sidebar-mobile");
  await user.click(screen.getByRole("button", { name: "메뉴" }));
  expect(drawer).toHaveAttribute("aria-hidden", "false");
  expect(
    within(drawer).getByRole("navigation", { name: "카테고리" }),
  ).toBeInTheDocument();
  await user.click(screen.getByTestId("sidebar-scrim"));
  expect(drawer).toHaveAttribute("aria-hidden", "true");
  await user.click(screen.getByRole("button", { name: "메뉴" }));
  await user.click(within(drawer).getByRole("button", { name: "닫기" }));
  expect(drawer).toHaveAttribute("aria-hidden", "true");
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
  // 글이 하나뿐이면 최신 글만 그리고 이어서 읽기 구역은 만들지 않는다.
  expect(screen.queryByText("이어서 읽기")).not.toBeInTheDocument();
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
  // 태그 줄은 전체 태그를 보여주고 현재 태그 하나에만 aria-current 를 붙인다.
  const tagRow = within(screen.getByRole("group", { name: "태그" }));
  expect(tagRow.getByRole("link", { name: "#렌더링" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(tagRow.getByRole("link", { name: "#Hooks" })).not.toHaveAttribute(
    "aria-current",
  );
  expect(tagRow.getByRole("link", { name: "#이미지" })).toBeInTheDocument();
  expect(tagRow.getAllByRole("link", { current: "page" })).toHaveLength(1);
});

test("영어 목록은 최신 글·이어서 읽기·태그 라벨을 영어로 보여준다", async () => {
  // 공통 픽스처의 영어 번역은 하나뿐이라 구역 라벨만 보려고 원문 글 목록을 영어 화면에 넣는다.
  const { getAllPostMeta, tagsOf } = await import("@/lib/posts");
  const posts = await getAllPostMeta();
  render(
    <PostList
      language="en"
      title="All posts"
      subtitle=""
      posts={posts}
      tags={tagsOf(posts)}
    />,
  );
  expect(screen.getAllByRole("list")[0]).toHaveTextContent("Latest post");
  expect(screen.getByRole("list", { name: "Read next" })).toBeInTheDocument();
  expect(
    within(screen.getByRole("group", { name: "Tags" })).getByRole("link", {
      name: "#Rendering",
    }),
  ).toBeInTheDocument();
  expect(screen.queryByText("최신 글")).not.toBeInTheDocument();
});
