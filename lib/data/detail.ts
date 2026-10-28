import "server-only";
import { listWallpapers, getWallpaper } from ".";

/** A wallpaper plus six others from the same subreddit for the "More from" strip. */
export async function getWallpaperWithRelated(id: string) {
  const w = await getWallpaper(id);
  if (!w) return null;
  const more = await listWallpapers({ sub: w.subreddit, sort: "hot", t: "week", device: "all", minRes: 0, cursor: 0, limit: 7 });
  return { w, related: more.items.filter((r) => r.id !== w.id).slice(0, 6) };
}
