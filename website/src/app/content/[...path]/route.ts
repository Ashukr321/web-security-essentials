import fs from "node:fs";
import path from "node:path";
import { CONTENT_ROOT, getAssetFiles } from "@/lib/content";

// Only the pre-listed files are built; any other path 404s (no traversal possible).
export const dynamicParams = false;

export function generateStaticParams() {
  return getAssetFiles().map((p) => ({ path: p.split("/") }));
}

const TYPES: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const rel = (await params).path.map(decodeURIComponent).join("/");
  if (!getAssetFiles().includes(rel)) return new Response("Not found", { status: 404 });
  const data = fs.readFileSync(path.join(CONTENT_ROOT, rel));
  return new Response(data, {
    headers: {
      "Content-Type": TYPES[path.extname(rel).toLowerCase()] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
