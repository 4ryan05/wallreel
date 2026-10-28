import type { NextRequest } from "next/server";
import { recordView } from "@/lib/data";

// The client calls this once per wallpaper per browser session.
export async function POST(_req: NextRequest, ctx: RouteContext<"/api/view/[id]">) {
  const { id } = await ctx.params;
  if (!/^[\w-]{1,40}$/.test(id)) return new Response(null, { status: 400 });
  await recordView(id);
  return new Response(null, { status: 204 });
}
