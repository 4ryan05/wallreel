import type { NextRequest } from "next/server";
import { listSubreddits, listWallpapers } from "@/lib/data";
import { parseQuery } from "@/lib/query";

/** Quick results for the command palette: matching subreddits plus a few wallpapers. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  const subs = await listSubreddits();
  const needle = q.toLowerCase();
  const subreddits = subs
    .filter((s) => !needle || s.id.includes(needle) || s.title.toLowerCase().includes(needle) || s.category.toLowerCase().includes(needle))
    .slice(0, 6)
    .map(({ id, name, title, category, cover }) => ({ id, name, title, category, thumb: cover?.thumbs[0]?.u ?? null }));
  const wallpapers = q ? (await listWallpapers(parseQuery(new URLSearchParams({ q, limit: "6" })))).items : [];
  return Response.json({ subreddits, wallpapers });
}
