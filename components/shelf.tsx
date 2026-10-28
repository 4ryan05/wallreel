import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { WallpaperImage } from "./wallpaper-card";
import type { Wallpaper } from "@/lib/types";

export function SectionHeader({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent">
          See all <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

/** Horizontal scroller of portrait wallpapers. */
export function PhoneShelf({ items }: { items: Wallpaper[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
      {items.map((w) => (
        <Link
          key={w.id}
          href={`/w/${w.id}`}
          scroll={false}
          className="group relative w-40 shrink-0 snap-start overflow-hidden rounded-2xl ring-1 ring-line/60 transition hover:-translate-y-1 hover:ring-accent/60 sm:w-48"
          style={{ aspectRatio: "9 / 19" }}
        >
          <WallpaperImage w={w} minWidth={320} className="size-full transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 text-xs text-white/85">
            r/{w.subreddit}
          </div>
        </Link>
      ))}
    </div>
  );
}
