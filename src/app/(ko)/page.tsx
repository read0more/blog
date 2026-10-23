import { getAllPostMeta, tagsOf } from "@/lib/posts";
import { PostList } from "@/components/posts/PostList";
import { getUiTranslator } from "@/lib/i18n";

/** 홈 — 전체 글 최신순 목록. */
export default async function Home() {
  const posts = await getAllPostMeta();
  const translate = getUiTranslator("ko");

  return (
    <PostList
      title={translate("allPosts")}
      subtitle={`${translate("postCount", { count: posts.length })} · ${translate("newest")}`}
      posts={posts}
      tags={tagsOf(posts)}
    />
  );
}
