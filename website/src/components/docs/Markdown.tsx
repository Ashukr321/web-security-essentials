import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Link from "next/link";
import { docHrefForFile } from "@/lib/content";

const isExternal = (u: string) => /^([a-z]+:)?\/\//i.test(u) || u.startsWith("mailto:");

/** Renders a repo markdown file, rewriting relative images and .md links to site URLs. */
export default function Markdown({ body, file }: { body: string; file: string }) {
  const dir = path.posix.dirname(file);
  const resolve = (u: string) => path.posix.normalize(path.posix.join(dir, decodeURI(u)));

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        img: ({ src, alt }) => {
          const s = typeof src === "string" ? src : "";
          const url = !s || isExternal(s) || s.startsWith("/") ? s : `/content/${encodeURI(resolve(s))}`;
          // eslint-disable-next-line @next/next/no-img-element
          return <img src={url} alt={alt ?? ""} loading="lazy" className="mx-auto w-full rounded-lg" />;
        },
        a: ({ href = "", children }) => {
          if (isExternal(href))
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          if (href.startsWith("#")) return <a href={href}>{children}</a>;
          const [p, hash] = href.split("#");
          const target = p.endsWith(".md") ? docHrefForFile(resolve(p)) : undefined;
          // Links to notes that don't exist yet render as plain text instead of a 404.
          if (!target) return <span>{children}</span>;
          return <Link href={hash ? `${target}#${hash}` : target}>{children}</Link>;
        },
        table: ({ children }) => (
          <div className="overflow-x-auto">
            <table>{children}</table>
          </div>
        ),
      }}
    >
      {body}
    </ReactMarkdown>
  );
}
