import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { isSupabaseConfigured } from "../supabase/config";
import type { Page, Subreddit, Wallpaper, WallpaperQuery } from "../types";
import * as demo from "./demo";
import * as supa from "./supabase";

// Public reads are cached for a minute and tagged so the sync job can refresh them on demand.
// Views and favourite counts may lag by up to a minute, which keeps pages fast.
export const WALLPAPER_TAG = "wallpapers";

export async function listWallpapers(q: WallpaperQuery): Promise<Page<Wallpaper>> {
  "use cache";
  cacheLife("minutes");
  cacheTag(WALLPAPER_TAG);
  return isSupabaseConfigured ? supa.listWallpapers(q) : demo.listWallpapers(q);
}

export async function getWallpaper(id: string): Promise<Wallpaper | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(WALLPAPER_TAG);
  return isSupabaseConfigured ? supa.getWallpaper(id) : demo.getWallpaper(id);
}

export async function listSubreddits(): Promise<Subreddit[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(WALLPAPER_TAG);
  return isSupabaseConfigured ? supa.listSubreddits() : demo.listSubreddits();
}

export async function getSubreddit(name: string): Promise<Subreddit | null> {
  const subs = await listSubreddits();
  return subs.find((s) => s.id === name.toLowerCase()) ?? null;
}

export async function recordView(id: string) {
  if (isSupabaseConfigured) await supa.recordView(id);
  else demo.recordView(id);
}

const base = { t: "week", device: "all", minRes: 0, cursor: 0 } as const;

export async function getHomeData() {
  "use cache";
  cacheLife("minutes");
  cacheTag(WALLPAPER_TAG);
  const [hero, trending, latest, topWeek, mobile, subreddits] = await Promise.all([
    listWallpapers({ ...base, sort: "top", t: "week", device: "pc", minRes: 1080, limit: 6 }),
    listWallpapers({ ...base, sort: "hot", limit: 18 }),
    listWallpapers({ ...base, sort: "new", limit: 18 }),
    listWallpapers({ ...base, sort: "top", t: "month", limit: 12 }),
    listWallpapers({ ...base, sort: "hot", device: "mobile", limit: 14 }),
    listSubreddits(),
  ]);
  return {
    hero: hero.items,
    trending: trending.items,
    latest: latest.items,
    topWeek: topWeek.items,
    mobile: mobile.items,
    subreddits,
  };
}
