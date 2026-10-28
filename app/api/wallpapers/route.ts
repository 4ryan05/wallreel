import type { NextRequest } from "next/server";
import { listWallpapers } from "@/lib/data";
import { parseQuery } from "@/lib/query";

export async function GET(req: NextRequest) {
  const page = await listWallpapers(parseQuery(req.nextUrl.searchParams));
  return Response.json(page, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
