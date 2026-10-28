"use client";
import {
  ArrowBigDown, ArrowBigUp, Check, Clock, Download, Expand, ExternalLink, Eye, FileImage, HardDrive,
  Heart, Link2, LoaderCircle, MessageSquare, Monitor, Ratio, Smartphone, User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FavouriteButton } from "./favourite-button";
import { useFavourites } from "./providers";
import { cn } from "@/lib/cn";
import { estimateVotes, formatBytes, formatCount, pickThumb, ratioLabel, resolutionTag, timeAgo } from "@/lib/ranking";
import type { Wallpaper } from "@/lib/types";

function useRecordView(id: string) {
  useEffect(() => {
    const key = `wr-viewed-${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // No session storage; count the view anyway.
    }
    fetch(`/api/view/${id}`, { method: "POST", keepalive: true }).catch(() => {});
  }, [id]);
}

function Stat({ icon: Icon, label, value, hint }: { icon: React.ElementType; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-sunken/70 px-3 py-2.5" title={hint}>
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-subtle">
        <Icon className="size-3.5" />
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm font-semibold text-fg">{value}</dd>
    </div>
  );
}

function DownloadButton({ w }: { w: Wallpaper }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  return (
    <a
      href={`/api/download/${w.id}`}
      download
      onClick={() => {
        setState("busy");
        // The browser shows its own download progress; reset our button shortly after.
        setTimeout(() => setState("done"), 1200);
        setTimeout(() => setState("idle"), 3500);
      }}
      title="Download the full original image"
      className="inline-flex h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent px-5 font-medium text-accent-fg shadow-lg shadow-accent/25 transition-transform hover:scale-[1.02] active:scale-95"
    >
      {state === "busy" ? <LoaderCircle className="size-5 animate-spin" /> : state === "done" ? <Check className="size-5" /> : <Download className="size-5" />}
      Download
      <span className="text-sm font-normal opacity-75">{formatBytes(w.fileSize)}</span>
    </a>
  );
}

function CopyLink({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(`${location.origin}/w/${id}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      aria-label="Copy link"
      className="grid size-11 place-items-center rounded-full bg-hover text-fg transition-colors hover:bg-line"
    >
      {copied ? <Check className="size-5 text-accent" /> : <Link2 className="size-5" />}
    </button>
  );
}

export function WallpaperDetail({ w, related, inModal = false }: { w: Wallpaper; related: Wallpaper[]; inModal?: boolean }) {
  useRecordView(w.id);
  const { has, authReady } = useFavourites();
  const [full, setFull] = useState(false);
  const [zoom, setZoom] = useState(false);
  // The server count already includes this user's favourite, so only show the change since load.
  const [baseline, setBaseline] = useState<boolean | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- capture once favourites have loaded
    if (authReady && baseline === null) setBaseline(has(w.id));
  }, [authReady, baseline, has, w.id]);
  const { ups, downs } = estimateVotes(w.score, w.upvoteRatio);
  const favCount = w.favouritesCount + (baseline === null ? 0 : Number(has(w.id)) - Number(baseline));
  const tag = resolutionTag(w.width, w.height);
  const preview = pickThumb(w.thumbs, 1600, w.imageUrl);

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]", inModal ? "lg:h-full" : "")}>
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-2xl bg-sunken",
          inModal ? "min-h-[40vh] lg:h-full" : "min-h-[50vh] lg:h-[calc(100vh-8rem)]",
          zoom ? "cursor-zoom-out" : "cursor-zoom-in",
        )}
        onClick={() => setZoom((z) => !z)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- preview shows instantly; the original loads over it */}
        <img src={preview} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-3xl" />
        <div
          className={cn("relative max-h-full max-w-full transition-transform duration-500 ease-out", zoom && "scale-[1.8]")}
          style={{ aspectRatio: `${w.width} / ${w.height}`, height: w.orientation === "portrait" ? "100%" : undefined, width: w.orientation === "portrait" ? undefined : "100%" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={w.title} className="absolute inset-0 size-full object-contain shadow-2xl" />
          {/* eslint-disable-next-line @next/next/no-img-element -- the full original fades in over the preview */}
          <img
            src={w.imageUrl}
            alt=""
            aria-hidden
            onLoad={() => setFull(true)}
            className={cn("absolute inset-0 size-full object-contain transition-opacity duration-500", full ? "opacity-100" : "opacity-0")}
          />
        </div>
        {!full && <LoaderCircle className="absolute bottom-4 right-4 size-5 animate-spin text-white/70" />}
        <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white backdrop-blur">
          <Expand className="size-3" /> Click to {zoom ? "fit" : "zoom"}
        </span>
      </div>

      <aside className={cn("flex flex-col gap-5", inModal && "lg:overflow-y-auto lg:pr-1")}>
        <div>
          <Link
            href={`/r/${w.subreddit}`}
            className="inline-flex items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent/25"
          >
            r/{w.subreddit}
          </Link>
          <h1 className="mt-3 text-xl font-semibold leading-snug text-fg">{w.title}</h1>
          <a
            href={`https://www.reddit.com/user/${w.author}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent"
          >
            <User className="size-4" /> u/{w.author}
          </a>
        </div>

        <div className="flex gap-2">
          <DownloadButton w={w} />
          <FavouriteButton id={w.id} size="lg" className="!px-0 size-11" />
          <CopyLink id={w.id} />
        </div>

        <dl className="grid grid-cols-2 gap-2">
          <Stat icon={w.orientation === "portrait" ? Smartphone : Monitor} label="Resolution" value={`${w.width} × ${w.height}${tag ? ` · ${tag}` : ""}`} />
          <Stat icon={Ratio} label="Ratio" value={ratioLabel(w.width, w.height)} />
          <Stat icon={HardDrive} label="Size" value={formatBytes(w.fileSize)} />
          <Stat icon={FileImage} label="Type" value={(w.mime ?? "image/jpeg").replace("image/", "").toUpperCase()} />
          <Stat icon={Eye} label="Views" value={formatCount(w.views)} hint="Views on this site" />
          <Stat icon={Heart} label="Favourites" value={formatCount(favCount)} />
          <Stat icon={ArrowBigUp} label="Upvotes" value={`≈ ${formatCount(ups)}`} hint="Estimated from score and upvote ratio" />
          <Stat icon={ArrowBigDown} label="Downvotes" value={`≈ ${formatCount(downs)}`} hint="Reddit hides exact downvotes; estimated" />
          <Stat icon={MessageSquare} label="Comments" value={formatCount(w.numComments)} />
          <Stat icon={Clock} label="Posted" value={timeAgo(w.createdUtc)} hint={new Date(w.createdUtc).toUTCString()} />
        </dl>

        <a
          href={w.permalink}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-3 rounded-2xl border border-line p-4 transition-colors hover:border-[#ff4500]/60 hover:bg-[#ff4500]/5"
        >
          <span className="grid size-10 place-items-center rounded-full bg-[#ff4500] text-white">
            <svg viewBox="0 0 20 20" className="size-6" fill="currentColor" aria-hidden>
              <circle cx="10" cy="11" r="5.2" fill="white" />
              <circle cx="8" cy="10.6" r="0.9" fill="#ff4500" />
              <circle cx="12" cy="10.6" r="0.9" fill="#ff4500" />
              <path d="M7.8 13c1.2.9 3.2.9 4.4 0" stroke="#ff4500" strokeWidth="0.8" fill="none" strokeLinecap="round" />
              <circle cx="14.6" cy="5.4" r="1.1" fill="white" />
            </svg>
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-fg">Open on Reddit</span>
            <span className="block text-xs text-muted">Vote, comment and award the original post</span>
          </span>
          <ExternalLink className="size-4 text-subtle transition-transform group-hover:translate-x-0.5" />
        </a>

        {related.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-fg">More from r/{w.subreddit}</h2>
              <Link href={`/r/${w.subreddit}`} className="text-xs text-accent hover:underline">
                See all
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {related.map((r) => (
                <Link key={r.id} href={`/w/${r.id}`} scroll={false} replace={inModal} className="group relative aspect-square overflow-hidden rounded-lg bg-sunken">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pickThumb(r.thumbs, 200, r.imageUrl)}
                    alt={r.title}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
