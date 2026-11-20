import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Markdown from "@/components/docs/Markdown";
import { getAllDocs, getDoc } from "@/lib/content";

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string[] }> };

export function generateStaticParams() {
  return getAllDocs().map((d) => ({ slug: d.slug.split("/") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = getDoc((await params).slug.join("/"));
  if (!doc) return {};
  return {
    title: `${doc.title} — ${doc.category}`,
    description: doc.description,
    alternates: { canonical: `/docs/${doc.slug}` },
    openGraph: { title: doc.title, description: doc.description, type: "article", url: `/docs/${doc.slug}` },
  };
}

export default async function DocPage({ params }: Props) {
  const slug = (await params).slug.join("/");
  const doc = getDoc(slug);
  if (!doc) notFound();

  const all = getAllDocs();
  const i = all.findIndex((d) => d.slug === slug);
  const prev = all[i - 1];
  const next = all[i + 1];

  return (
    <article className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Web Security
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span>{doc.category}</span>
        {doc.group && (
          <>
            <ChevronRight className="size-3.5" aria-hidden />
            <span>{doc.group}</span>
          </>
        )}
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="text-foreground">{doc.title}</span>
      </nav>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{doc.title}</h1>

      <div className="prose prose-zinc mt-6 max-w-none prose-p:leading-7 prose-headings:mt-8 prose-headings:mb-3 prose-h2:text-2xl dark:prose-invert prose-headings:scroll-mt-20 prose-a:text-accent prose-pre:overflow-x-auto prose-pre:border prose-pre:bg-muted prose-pre:text-foreground prose-img:my-6 [&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-muted [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-normal [&_:not(pre)>code]:before:content-none [&_:not(pre)>code]:after:content-none">
        {doc.body ? (
          <Markdown body={doc.body} file={doc.file} />
        ) : (
          <p className="text-muted-foreground">This topic is still being written. Check back soon.</p>
        )}
      </div>

      {doc.visualizations.map((v) => (
        <section key={v} className="mt-10">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Interactive visualization</h2>
            <a
              href={`/content/${encodeURI(v)}`}
              target="_blank"
              className="shrink-0 text-sm text-accent hover:underline"
            >
              Open full screen ↗
            </a>
          </div>
          <iframe
            src={`/content/${encodeURI(v)}`}
            title={`${doc.title} visualization`}
            loading="lazy"
            sandbox="allow-scripts"
            className="h-[70vh] min-h-[420px] w-full rounded-xl border bg-white"
          />
        </section>
      ))}

      <nav className="mt-14 grid gap-3 border-t pt-6 sm:grid-cols-2" aria-label="Pagination">
        {prev ? (
          <Link href={`/docs/${prev.slug}`} className="rounded-lg border p-4 hover:bg-muted">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronLeft className="size-3.5" /> Previous
            </span>
            <span className="mt-1 block font-medium">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/docs/${next.slug}`} className="rounded-lg border p-4 text-right hover:bg-muted">
            <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              Next <ChevronRight className="size-3.5" />
            </span>
            <span className="mt-1 block font-medium">{next.title}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
