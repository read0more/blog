import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleClient } from "@/components/post/ArticleClient";
import { PostList } from "@/components/posts/PostList";
import {
  getAllPostMeta,
  getAllTags,
  getCategories,
  getPostBySlug,
  getPostsByCategory,
  getPostsByTag,
  tagsOf,
} from "@/lib/posts";
import { categoryLabel, tagLabel } from "@/lib/taxonomy.mjs";
import { getUiTranslator } from "@/lib/i18n";

type PageProps = { params: Promise<{ segments?: string[] }> };

export async function generateStaticParams() {
  const [posts, categories, tags] = await Promise.all([
    getAllPostMeta("en"),
    getCategories("en"),
    getAllTags("en"),
  ]);
  return [
    { segments: [] },
    ...posts.map((post) => ({ segments: ["posts", post.slug] })),
    ...categories.map((category) => ({
      segments: ["category", category.name],
    })),
    ...tags.map((tag) => ({ segments: ["tag", tag] })),
  ];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { segments = [] } = await params;
  if (segments.length === 2 && segments[0] === "posts") {
    const post = await getPostBySlug(segments[1], "en");
    if (post)
      return {
        title: `${post.title} · read0more`,
        description: post.description,
      };
  }
  if (segments.length === 2 && segments[0] === "category")
    return {
      title: `${categoryLabel(decodeURIComponent(segments[1]), "en")} · read0more`,
    };
  if (segments.length === 2 && segments[0] === "tag")
    return {
      title: `${tagLabel(decodeURIComponent(segments[1]), "en")} · read0more`,
    };
  return { title: "All posts · read0more — English" };
}

export default async function EnglishPage({ params }: PageProps) {
  const { segments = [] } = await params;
  if (segments.length === 0) {
    const posts = await getAllPostMeta("en");
    return (
      <PostList
        language="en"
        title={getUiTranslator("en")("allPosts")}
        subtitle={`${getUiTranslator("en")("postCount", { count: posts.length })} · ${getUiTranslator("en")("newest")}`}
        posts={posts}
        tags={tagsOf(posts)}
      />
    );
  }
  if (segments.length !== 2) notFound();
  const [kind, encodedName] = segments;
  const name = decodeURIComponent(encodedName);
  if (kind === "posts") {
    const post = await getPostBySlug(name, "en");
    if (!post) notFound();
    return <ArticleClient key={`${post.slug}:en`} post={post} />;
  }
  if (kind === "category" || kind === "tag") {
    const posts =
      kind === "category"
        ? await getPostsByCategory(name, "en")
        : await getPostsByTag(name, "en");
    if (!posts.length) notFound();
    return (
      <PostList
        language="en"
        title={
          kind === "category"
            ? categoryLabel(name, "en")
            : `#${tagLabel(name, "en")}`
        }
        subtitle={getUiTranslator("en")("postCount", { count: posts.length })}
        posts={posts}
        tags={kind === "category" ? tagsOf(posts) : await getAllTags("en")}
        activeTag={kind === "tag" ? name : undefined}
      />
    );
  }
  notFound();
}
