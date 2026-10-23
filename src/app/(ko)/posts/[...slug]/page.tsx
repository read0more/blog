import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPostRoutes, getPostBySlug } from "@/lib/posts";
import { ArticleClient } from "@/components/post/ArticleClient";
import { LegacyEnglishRedirect } from "@/components/post/LegacyEnglishRedirect";

/** 모든 글을 정적 생성. */
export async function generateStaticParams() {
  return getAllPostRoutes();
}

async function postAtPath(segments: string[]) {
  if (segments.length === 1) return getPostBySlug(segments[0]);
  if (segments.length === 2 && segments[1] === "en") {
    return getPostBySlug(segments[0], "en");
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await postAtPath(slug);
  if (!post) return { title: "read0more" };
  return {
    title: `${post.title} · read0more`,
    description: post.description,
    ...(post.language === "en" ? { robots: { index: false } } : {}),
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const post = await postAtPath(slug);
  if (!post) notFound();
  if (post.language === "en") return <LegacyEnglishRedirect slug={post.slug} />;

  return <ArticleClient key={`${post.slug}:${post.language}`} post={post} />;
}
