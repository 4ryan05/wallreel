import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { WALLPAPER_TAG } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/server";
import { runSync } from "@/lib/sync";

export const maxDuration = 300;

// Called by Supabase pg_cron (see supabase/cron.sql) with "Authorization: Bearer <CRON_SECRET>".
// ?all=1 syncs every subreddit; ?sub=EarthPorn syncs just one.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!isSupabaseConfigured) return Response.json({ error: "Supabase is not configured" }, { status: 400 });
  const report = await runSync(createAdminClient(), {
    all: req.nextUrl.searchParams.get("all") === "1",
    only: req.nextUrl.searchParams.get("sub") ?? undefined,
  });
  revalidateTag(WALLPAPER_TAG, "max");
  return Response.json(report);
}
