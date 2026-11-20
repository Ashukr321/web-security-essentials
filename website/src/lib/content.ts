import fs from "node:fs";
import path from "node:path";

// The markdown lives in the repo root, one level above this Next.js app.
export const CONTENT_ROOT = path.resolve(
  process.env.CONTENT_DIR || path.join(process.cwd(), ".."),
);

// Files under these folders may be served at /content/* (images, visualizations).
const ASSET_EXT = new Set([".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".html"]);
const SKIP_DIRS = new Set(["website", "node_modules", ".git", ".claude", ".vscode"]);

export type Doc = {
  slug: string; // e.g. "client-side-security/xss-vulnerabilities/dom-based-xss"
  file: string; // repo-relative path with forward slashes
  title: string;
  description: string;
  category: string; // top-level section title
  categorySlug: string;
  group?: string; // sub-folder title inside a section
  body: string;
  visualizations: string[]; // repo-relative .html files to embed
};

export type Category = { slug: string; title: string; docs: Doc[] };

const stripNum = (s: string) => s.replace(/^\d+[_-]/, "");
const slugify = (s: string) =>
  stripNum(s)
    .replace(/\.md$/i, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
const titleize = (s: string) =>
  stripNum(s)
    .replace(/\.md$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b(xss|csp|csrf|cors|https|hsts|sql|ssrf|api|llm|nosql)\b/gi, (m) => m.toUpperCase())
    .replace(/\b\w/g, (c) => c.toUpperCase());

function toDoc(rel: string, category: string, categorySlug: string): Doc {
  const raw = fs.readFileSync(path.join(CONTENT_ROOT, rel), "utf8").replace(/\r\n/g, "\n");
  const parts = rel.split("/");
  const isReadme = /^readme\.md$/i.test(parts.at(-1)!);
  const dirParts = parts.slice(0, -1);
  const slugParts = [...dirParts.map(slugify), ...(isReadme ? [] : [slugify(parts.at(-1)!)])];

  const h1 = raw.match(/^#\s+(.+)$/m);
  // README.md / concept.md are named after their folder.
  const fallback =
    isReadme || /^concept\.md$/i.test(parts.at(-1)!)
      ? titleize(dirParts.at(-1) ?? "Overview")
      : titleize(parts.at(-1)!);
  // Some notes use a long sentence as their H1, so keep titles short.
  const title = h1 && h1[1].length <= 60 ? h1[1].replace(/[*_`]/g, "").trim() : fallback;
  const body = h1 && h1[1].length <= 60 ? raw.replace(h1[0], "").trim() : raw.trim();

  const firstPara =
    body
      .split(/\n{2,}/)
      .find((p) => /^[A-Za-z*_]/.test(p.trim()) && !p.trim().startsWith("**Level"))
      ?.replace(/[*_`#>\[\]]|\(.*?\)/g, "")
      .replace(/\s+/g, " ")
      .trim() ?? "";
  const description = (firstPara || `${title} — ${category}.`).slice(0, 160);

  const dir = path.join(CONTENT_ROOT, ...dirParts);
  const visualizations = isReadme
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".html"))
        .map((f) => [...dirParts, f].join("/"))
    : [];

  return {
    slug: slugParts.join("/") || "overview",
    file: rel,
    title,
    description,
    category,
    categorySlug,
    group: dirParts.length > 1 ? titleize(dirParts[1]) : undefined,
    body,
    visualizations,
  };
}

function walkMd(relDir: string): string[] {
  const out: string[] = [];
  const entries = fs
    .readdirSync(path.join(CONTENT_ROOT, relDir), { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  // README first, then loose files, then sub-folders.
  const files = entries.filter((e) => e.isFile() && e.name.endsWith(".md"));
  files.sort((a, b) => Number(/^readme/i.test(b.name)) - Number(/^readme/i.test(a.name)));
  for (const f of files) out.push(`${relDir}/${f.name}`);
  for (const d of entries.filter((e) => e.isDirectory())) out.push(...walkMd(`${relDir}/${d.name}`));
  return out;
}

let cache: Category[] | null = null;

export function getCategories(): Category[] {
  if (cache) return cache;
  const sections = fs
    .readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d+_/.test(e.name))
    .map((e) => e.name)
    .sort();

  cache = sections.map((dir) => {
    const title = titleize(dir);
    const slug = slugify(dir);
    const docs = walkMd(dir).map((rel) => toDoc(rel, title, slug));
    if (dir.startsWith("01_") && fs.existsSync(path.join(CONTENT_ROOT, "README.md"))) {
      docs.unshift({ ...toDoc("README.md", title, slug), title: "Overview", slug: "overview" });
    }
    return { slug, title, docs };
  });
  return cache;
}

export const getAllDocs = () => getCategories().flatMap((c) => c.docs);

export const getDoc = (slug: string) => getAllDocs().find((d) => d.slug === slug);

/** Map a repo-relative .md path to its doc URL, if that file exists. */
export function docHrefForFile(rel: string): string | undefined {
  const doc = getAllDocs().find((d) => d.file.toLowerCase() === rel.toLowerCase());
  return doc ? `/docs/${doc.slug}` : undefined;
}

/** Every servable asset (svg/png/html…) in the repo, repo-relative. */
export function getAssetFiles(rel = ""): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(path.join(CONTENT_ROOT, rel), { withFileTypes: true })) {
    const p = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) out.push(...getAssetFiles(p));
    } else if (ASSET_EXT.has(path.extname(e.name).toLowerCase())) out.push(p);
  }
  return out;
}

/** Light search index for the command palette (no full bodies, keeps the client bundle small). */
export const getSearchIndex = () =>
  getAllDocs().map(({ slug, title, category, group, description }) => ({
    slug,
    title,
    category,
    group,
    description,
  }));
export type SearchItem = ReturnType<typeof getSearchIndex>[number];
