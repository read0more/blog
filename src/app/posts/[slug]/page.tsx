import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllSlugs, getPostBySlug } from "@/lib/posts";
import { ArticleClient } from "@/components/post/ArticleClient";

/** 모든 글을 정적 생성. */
export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "read0more" };
  return {
    title: `${post.title} · read0more`,
    description: post.description,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return <ArticleClient post={post} />;
}
