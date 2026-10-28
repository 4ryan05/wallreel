import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSessionClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (isSupabaseConfigured) await (await createSessionClient()).auth.signOut();
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
