import { notFound } from "next/navigation";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import { PostList } from "@/components/posts/PostList";
import { getUiTranslator } from "@/lib/i18n";

/**
 * 태그별 글 목록. 카테고리와 같이 한글 태그명을 slug 로 쓴다.
 * generateStaticParams 가 raw 태그명을 내면 Next 가 URL 인코딩한다.
 */
export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((name) => ({ slug: name }));
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const name = decodeURIComponent(slug);

  const posts = await getPostsByTag(name);
  if (posts.length === 0) {
    notFound();
  }

  return (
    <PostList
      title={`#${name}`}
      subtitle={getUiTranslator("ko")("postCount", { count: posts.length })}
      posts={posts}
      tags={await getAllTags()}
      activeTag={name}
    />
  );
}
