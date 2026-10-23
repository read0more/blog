import type { PostFrontmatter, PostLanguage } from "./types";

export interface PostFile {
  filePath: string;
  slug: string;
  category: string;
  englishFilePath?: string;
}

export function listPostFiles(postsDir: string): PostFile[];

export interface PostSource {
  slug: string;
  category: string;
  language: PostLanguage;
  hasEnglish: boolean;
  frontmatter: PostFrontmatter;
  content: string;
}

export function readPostSources(
  postsDir: string,
  omitDrafts?: boolean,
): PostSource[];
