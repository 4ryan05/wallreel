import "server-only";
import { RATIO_TOLERANCE, RATIOS } from "../ranking";
import { TOP_WINDOW_SECONDS } from "../query";
import { SUBREDDITS } from "../subreddits";
import { createPublicClient } from "../supabase/server";
import type { Page, Subreddit, Wallpaper, WallpaperQuery } from "../types";

export const WALLPAPER_COLUMNS =
  "id,post_id,subreddit,title,author,permalink,image_url,thumbs,tiny_url,width,height,orientation,file_size,mime,score,upvote_ratio,num_comments,created_utc,views,favourites_count";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come straight from PostgREST */
export function toWallpaper(r: any): Wallpaper {
  return {
    id: r.id,
    postId: r.post_id,
    subreddit: r.subreddit,
    title: r.title,
    author: r.author,
    permalink: r.permalink,
    imageUrl: r.image_url,
    thumbs: r.thumbs ?? [],
    tinyUrl: r.tiny_url,
    width: r.width,
    height: r.height,
    orientation: r.orientation,
    fileSize: r.file_size,
    mime: r.mime,
    score: r.score,
    upvoteRatio: r.upvote_ratio,
    numComments: r.num_comments,
    createdUtc: r.created_utc,
    views: r.views,
    favouritesCount: r.favourites_count,
  };
}

const ORDER: Record<WallpaperQuery["sort"], string> = {
  hot: "hot_score",
  new: "created_utc",
  top: "score",
  comments: "num_comments",
  favourites: "favourites_count",
  views: "views",
};

export async function listWallpapers(q: WallpaperQuery): Promise<Page<Wallpaper>> {
  const db = createPublicClient();
  let query = db.from("wallpapers").select(WALLPAPER_COLUMNS).eq("hidden", false);
  if (q.ids) query = query.in("id", q.ids);
  if (q.sub) query = query.eq("subreddit", q.sub.toLowerCase());
  if (q.q) query = query.textSearch("search_tsv", q.q, { type: "websearch", config: "english" });
  if (q.device === "pc") query = query.eq("orientation", "landscape");
  if (q.device === "mobile") query = query.eq("orientation", "portrait");
  if (q.minRes) query = query.gte("min_side", q.minRes);
  if (q.ratio) {
    const v = RATIOS[q.ratio].value;
    query = query.gte("aspect_ratio", v * (1 - RATIO_TOLERANCE)).lte("aspect_ratio", v * (1 + RATIO_TOLERANCE));
  }
  const window = TOP_WINDOW_SECONDS[q.t];
  if (q.sort === "top" && window && !q.ids) {
    query = query.gte("created_utc", new Date(Date.now() - window * 1000).toISOString());
  }
  const { data, error } = await query
    .order(ORDER[q.sort], { ascending: false })
    .order("id", { ascending: false })
    .range(q.cursor, q.cursor + q.limit); // one extra row tells us whether there is a next page
  if (error) throw new Error(error.message);
  let rows = (data ?? []).map(toWallpaper);
  const hasMore = rows.length > q.limit;
  rows = rows.slice(0, q.limit);
  if (q.ids) {
    const order = new Map(q.ids.map((id, i) => [id, i]));
    rows.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
  }
  return { items: rows, nextCursor: hasMore ? q.cursor + q.limit : null };
}

export async function getWallpaper(id: string): Promise<Wallpaper | null> {
  const { data, error } = await createPublicClient()
    .from("wallpapers")
    .select(WALLPAPER_COLUMNS)
    .eq("id", id)
    .eq("hidden", false)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toWallpaper(data) : null;
}

export async function listSubreddits(): Promise<Subreddit[]> {
  const db = createPublicClient();
  const [{ data: subs, error }, { data: covers }] = await Promise.all([
    db.from("subreddits").select("*").eq("active", true),
    db
      .from("wallpapers")
      .select(WALLPAPER_COLUMNS)
      .eq("hidden", false)
      .eq("orientation", "landscape")
      .gte("created_utc", new Date(Date.now() - 86400_000 * 30).toISOString())
      .order("score", { ascending: false })
      .limit(500),
  ]);
  if (error) throw new Error(error.message);
  const coverBySub = new Map<string, Wallpaper>();
  for (const row of covers ?? []) if (!coverBySub.has(row.subreddit)) coverBySub.set(row.subreddit, toWallpaper(row));
  const order = new Map(SUBREDDITS.map((s, i) => [s.name.toLowerCase(), i]));
  return (subs ?? [])
    .map((s: any) => ({
      id: s.id,
      name: s.name,
      title: s.title || s.name,
      description: s.description || "",
      category: s.category,
      iconUrl: s.icon_url,
      bannerUrl: s.banner_url,
      subscribers: s.subscribers ?? 0,
      wallpaperCount: s.wallpaper_count ?? 0,
      cover: coverBySub.get(s.id) ?? null,
    }))
    .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
}

export async function recordView(id: string) {
  await createPublicClient().rpc("increment_view", { wid: id });
}
