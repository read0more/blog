export interface PostFile {
  filePath: string;
  slug: string;
  category: string;
}

export function listPostFiles(postsDir: string): PostFile[];
