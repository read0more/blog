import fs from "node:fs";
import path from "node:path";

export function listPostFiles(postsDir) {
  const files = [];
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
  return files;
}
