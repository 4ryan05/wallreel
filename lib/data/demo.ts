import "server-only";
import { RATIO_TOLERANCE, RATIOS, hotScore, orientationOf } from "../ranking";
import { TOP_WINDOW_SECONDS } from "../query";
import { SUBREDDITS } from "../subreddits";
import type { Page, Subreddit, Wallpaper, WallpaperQuery } from "../types";
import photos from "./demo-photos.json";

// Demo mode: a deterministic set of sample wallpapers (photos from Lorem Picsum) arranged
// as if they came from the configured subreddits, so the whole UI works without credentials.

const SIZES: [number, number][] = [
  [3840, 2160], [2560, 1440], [1920, 1080], [3440, 1440], [2560, 1600], [5120, 1440],
  [1080, 1920], [1170, 2532], [1440, 3200], [1290, 2796], [2160, 3840], [1080, 2400],
];
const TITLES = [
  "Morning fog over the valley", "Quiet harbour at dusk", "Neon rain", "Above the clouds",
  "Golden hour in the hills", "Minimal dunes", "Northern lights", "Forest trail after rain",
  "Lonely lighthouse", "City lights from above", "Calm lake reflections", "Snowy peaks",
  "Desert road", "Autumn colours", "Coastal cliffs", "Starry night sky", "Rainy window",
  "Old town streets", "Mountain lake", "Abstract waves", "Sunset over the sea", "Misty pines",
];

function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function picsum(id: number, w: number, h: number) {
  return `https://picsum.photos/id/${id}/${w}/${h}`;
}

interface Store {
  wallpapers: Wallpaper[];
  subreddits: Omit<Subreddit, "cover" | "wallpaperCount">[];
  createdAt: number;
}

let store: Store | null = null;
const views = new Map<string, number>();

function buildStore(): Store {
  const now = Date.now();
  const r = rand(42);
  const list = photos as [number, string][];
  const wallpapers: Wallpaper[] = list.map(([photoId, author], i) => {
    const sub = SUBREDDITS[i % SUBREDDITS.length];
    const pool = sub.category === "Mobile" ? SIZES.slice(6) : sub.category === "Desktop" ? SIZES.slice(0, 6) : SIZES;
    const [width, height] = pool[Math.floor(r() * pool.length)];
    // Picsum serves up to 5000px, so only the 5120-wide sample is scaled down.
    const scale = Math.max(width, height) > 5000 ? 5000 / Math.max(width, height) : 1;
    const ow = Math.round(width * scale);
    const oh = Math.round(height * scale);
    const ageSeconds = Math.floor(r() ** 2 * 86400 * 120);
    const score = Math.floor(r() ** 3 * 12000) + 3;
    const created = now / 1000 - ageSeconds;
    const thumbs = [320, 640, 960].map((w) => ({ w, h: Math.round((w * oh) / ow), u: picsum(photoId, w, Math.round((w * oh) / ow)) }));
    return {
      id: `demo${photoId}`,
      postId: `demo${photoId}`,
      subreddit: sub.name.toLowerCase(),
      title: `${TITLES[Math.floor(r() * TITLES.length)]} [${width}x${height}]`,
      author: author.replace(/\s+/g, "_"),
      permalink: `https://www.reddit.com/r/${sub.name}/`,
      imageUrl: picsum(photoId, ow, oh),
      thumbs,
      tinyUrl: picsum(photoId, 24, Math.max(8, Math.round((24 * oh) / ow))),
      width,
      height,
      orientation: orientationOf(width, height),
      fileSize: Math.round(width * height * (0.3 + r() * 0.5)),
      mime: "image/jpeg",
      score,
      upvoteRatio: Math.round((0.86 + r() * 0.13) * 100) / 100,
      numComments: Math.floor(score * (0.01 + r() * 0.05)),
      createdUtc: new Date(created * 1000).toISOString(),
      views: Math.floor(score * (2 + r() * 6)),
      favouritesCount: Math.floor(score * r() * 0.08),
      _hot: hotScore(score, created),
    } as Wallpaper & { _hot: number };
  });
  const subreddits = SUBREDDITS.map((s) => ({
    id: s.name.toLowerCase(),
    name: s.name,
    title: s.name.replace(/([a-z])([A-Z])/g, "$1 $2"),
    description: s.blurb,
    category: s.category,
    iconUrl: null,
    bannerUrl: null,
    subscribers: Math.floor(rand(s.name.length * 7919)() * 3_000_000) + 40_000,
  }));
  return { wallpapers, subreddits, createdAt: now };
}

function getStore(): Store {
  // Rebuild hourly so "new" and "top this week" stay meaningful on long-running dev servers.
  if (!store || Date.now() - store.createdAt > 3_600_000) store = buildStore();
  return store;
}

function withViews(w: Wallpaper): Wallpaper {
  const extra = views.get(w.id);
  return extra ? { ...w, views: w.views + extra } : w;
}

function matchesText(w: Wallpaper, q: string): boolean {
  const hay = `${w.title} ${w.subreddit} ${w.author}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term));
}

export function listWallpapers(q: WallpaperQuery): Page<Wallpaper> {
  const now = Date.now() / 1000;
  let items = getStore().wallpapers.map(withViews);
  if (q.ids) {
    const order = new Map(q.ids.map((id, i) => [id, i]));
    items = items.filter((w) => order.has(w.id)).sort((a, b) => order.get(a.id)! - order.get(b.id)!);
  }
  if (q.sub) items = items.filter((w) => w.subreddit === q.sub!.toLowerCase());
  if (q.q) items = items.filter((w) => matchesText(w, q.q!));
  if (q.device === "pc") items = items.filter((w) => w.orientation === "landscape");
  if (q.device === "mobile") items = items.filter((w) => w.orientation === "portrait");
  if (q.minRes) items = items.filter((w) => Math.min(w.width, w.height) >= q.minRes);
  if (q.ratio) {
    const target = RATIOS[q.ratio].value;
    items = items.filter((w) => Math.abs(w.width / w.height - target) / target <= RATIO_TOLERANCE);
  }
  if (!q.ids) {
    const window = TOP_WINDOW_SECONDS[q.t];
    if (q.sort === "top" && window) items = items.filter((w) => new Date(w.createdUtc).getTime() / 1000 >= now - window);
    const key: Record<WallpaperQuery["sort"], (w: Wallpaper) => number> = {
      hot: (w) => (w as Wallpaper & { _hot: number })._hot,
      new: (w) => new Date(w.createdUtc).getTime(),
      top: (w) => w.score,
      comments: (w) => w.numComments,
      favourites: (w) => w.favouritesCount,
      views: (w) => w.views,
    };
    items = [...items].sort((a, b) => key[q.sort](b) - key[q.sort](a));
  }
  const page = items.slice(q.cursor, q.cursor + q.limit);
  const next = q.cursor + q.limit;
  return { items: page.map(strip), nextCursor: next < items.length ? next : null };
}

function strip(w: Wallpaper): Wallpaper {
  const { _hot, ...rest } = w as Wallpaper & { _hot?: number };
  void _hot;
  return rest;
}

export function getWallpaper(id: string): Wallpaper | null {
  const w = getStore().wallpapers.find((x) => x.id === id);
  return w ? strip(withViews(w)) : null;
}

export function listSubreddits(): Subreddit[] {
  const { wallpapers, subreddits } = getStore();
  return subreddits.map((s) => {
    const own = wallpapers.filter((w) => w.subreddit === s.id);
    const cover = own.filter((w) => w.orientation === "landscape").sort((a, b) => b.score - a.score)[0] ?? own[0] ?? null;
    return { ...s, wallpaperCount: own.length, cover: cover ? strip(cover) : null };
  });
}

export function recordView(id: string) {
  views.set(id, (views.get(id) ?? 0) + 1);
}
