import type { NextRequest } from "next/server";
import { getWallpaper } from "@/lib/data";
import { extensionOf } from "@/lib/ranking";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Only these hosts are fetched, so this route can't be used as an open proxy.
const ALLOWED = new Set(
  isSupabaseConfigured
    ? ["i.redd.it", "preview.redd.it", "i.imgur.com"]
    : ["picsum.photos", "fastly.picsum.photos"],
);

async function fetchAllowed(url: string, hops = 3): Promise<Response | null> {
  if (!ALLOWED.has(new URL(url).hostname)) return null;
  const res = await fetch(url, { redirect: "manual", cache: "no-store" });
  if (res.status >= 300 && res.status < 400 && hops > 0) {
    const next = res.headers.get("location");
    return next ? fetchAllowed(new URL(next, url).toString(), hops - 1) : null;
  }
  return res.ok ? res : null;
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/download/[id]">) {
  const { id } = await ctx.params;
  const w = await getWallpaper(id);
  if (!w) return new Response("Not found", { status: 404 });
  const upstream = await fetchAllowed(w.imageUrl);
  if (!upstream?.body) return new Response("Image unavailable", { status: 502 });
  const ext = extensionOf(upstream.headers.get("content-type") ?? w.mime, w.imageUrl);
  const filename = `${w.subreddit}_${w.id}_${w.width}x${w.height}.${ext}`;
  const headers = new Headers({
    "Content-Type": upstream.headers.get("content-type") ?? w.mime ?? "image/jpeg",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "public, max-age=86400",
  });
  const len = upstream.headers.get("content-length");
  if (len) headers.set("Content-Length", len);
  return new Response(upstream.body, { headers });
}
