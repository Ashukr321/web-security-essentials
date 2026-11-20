import Shell, { type NavCategory } from "@/components/docs/Shell";
import { getCategories, getSearchIndex } from "@/lib/content";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const nav: NavCategory[] = getCategories().map((c) => ({
    slug: c.slug,
    title: c.title,
    docs: c.docs.map(({ slug, title, group }) => ({ slug, title, group })),
  }));
  return (
    <Shell nav={nav} search={getSearchIndex()}>
      {children}
    </Shell>
  );
}
