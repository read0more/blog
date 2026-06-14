import { notFound } from "next/navigation";
import { getCategories, getPostsByCategory } from "@/lib/posts";
import { PostList } from "@/components/posts/PostList";

/**
 * 카테고리별 글 목록. 한글 카테고리명을 slug 로 쓴다(PRD §3).
 * generateStaticParams 가 raw 카테고리명을 내면 Next 가 URL 인코딩한다.
 */
export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.name }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // 라우트 세그먼트는 인코딩되어 들어오므로 디코딩해 카테고리명과 매칭.
  const name = decodeURIComponent(slug);

  const posts = await getPostsByCategory(name);
  if (posts.length === 0) {
    notFound();
  }

  return (
    <PostList
      title={name}
      subtitle={`${posts.length}개의 글`}
      posts={posts}
    />
  );
}
