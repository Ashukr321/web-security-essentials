"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-mono text-sm text-red-500">Error</p>
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">Try again, or head back to the home page.</p>
      <div className="mt-2 flex gap-2">
        <button
          onClick={reset}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Try again
        </button>
        <Link href="/" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
          Go home
        </Link>
      </div>
    </main>
  );
}
