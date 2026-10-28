import { hotScore, orientationOf } from "./ranking";
import type { Thumb } from "./types";

/** A wallpaper row as written to the database by the sync job. */
export interface WallpaperRow {
  id: string;
  post_id: string;
  subreddit: string;
  title: string;
  author: string;
  permalink: string;
  image_url: string;
  thumbs: Thumb[];
  tiny_url: string | null;
  width: number;
  height: number;
  mime: string | null;
  score: number;
  upvote_ratio: number;
  num_comments: number;
  created_utc: string;
  hot_score: number;
  gallery_index: number | null;
  hidden: boolean;
  synced_at: string;
}

const USER_AGENT = process.env.REDDIT_USER_AGENT || "web:wallreel:1.0 (wallpaper aggregator)";
const IMAGE_HOSTS = new Set(["i.redd.it", "i.imgur.com", "preview.redd.it"]);
const MIME_EXT: Record<string, string> = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/* eslint-disable @typescript-eslint/no-explicit-any -- Reddit's listing JSON is untyped */
type RedditPost = Record<string, any>;

let cachedToken: { value: string; expires: number } | null = null;

/** App-only OAuth token (client credentials grant) for a Reddit "script" or "web" app. */
export async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.value;
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) throw new Error("REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET must be set");
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Reddit token request failed: ${res.status}`);
  const json = await res.json();
  cachedToken = { value: json.access_token, expires: Date.now() + json.expires_in * 1000 };
  return cachedToken.value;
}

export class RedditError extends Error {
  constructor(
    public status: number,
    path: string,
  ) {
    super(`Reddit ${path} returned ${status}`);
  }
}

/** GET an oauth.reddit.com path, waiting when the rate-limit budget runs low. */
export async function redditGet(path: string): Promise<any> {
  const token = await getToken();
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`https://oauth.reddit.com${path}${sep}raw_json=1`, {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  const remaining = Number(res.headers.get("x-ratelimit-remaining") ?? 100);
  const reset = Number(res.headers.get("x-ratelimit-reset") ?? 0);
  if (remaining < 5 && reset > 0) await new Promise((r) => setTimeout(r, reset * 1000));
  if (!res.ok) throw new RedditError(res.status, path);
  return res.json();
}

function isImageUrl(url: string | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return IMAGE_HOSTS.has(u.hostname) && /\.(jpe?g|png|webp)$/i.test(u.pathname);
  } catch {
    return false;
  }
}

function mimeFromUrl(url: string): string | null {
  const m = /\.(jpe?g|png|webp)(?:\?|$)/i.exec(url);
  if (!m) return null;
  const ext = m[1].toLowerCase();
  return ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
}

function toThumbs(list: { x?: number; y?: number; width?: number; height?: number; u?: string; url?: string }[]): Thumb[] {
  return list
    .map((r) => ({ w: r.x ?? r.width ?? 0, h: r.y ?? r.height ?? 0, u: r.u ?? r.url ?? "" }))
    .filter((t) => t.w > 0 && t.u);
}

/**
 * Turn a Reddit post into zero or more wallpaper rows. Galleries yield one row per image;
 * NSFW, video, removed and non-image posts yield nothing.
 */
export function parsePost(post: RedditPost, now = new Date()): WallpaperRow[] {
  if (!post || post.over_18 || post.is_video || post.removed_by_category) return [];
  const media: RedditPost = post.crosspost_parent_list?.[0] ?? post;
  const createdSeconds = Number(post.created_utc);
  const base = {
    post_id: post.id as string,
    subreddit: String(post.subreddit).toLowerCase(),
    title: String(post.title ?? "").trim(),
    author: String(post.author ?? "[deleted]"),
    permalink: `https://www.reddit.com${post.permalink}`,
    score: Number(post.score ?? 0),
    upvote_ratio: Number(post.upvote_ratio ?? 1),
    num_comments: Number(post.num_comments ?? 0),
    created_utc: new Date(createdSeconds * 1000).toISOString(),
    hot_score: hotScore(Number(post.score ?? 0), createdSeconds),
    hidden: false,
    synced_at: now.toISOString(),
  };

  if (media.is_gallery && media.media_metadata && media.gallery_data?.items) {
    const rows: WallpaperRow[] = [];
    (media.gallery_data.items as { media_id: string }[]).forEach((item, index) => {
      const meta = media.media_metadata[item.media_id];
      if (!meta || meta.status !== "valid" || meta.e !== "Image" || !meta.s?.x) return;
      const ext = MIME_EXT[meta.m as string];
      if (!ext) return;
      const thumbs = toThumbs(meta.p ?? []);
      rows.push({
        ...base,
        id: `${post.id}-${index}`,
        image_url: `https://i.redd.it/${item.media_id}.${ext}`,
        thumbs,
        tiny_url: thumbs[0]?.u ?? null,
        width: meta.s.x,
        height: meta.s.y,
        mime: ext === "jpg" ? "image/jpeg" : `image/${ext}`,
        gallery_index: index,
      });
    });
    return rows;
  }

  const image = media.preview?.images?.[0];
  if (!image?.source?.width) return [];
  const direct = media.url_overridden_by_dest ?? media.url;
  const imageUrl = isImageUrl(direct) ? direct : (image.source.url as string);
  if (!isImageUrl(imageUrl)) return [];
  const thumbs = toThumbs(image.resolutions ?? []);
  return [
    {
      ...base,
      id: post.id,
      image_url: imageUrl,
      thumbs,
      tiny_url: thumbs[0]?.u ?? null,
      width: image.source.width,
      height: image.source.height,
      mime: mimeFromUrl(imageUrl),
      gallery_index: null,
    },
  ];
}

export function isWallpaperShaped(row: WallpaperRow): boolean {
  // Skip tiny images and odd shapes nobody would use as a background.
  return Math.min(row.width, row.height) >= 720 && orientationOf(row.width, row.height) !== "square"
    ? true
    : Math.min(row.width, row.height) >= 1080;
}
