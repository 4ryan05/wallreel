"use client";
import { useQuery } from "@tanstack/react-query";
import { CornerDownLeft, Hash, LoaderCircle, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { pickThumb } from "@/lib/ranking";
import type { Wallpaper } from "@/lib/types";

interface Results {
  subreddits: { id: string; name: string; title: string; category: string; thumb: string | null }[];
  wallpapers: Wallpaper[];
}

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const debounced = useDebounced(q.trim(), 160);
  const { data, isFetching } = useQuery({
    queryKey: ["quick-search", debounced],
    queryFn: async () => (await (await fetch(`/api/search?q=${encodeURIComponent(debounced)}`)).json()) as Results,
    enabled: open,
    placeholderData: (prev) => prev,
  });

  const items = useMemo(() => {
    const list: { key: string; href: string; node: React.ReactNode }[] = [];
    if (debounced) {
      list.push({
        key: "search",
        href: `/search?q=${encodeURIComponent(debounced)}`,
        node: (
          <>
            <Search className="size-4 text-accent" />
            <span>
              Search wallpapers for <b className="text-fg">“{debounced}”</b>
            </span>
          </>
        ),
      });
    }
    for (const s of data?.subreddits ?? []) {
      list.push({
        key: `r-${s.id}`,
        href: `/r/${s.name}`,
        node: (
          <>
            {s.thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.thumb} alt="" className="size-8 rounded-lg object-cover" />
            ) : (
              <Hash className="size-4" />
            )}
            <span className="flex-1">r/{s.name}</span>
            <span className="text-xs text-subtle">{s.category}</span>
          </>
        ),
      });
    }
    for (const w of data?.wallpapers ?? []) {
      list.push({
        key: `w-${w.id}`,
        href: `/w/${w.id}`,
        node: (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pickThumb(w.thumbs, 100, w.imageUrl)} alt="" className="h-8 w-12 rounded-md object-cover" />
            <span className="flex-1 truncate">{w.title}</span>
            <span className="text-xs text-subtle">r/{w.subreddit}</span>
          </>
        ),
      });
    }
    return list;
  }, [data, debounced]);

  useEffect(() => {
    if (open) {
      setTimeout(() => input.current?.focus(), 10);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when closed
      setQ("");
    }
  }, [open]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- highlight the first result for each new query
  useEffect(() => setActive(0), [debounced]);

  function go(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-[var(--overlay)] px-4 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-label="Search"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-elev shadow-2xl shadow-black/40"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              {isFetching ? <LoaderCircle className="size-5 animate-spin text-subtle" /> : <Search className="size-5 text-subtle" />}
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") onClose();
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(a + 1, items.length - 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(a - 1, 0));
                  }
                  if (e.key === "Enter" && items[active]) go(items[active].href);
                }}
                placeholder="Search subreddits and wallpapers…"
                className="h-14 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-subtle"
              />
              <kbd className="rounded-md border border-line px-1.5 py-0.5 text-[11px] text-subtle">Esc</kbd>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto p-2">
              {!debounced && <li className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-subtle">Subreddits</li>}
              {items.map((item, i) => (
                <li key={item.key}>
                  <button
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(item.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-muted",
                      i === active && "bg-hover text-fg",
                    )}
                  >
                    {item.node}
                    {i === active && <CornerDownLeft className="size-3.5 text-subtle" />}
                  </button>
                </li>
              ))}
              {debounced && !isFetching && items.length <= 1 && (
                <li className="px-3 py-6 text-center text-sm text-subtle">No quick matches. Press Enter to search everything.</li>
              )}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
