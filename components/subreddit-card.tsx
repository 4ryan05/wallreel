import Link from "next/link";
import { formatCount, pickThumb } from "@/lib/ranking";
import type { Subreddit } from "@/lib/types";

export function SubredditCard({ s, index = 0 }: { s: Subreddit; index?: number }) {
  return (
    <Link
      href={`/r/${s.name}`}
      className="animate-rise group relative block aspect-[16/10] overflow-hidden rounded-2xl bg-sunken ring-1 ring-line/60 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30 hover:ring-accent/60"
      style={{ animationDelay: `${(index % 12) * 40}ms` }}
    >
      {s.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pickThumb(s.cover.thumbs, 640, s.cover.imageUrl)}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <div className="flex items-center gap-2">
          {s.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.iconUrl} alt="" className="size-7 rounded-full ring-2 ring-white/30" />
          ) : (
            <span className="grid size-7 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg">
              {s.name[0].toUpperCase()}
            </span>
          )}
          <h3 className="truncate font-semibold">r/{s.name}</h3>
        </div>
        <p className="mt-1.5 line-clamp-1 text-xs text-white/70">{s.description}</p>
        <p className="mt-2 flex gap-3 text-[11px] font-medium text-white/60">
          <span>{formatCount(s.subscribers)} members</span>
          <span>{formatCount(s.wallpaperCount)} wallpapers</span>
          <span className="ml-auto rounded-full bg-white/15 px-2 backdrop-blur">{s.category}</span>
        </p>
      </div>
    </Link>
  );
}
