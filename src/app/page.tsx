import { getAllPostMeta } from "@/lib/posts";
import { PostList } from "@/components/posts/PostList";

/** 홈 — 전체 글 최신순 목록. */
export default async function Home() {
  const posts = await getAllPostMeta();

  return (
    <PostList
      title="최신 글"
      subtitle={`${posts.length}개의 글 · 최신순`}
      posts={posts}
    />
  );
}
