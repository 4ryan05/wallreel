"use client";
import { ArrowBigUp, MessageSquare, Monitor, Smartphone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { FavouriteButton } from "./favourite-button";
import { cn } from "@/lib/cn";
import { formatCount, pickThumb, resolutionTag } from "@/lib/ranking";
import type { Wallpaper } from "@/lib/types";

/** Rows (1/20 of column width) a card spans in the masonry grid, plus one row of gap. */
export function rowSpan(w: Pick<Wallpaper, "width" | "height">) {
  const units = Math.round((20 * w.height) / w.width);
  return Math.min(46, Math.max(8, units)) + 1;
}

export function WallpaperImage({
  w,
  minWidth,
  className,
  priority = false,
}: {
  w: Wallpaper;
  minWidth: number;
  className?: string;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={cn("relative overflow-hidden bg-sunken", className)}>
      {w.tinyUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- tiny blurred placeholder
        <img src={w.tinyUrl} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover blur-xl" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- Reddit already serves resized previews */}
      <img
        src={pickThumb(w.thumbs, minWidth, w.imageUrl)}
        alt={w.title}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        ref={(el) => {
          if (el?.complete && el.naturalWidth) setLoaded(true);
        }}
        className={cn(
          "relative size-full object-cover transition-[opacity,transform,filter] duration-700 ease-out",
          loaded ? "opacity-100 blur-0" : "opacity-0 blur-md",
        )}
      />
    </div>
  );
}

export function WallpaperCard({ w, index = 0, showSub = true }: { w: Wallpaper; index?: number; showSub?: boolean }) {
  const tag = resolutionTag(w.width, w.height);
  return (
    <div className="masonry-item animate-rise" style={{ gridRowEnd: `span ${rowSpan(w)}`, animationDelay: `${(index % 12) * 35}ms` }}>
      <Link
        href={`/w/${w.id}`}
        scroll={false}
        className="group relative block size-full overflow-hidden rounded-xl bg-elev ring-1 ring-line/60 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/30 hover:ring-accent/60"
      >
        <WallpaperImage w={w} minWidth={420} className="size-full transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-black/45 px-1.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
            {w.orientation === "portrait" ? <Smartphone className="size-3" /> : <Monitor className="size-3" />}
            {w.width}×{w.height}
            {tag && <span className="ml-0.5 rounded bg-white/20 px-1 text-[10px] font-semibold">{tag}</span>}
          </span>
        </div>
        <FavouriteButton id={w.id} className="absolute right-2.5 top-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100" />
        <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-10 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">
          <p className="line-clamp-1 text-sm font-medium">{w.title}</p>
          <div className="mt-1 flex items-center gap-3 text-xs text-white/75">
            {showSub && <span className="truncate">r/{w.subreddit}</span>}
            <span className="ml-auto inline-flex items-center gap-0.5">
              <ArrowBigUp className="size-3.5" />
              {formatCount(w.score)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="size-3" />
              {formatCount(w.numComments)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
