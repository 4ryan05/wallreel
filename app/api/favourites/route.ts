import type { NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSessionClient } from "@/lib/supabase/server";

async function session() {
  if (!isSupabaseConfigured) return null;
  const db = await createSessionClient();
  const { data } = await db.auth.getUser();
  return data.user ? { db, user: data.user } : null;
}

/** The signed-in user's favourite ids, newest first. */
export async function GET() {
  const s = await session();
  if (!s) return Response.json({ ids: [] }, { status: 401 });
  const { data, error } = await s.db
    .from("favourites")
    .select("wallpaper_id")
    .eq("user_id", s.user.id)
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ids: data.map((r) => r.wallpaper_id) });
}

/** Body: { add?: string[], remove?: string[] }. Adding many at once merges guest favourites on sign-in. */
export async function POST(req: NextRequest) {
  const s = await session();
  if (!s) return Response.json({ error: "Sign in to sync favourites" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { add?: string[]; remove?: string[] };
  const add = (body.add ?? []).filter((id) => typeof id === "string").slice(0, 500);
  const remove = (body.remove ?? []).filter((id) => typeof id === "string").slice(0, 500);
  if (add.length) {
    const { error } = await s.db
      .from("favourites")
      .upsert(add.map((wallpaper_id) => ({ user_id: s.user.id, wallpaper_id })), { onConflict: "user_id,wallpaper_id", ignoreDuplicates: true });
    if (error) return Response.json({ error: error.message }, { status: 400 });
  }
  if (remove.length) {
    const { error } = await s.db.from("favourites").delete().eq("user_id", s.user.id).in("wallpaper_id", remove);
    if (error) return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ ok: true });
}
