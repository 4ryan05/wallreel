import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/** Refreshes the Supabase session cookie on navigation so server code sees a valid user. */
export async function proxy(request: NextRequest) {
  // Supabase email links may land on the Site URL with ?code=…; finish the sign-in at the callback.
  const code = request.nextUrl.searchParams.get("code");
  if (isSupabaseConfigured && code && !request.nextUrl.pathname.startsWith("/auth/")) {
    const url = new URL("/auth/callback", request.url);
    url.searchParams.set("code", code);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;
  const db = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await db.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/wallpapers|api/download|api/view|api/search|api/cron|favicon.ico|.*\\.(?:png|jpg|svg|webp|ico)$).*)"],
};
