"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Command } from "cmdk";
import { ChevronRight, FileText, Moon, PanelLeft, Search, ShieldCheck, Sun, X } from "lucide-react";
import type { SearchItem } from "@/lib/content";

export type NavCategory = {
  slug: string;
  title: string;
  docs: { slug: string; title: string; group?: string }[];
};

const noopSubscribe = () => () => {};

export default function Shell({
  nav,
  search,
  children,
}: {
  nav: NavCategory[];
  search: SearchItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const modKey = useSyncExternalStore(
    noopSubscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl"),
    () => "Ctrl",
  );

  const toggleSidebar = () =>
    window.matchMedia("(min-width: 1024px)").matches ? setDesktopOpen((o) => !o) : setMobileOpen((o) => !o);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const typing = (e.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable='true']");
      // e.code is layout-independent, so ⌘K / Ctrl+K also works with Shift held or non-QWERTY keyboards.
      if (mod && e.code === "KeyK") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (!typing && ((e.shiftKey && e.code === "Slash" && !mod) || (mod && e.code === "KeyB"))) {
        // Shift+/ (or Ctrl/⌘+B) toggles the sidebar.
        e.preventDefault();
        toggleSidebar();
      } else if (e.key === "/" && !mod && !typing) {
        e.preventDefault();
        setPaletteOpen(true);
      } else if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-dvh">
      {/* Mobile backdrop */}
      <div
        aria-hidden
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      {/* Mobile: slides in as a drawer. Desktop: width animates between 16rem and 0.
          `invisible` (applied after the transition ends) keeps hidden links out of the tab order. */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shrink-0 overflow-hidden border-r bg-card transition-[translate,width,visibility] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:max-w-none lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full max-lg:invisible"} ${desktopOpen ? "lg:visible lg:w-64" : "lg:invisible lg:w-0 lg:border-r-0"}`}
        aria-label="Topics"
      >
        <div className="flex h-full w-72 max-w-[85vw] flex-col lg:w-64 lg:max-w-none">
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-5 text-accent" aria-hidden />
            Web Security
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>
        <nav
          className="flex-1 overflow-y-auto overscroll-contain py-2"
          // Picking a topic closes the mobile drawer.
          onClick={(e) => (e.target as HTMLElement).closest("a") && setMobileOpen(false)}
        >
          {nav.map((c) => (
            <SidebarCategory key={c.slug} category={c} pathname={pathname} />
          ))}
        </nav>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur sm:px-4">
          <button
            onClick={toggleSidebar}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Toggle sidebar"
            title="Toggle sidebar (Shift+/)"
          >
            <PanelLeft className="size-4" />
          </button>
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-muted sm:max-w-xs"
          >
            <Search className="size-4 shrink-0" />
            <span className="truncate">Search topics…</span>
            <kbd className="ml-auto hidden rounded border bg-background px-1.5 font-mono text-[10px] sm:inline">
              {modKey} K
            </kbd>
          </button>
          <ThemeToggle />
        </header>
        <main className="flex-1">{children}</main>
      </div>

      <Palette open={paletteOpen} setOpen={setPaletteOpen} items={search} />
    </div>
  );
}

function SidebarCategory({ category, pathname }: { category: NavCategory; pathname: string }) {
  const active = category.docs.some((d) => pathname === `/docs/${d.slug}`);
  // null = user hasn't toggled yet, so follow the current route.
  const [toggled, setToggled] = useState<boolean | null>(null);
  const open = toggled ?? active;

  return (
    <div className="px-2">
      <button
        onClick={() => setToggled(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-medium hover:bg-muted"
      >
        {category.title}
        <ChevronRight
          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? "rotate-90" : ""}`}
        />
      </button>
      {/* grid-rows 0fr↔1fr animates to the list's real height; inert keeps collapsed links unfocusable. */}
      <div
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <ul className="ml-3 min-h-0 overflow-hidden border-l pl-2">
          <li aria-hidden className="h-1" />
          {category.docs.map((d, idx) => {
            const showGroup = d.group && d.group !== category.docs[idx - 1]?.group;
            const isActive = pathname === `/docs/${d.slug}`;
            return (
              <li key={d.slug}>
                {showGroup && (
                  <p className="mt-2 px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {d.group}
                  </p>
                )}
                <Link
                  href={`/docs/${d.slug}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`block rounded-md px-2 py-1.5 text-sm ${isActive ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  {d.title}
                </Link>
              </li>
            );
          })}
          <li aria-hidden className="h-2" />
        </ul>
      </div>
    </div>
  );
}

function Palette({
  open,
  setOpen,
  items,
}: {
  open: boolean;
  setOpen: (o: boolean) => void;
  items: SearchItem[];
}) {
  const router = useRouter();
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Search topics"
      // Every typed word must appear somewhere (cmdk's default fuzzy match is too loose for short terms like "cors").
      filter={(value, search) =>
        search
          .toLowerCase()
          .split(/\s+/)
          .every((w) => value.toLowerCase().includes(w))
          ? 1
          : 0
      }
      className="overflow-hidden rounded-xl border bg-card text-foreground shadow-2xl"
    >
      <div className="flex items-center gap-2 border-b px-3">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <Command.Input
          autoFocus
          placeholder="Search XSS, CSRF, CORS…"
          className="h-12 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
        />
      </div>
      <Command.List className="max-h-[60vh] overflow-y-auto overscroll-contain p-2">
        <Command.Empty className="py-6 text-center text-sm text-muted-foreground">No topics found.</Command.Empty>
        {categories.map((cat) => (
          <Command.Group key={cat} heading={cat}>
            {items
              .filter((i) => i.category === cat)
              .map((i) => (
                <Command.Item
                  key={i.slug}
                  value={`${i.title} ${i.group ?? ""} ${cat} ${i.slug}`}
                  onSelect={() => {
                    setOpen(false);
                    router.push(`/docs/${i.slug}`);
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground"
                >
                  <FileText className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">
                    {i.title}
                    {i.group && <span className="ml-2 text-xs opacity-60">{i.group}</span>}
                  </span>
                </Command.Item>
              ))}
          </Command.Group>
        ))}
      </Command.List>
    </Command.Dialog>
  );
}

function ThemeToggle() {
  // The icon follows the .dark class via CSS, so no React state can drift from the DOM.
  const toggle = () => {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {}
  };
  return (
    <button
      onClick={toggle}
      className="ml-auto rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label="Toggle theme"
    >
      <Sun className="hidden size-4 dark:block" />
      <Moon className="size-4 dark:hidden" />
    </button>
  );
}
