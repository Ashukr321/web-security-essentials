import { describe, expect, it } from "vitest";
import { docHrefForFile, getAllDocs, getAssetFiles, getCategories } from "@/lib/content";

// Runs against the real markdown in the repo root.
describe("content loader", () => {
  const docs = getAllDocs();

  it("loads every numbered section as a category", () => {
    expect(getCategories().map((c) => c.slug)).toContain("client-side-security");
    expect(docs.length).toBeGreaterThan(10);
  });

  it("gives every doc a unique, URL-safe slug and a title", () => {
    const slugs = docs.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const d of docs) {
      expect(d.slug).toMatch(/^[a-z0-9-]+(\/[a-z0-9-]+)*$/);
      expect(d.title.length).toBeGreaterThan(0);
    }
  });

  it("maps README to its folder and strips number prefixes", () => {
    expect(docHrefForFile("03_Security_In_Transition/01_CSRF/README.md")).toBe("/docs/security-in-transition/csrf");
    expect(docHrefForFile("does/not/exist.md")).toBeUndefined();
  });

  it("names concept.md after its folder instead of 'Concept'", () => {
    expect(docs.some((d) => d.title === "Concept")).toBe(false);
  });

  it("shows every repo image on at least one page", () => {
    const onPages = new Set(
      docs.flatMap((d) => [
        ...d.images,
        // images the markdown itself embeds
        ...[...d.body.matchAll(/!\[[^\]]*\]\(\s*<?([^)\s>]+)|<img[^>]*\ssrc=["']([^"']+)["']/g)]
          .map((m) => m[1] ?? m[2])
          .filter((u) => !/^([a-z]+:)?\/\//i.test(u))
          .map((u) => decodeURI(new URL(u, `file:///${d.file}`).pathname.slice(1))),
      ]),
    );
    const missing = getAssetFiles()
      .filter((f) => /\.(svg|png|jpe?g|webp|gif)$/i.test(f) && !/\/mentorconnect_/.test(f))
      .filter((f) => !onPages.has(f));
    expect(missing).toEqual([]);
  });

  it("gives image-only folders their own page", () => {
    const auth = docs.find((d) => d.slug === "client-side-security/authentication-security");
    expect(auth?.images.length).toBe(3);
  });

  it("never exposes files from the app itself or git as assets", () => {
    expect(getAssetFiles().some((f) => /^(website|\.git|\.claude)\//.test(f))).toBe(false);
  });
});
