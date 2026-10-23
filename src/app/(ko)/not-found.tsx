import { getAllPostMeta } from "@/lib/posts";
import { NotFoundView } from "@/components/NotFoundView";

/**
 * 404 — Next 가 잘못된 경로에 렌더하고, output:export 에서 404.html 로
 * 정적 생성된다(GitHub Pages 가 이 파일을 404 응답으로 서빙).
 */
export default async function NotFound() {
  const posts = await getAllPostMeta();
  return <NotFoundView recentPosts={posts.slice(0, 3)} />;
}
