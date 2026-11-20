import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAllDocs, getCategories } from "@/lib/content";

export default function Home() {
  const categories = getCategories();
  const first = getAllDocs()[0];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <section className="max-w-3xl">
        <p className="mb-5 inline-flex rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          {getAllDocs().length} topics · {categories.length} categories
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Web Security Essentials
        </h1>
        <p className="mt-5 text-base text-pretty text-muted-foreground sm:text-lg">
          A practical, interview-ready guide to how the web gets attacked and defended — XSS, CSRF, CORS,
          HTTPS, supply-chain risk, and the backend vulnerabilities that matter.
        </p>
        {first && (
          <Link
            href={`/docs/${first.slug}`}
            className="mt-8 inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
          >
            Start reading <ArrowRight className="size-4" />
          </Link>
        )}
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((c) => (
          <div key={c.slug} className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold">{c.title}</h2>
            <ul className="mt-3 space-y-1.5">
              {c.docs.slice(0, 6).map((d) => (
                <li key={d.slug}>
                  <Link
                    href={`/docs/${d.slug}`}
                    className="block truncate text-sm text-muted-foreground hover:text-foreground"
                  >
                    {d.title}
                  </Link>
                </li>
              ))}
              {c.docs.length > 6 && (
                <li className="pt-1 text-xs text-muted-foreground">+{c.docs.length - 6} more in the sidebar</li>
              )}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
