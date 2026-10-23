import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export function listPostFiles(postsDir) {
  const files = [];
  const translations = [];
  const slugs = new Map();

  function visit(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, "ko"));

    for (const entry of entries) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(filePath);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

      const relativePath = path.relative(postsDir, filePath);
      const segments = relativePath.split(path.sep);
      if (segments.length < 2) {
        throw new Error(
          `Post "${relativePath}" must be inside a category directory. Use <category>/${entry.name}.`,
        );
      }

      const slug = entry.name.slice(0, -3);
      if (slug.endsWith(".en")) {
        translations.push({ filePath, slug: slug.slice(0, -3) });
        continue;
      }
      if (slugs.has(slug)) {
        throw new Error(
          `Duplicate post slug "${slug}": "${slugs.get(slug)}" and "${relativePath}". Post filenames must be unique across all categories.`,
        );
      }
      slugs.set(slug, relativePath);
      files.push({ filePath, slug, category: segments[0] });
    }
  }

  if (fs.existsSync(postsDir)) visit(postsDir);
  const originals = new Map(files.map((file) => [file.filePath, file]));
  for (const translation of translations) {
    const originalPath = path.join(
      path.dirname(translation.filePath),
      `${translation.slug}.md`,
    );
    const original = originals.get(originalPath);
    if (!original) {
      throw new Error(
        `Translation "${translation.filePath}" requires an adjacent original "${originalPath}".`,
      );
    }
    original.englishFilePath = translation.filePath;
  }
  return files;
}

function frontmatterOf(data, filePath, original) {
  const { title, description, draft } = data;
  const date = original ? original.date : data.date;
  const tags = original ? original.tags : (data.tags ?? []);
  if (
    typeof title !== "string" ||
    typeof description !== "string" ||
    typeof date !== "string"
  ) {
    throw new Error(
      `Invalid frontmatter in "${filePath}": title/description and the original date are required strings.`,
    );
  }
  if (
    !Array.isArray(tags) ||
    !tags.every((tag) => typeof tag === "string" && tag.length > 0)
  ) {
    throw new Error(
      `Invalid frontmatter in "${filePath}": tags must be an array of non-empty strings.`,
    );
  }
  if (typeof draft !== "undefined" && typeof draft !== "boolean") {
    throw new Error(
      `Invalid frontmatter in "${filePath}": draft must be a boolean.`,
    );
  }
  return {
    title,
    date,
    description,
    tags,
    ...(draft === undefined ? {} : { draft }),
  };
}

export function readPostSources(postsDir, omitDrafts = false) {
  return listPostFiles(postsDir).flatMap((file) => {
    const original = matter(fs.readFileSync(file.filePath, "utf8"));
    const frontmatter = frontmatterOf(original.data, file.filePath);
    if (omitDrafts && frontmatter.draft) return [];

    let english = null;
    if (file.englishFilePath) {
      const translated = matter(fs.readFileSync(file.englishFilePath, "utf8"));
      const metadata = frontmatterOf(
        translated.data,
        file.englishFilePath,
        frontmatter,
      );
      if (!omitDrafts || !metadata.draft) {
        english = { frontmatter: metadata, content: translated.content };
      }
    }

    const shared = {
      slug: file.slug,
      category: file.category,
      hasEnglish: Boolean(english),
    };
    const sources = [
      { ...shared, language: "ko", frontmatter, content: original.content },
    ];
    if (english) sources.push({ ...shared, language: "en", ...english });
    return sources;
  });
}
