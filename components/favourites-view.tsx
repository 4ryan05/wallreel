"use client";
import { useQuery } from "@tanstack/react-query";
import { Heart, Monitor, Smartphone, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useFavourites } from "./providers";
import { WallpaperCard } from "./wallpaper-card";
import { GridSkeleton } from "./wallpaper-grid";
import { cn } from "@/lib/cn";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Device, Page, Wallpaper } from "@/lib/types";

type Order = "added" | "top" | "new";

export function FavouritesView() {
  const { ids, user, authReady } = useFavourites();
  const [device, setDevice] = useState<Device>("all");
  const [order, setOrder] = useState<Order>("added");

  // Fetch in chunks of 60 ids; the list order is the order they were favourited.
  const { data, isPending } = useQuery({
    queryKey: ["favourites", ids],
    enabled: authReady && ids.length > 0,
    queryFn: async () => {
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += 60) chunks.push(ids.slice(i, i + 60));
      const pages = await Promise.all(
        chunks.map(async (c) => (await (await fetch(`/api/wallpapers?ids=${c.join(",")}&limit=60`)).json()) as Page<Wallpaper>),
      );
      return pages.flatMap((p) => p.items);
    },
    placeholderData: (prev) => prev,
  });

  let items = (data ?? []).filter((w) => ids.includes(w.id));
  if (device === "pc") items = items.filter((w) => w.orientation === "landscape");
  if (device === "mobile") items = items.filter((w) => w.orientation === "portrait");
  if (order === "top") items = [...items].sort((a, b) => b.score - a.score);
  if (order === "new") items = [...items].sort((a, b) => b.createdUtc.localeCompare(a.createdUtc));

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-fg">
            <Heart className="size-7 fill-accent text-accent" /> Favourites
          </h1>
          <p className="mt-1 text-muted">
            {ids.length} saved
            {!user && (
              <>
                {" "}
                on this device.{" "}
                {isSupabaseConfigured && (
                  <Link href="/login" className="text-accent hover:underline">
                    Sign in to keep them everywhere.
                  </Link>
                )}
              </>
            )}
          </p>
        </div>
        {ids.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-full border border-line bg-elev p-0.5">
              {([["all", LayoutGrid, "All"], ["pc", Monitor, "PC"], ["mobile", Smartphone, "Mobile"]] as const).map(([id, Icon, label]) => (
                <button
                  key={id}
                  onClick={() => setDevice(id)}
                  className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm", device === id ? "bg-hover text-fg" : "text-muted")}
                >
                  <Icon className="size-4" /> {label}
                </button>
              ))}
            </div>
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value as Order)}
              aria-label="Sort favourites"
              className="h-9 rounded-full border border-line bg-elev px-3 text-sm text-fg"
            >
              <option value="added">Recently added</option>
              <option value="top">Most upvoted</option>
              <option value="new">Newest posts</option>
            </select>
          </div>
        )}
      </div>
      <div className="mt-6">
        {!authReady || (ids.length > 0 && isPending) ? (
          <GridSkeleton count={8} />
        ) : ids.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-line py-24 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-accent/15">
              <Heart className="size-8 text-accent" />
            </span>
            <p className="text-lg font-medium text-fg">No favourites yet</p>
            <p className="max-w-sm text-muted">Tap the heart on any wallpaper to save it here.</p>
            <Link href="/" className="mt-2 rounded-full bg-accent px-5 py-2.5 font-medium text-accent-fg">
              Discover wallpapers
            </Link>
          </div>
        ) : items.length === 0 ? (
          <p className="py-20 text-center text-muted">No favourites match this filter.</p>
        ) : (
          <div className="masonry">
            {items.map((w, i) => (
              <WallpaperCard key={w.id} w={w} index={i} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
