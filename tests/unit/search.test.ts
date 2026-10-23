import { expect, test } from "vitest";
import { searchDocs, makeSnippet } from "@/lib/search";
import type { SearchDoc } from "@/lib/types";

const docs: SearchDoc[] = [
  {
    slug: "new",
    title: "새 글",
    description: "",
    categories: ["React"],
    tags: ["Hooks"],
    text: "의존성 배열 Hooks",
  },
  {
    slug: "old",
    title: "이전 글",
    description: "",
    categories: ["React"],
    tags: ["Hooks"],
    text: "hooks 사용법",
  },
];

test("검색은 공백·대소문자를 정규화하고 인덱스의 최신순을 보존한다", () => {
  expect(searchDocs(docs, "  hOoKs ").map((result) => result.slug)).toEqual([
    "new",
    "old",
  ]);
  expect(searchDocs(docs, "의존성").map((result) => result.slug)).toEqual([
    "new",
  ]);
  expect(searchDocs(docs, "   ")).toEqual([]);
  expect(searchDocs(docs, "없는 단어")).toEqual([]);
});

test("스니펫은 검색어의 원문을 강조하고 앞뒤 맥락을 보존한다", () => {
  expect(makeSnippet("문맥 속 Hooks 사용법", "hooks")).toEqual([
    { text: "문맥 속 ", isMark: false },
    { text: "Hooks", isMark: true },
    { text: " 사용법…", isMark: false },
  ]);
});
