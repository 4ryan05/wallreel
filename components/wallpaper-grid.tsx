"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ImageOff, LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { WallpaperCard } from "./wallpaper-card";
import type { Page, Wallpaper } from "@/lib/types";

/**
 * Infinite masonry grid. The server renders the first page; later pages come from
 * /api/wallpapers with the same query string, loaded as the sentinel nears the viewport.
 */
export function WallpaperGrid({
  initial,
  params,
  showSub = true,
  emptyText = "No wallpapers match these filters.",
}: {
  initial: Page<Wallpaper>;
  params: string;
  showSub?: boolean;
  emptyText?: string;
}) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isError } = useInfiniteQuery({
    queryKey: ["wallpapers", params],
    queryFn: async ({ pageParam }) => {
      const res = await fetch(`/api/wallpapers?${params}${params ? "&" : ""}cursor=${pageParam}`);
      if (!res.ok) throw new Error("Failed to load wallpapers");
      return (await res.json()) as Page<Wallpaper>;
    },
    initialPageParam: 0,
    initialData: { pages: [initial], pageParams: [0] },
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 60_000,
  });

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "1200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Pages can overlap when rankings shift between requests; show each wallpaper once.
  const seen = new Set<string>();
  const items = data.pages.flatMap((p) => p.items).filter((w) => !seen.has(w.id) && seen.add(w.id));

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line py-24 text-center text-muted">
        <ImageOff className="size-8" />
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <>
      <div className="masonry">
        {items.map((w, i) => (
          <WallpaperCard key={w.id} w={w} index={i} showSub={showSub} />
        ))}
      </div>
      <div ref={sentinel} className="flex h-24 items-center justify-center text-sm text-subtle">
        {isFetchingNextPage && <LoaderCircle className="size-5 animate-spin text-accent" />}
        {isError && (
          <button onClick={() => fetchNextPage()} className="rounded-full bg-hover px-4 py-2 text-fg">
            Couldn&apos;t load more. Retry
          </button>
        )}
        {!hasNextPage && items.length > 12 && <span>You&apos;ve reached the end</span>}
      </div>
    </>
  );
}

export function GridSkeleton({ count = 16 }: { count?: number }) {
  const spans = [12, 16, 21, 12, 37, 12, 9, 16, 21, 37, 12, 16];
  return (
    <div className="masonry" aria-busy>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="masonry-item" style={{ gridRowEnd: `span ${spans[i % spans.length]}` }}>
          <div className="skeleton size-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}
