import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { RedditError, isWallpaperShaped, parsePost, redditGet, type WallpaperRow } from "./reddit";
import { hotScore } from "./ranking";
import { SUBREDDITS } from "./subreddits";

const LISTINGS = ["new?limit=100", "hot?limit=100", "top?t=day&limit=50", "top?t=week&limit=50"];
const SUBS_PER_RUN = 8;

export interface SyncReport {
  subreddits: string[];
  upserted: number;
  refreshed: number;
  hidden: number;
  errors: string[];
}

/** Ensure every seed subreddit has a row, so new entries in lib/subreddits.ts are picked up. */
async function seedSubreddits(db: SupabaseClient) {
  const rows = SUBREDDITS.map((s) => ({ id: s.name.toLowerCase(), name: s.name, category: s.category, description: s.blurb }));
  await db.from("subreddits").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
}

async function fetchSizes(rows: WallpaperRow[]): Promise<Map<string, number>> {
  const sizes = new Map<string, number>();
  const queue = [...rows];
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      for (let row = queue.shift(); row; row = queue.shift()) {
        try {
          const res = await fetch(row.image_url, { method: "HEAD", cache: "no-store" });
          const len = Number(res.headers.get("content-length"));
          if (res.ok && len > 0) sizes.set(row.id, len);
        } catch {
          // Size stays unknown; we try again on the next run.
        }
      }
    }),
  );
  return sizes;
}

async function syncSubreddit(db: SupabaseClient, id: string, report: SyncReport) {
  try {
    const about = (await redditGet(`/r/${id}/about`)).data;
    if (about.over18 || about.subreddit_type === "private") {
      await db.from("subreddits").update({ active: false, last_synced_at: new Date().toISOString() }).eq("id", id);
      return;
    }
    await db
      .from("subreddits")
      .update({
        name: about.display_name,
        title: about.title,
        description: about.public_description,
        icon_url: (about.community_icon || about.icon_img || "").split("?")[0] || null,
        banner_url: (about.banner_background_image || about.banner_img || "").split("?")[0] || null,
        subscribers: about.subscribers ?? 0,
        active: true,
      })
      .eq("id", id);
  } catch (e) {
    if (e instanceof RedditError && [403, 404].includes(e.status)) {
      await db.from("subreddits").update({ active: false, last_synced_at: new Date().toISOString() }).eq("id", id);
      report.errors.push(`r/${id} is unavailable (${e.status}); deactivated`);
      return;
    }
    throw e;
  }

  const byId = new Map<string, WallpaperRow>();
  for (const listing of LISTINGS) {
    const json = await redditGet(`/r/${id}/${listing}`);
    for (const child of json.data?.children ?? []) {
      for (const row of parsePost(child.data)) if (isWallpaperShaped(row)) byId.set(row.id, row);
    }
  }
  const rows = [...byId.values()];
  if (rows.length) {
    const { data: known } = await db.from("wallpapers").select("id").in("id", rows.map((r) => r.id)).not("file_size", "is", null);
    const knownIds = new Set((known ?? []).map((k) => k.id));
    const sizes = await fetchSizes(rows.filter((r) => !knownIds.has(r.id)));
    const payload = rows.map((r) => (sizes.has(r.id) ? { ...r, file_size: sizes.get(r.id) } : r));
    for (let i = 0; i < payload.length; i += 200) {
      const { error } = await db.from("wallpapers").upsert(payload.slice(i, i + 200), { onConflict: "id" });
      if (error) throw new Error(error.message);
    }
    report.upserted += rows.length;
  }
  const { count } = await db.from("wallpapers").select("id", { count: "exact", head: true }).eq("subreddit", id).eq("hidden", false);
  await db.from("subreddits").update({ wallpaper_count: count ?? 0, last_synced_at: new Date().toISOString() }).eq("id", id);
  report.subreddits.push(id);
}

/**
 * Refresh scores and comment counts of posts that have dropped out of the listings:
 * daily for older posts, every 3 hours for posts under a week old. Removed posts get hidden.
 */
async function refreshStale(db: SupabaseClient, report: SyncReport) {
  const now = Date.now();
  const weekAgo = new Date(now - 7 * 86400_000).toISOString();
  const [{ data: recent }, { data: old }] = await Promise.all([
    db.from("wallpapers").select("id,post_id").eq("hidden", false).gte("created_utc", weekAgo)
      .lt("synced_at", new Date(now - 3 * 3600_000).toISOString()).order("synced_at").limit(300),
    db.from("wallpapers").select("id,post_id").eq("hidden", false).lt("created_utc", weekAgo)
      .lt("synced_at", new Date(now - 86400_000).toISOString()).order("synced_at").limit(200),
  ]);
  const rows = [...(recent ?? []), ...(old ?? [])];
  const postIds = [...new Set(rows.map((r) => r.post_id))];
  for (let i = 0; i < postIds.length; i += 100) {
    const batch = postIds.slice(i, i + 100);
    const json = await redditGet(`/by_id/${batch.map((p) => `t3_${p}`).join(",")}`);
    const seen = new Set<string>();
    for (const child of json.data?.children ?? []) {
      const p = child.data;
      seen.add(p.id);
      const removed = Boolean(p.removed_by_category) || p.author === "[deleted]" || p.over_18;
      const patch = removed
        ? { hidden: true, synced_at: new Date().toISOString() }
        : {
            score: p.score,
            upvote_ratio: p.upvote_ratio,
            num_comments: p.num_comments,
            hot_score: hotScore(p.score, p.created_utc),
            synced_at: new Date().toISOString(),
          };
      await db.from("wallpapers").update(patch).eq("post_id", p.id);
      if (removed) report.hidden++;
      else report.refreshed++;
    }
    const missing = batch.filter((p) => !seen.has(p));
    if (missing.length) {
      await db.from("wallpapers").update({ hidden: true }).in("post_id", missing);
      report.hidden += missing.length;
    }
  }
}

export async function runSync(db: SupabaseClient, opts: { all?: boolean; only?: string } = {}): Promise<SyncReport> {
  const report: SyncReport = { subreddits: [], upserted: 0, refreshed: 0, hidden: 0, errors: [] };
  await seedSubreddits(db);
  let ids: string[];
  if (opts.only) {
    ids = [opts.only.toLowerCase()];
  } else {
    const { data } = await db
      .from("subreddits")
      .select("id")
      .order("last_synced_at", { ascending: true, nullsFirst: true })
      .limit(opts.all ? 100 : SUBS_PER_RUN);
    ids = (data ?? []).map((d) => d.id);
  }
  for (const id of ids) {
    try {
      await syncSubreddit(db, id, report);
    } catch (e) {
      report.errors.push(`r/${id}: ${(e as Error).message}`);
    }
  }
  try {
    await refreshStale(db, report);
  } catch (e) {
    report.errors.push(`refresh: ${(e as Error).message}`);
  }
  return report;
}
