import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

// Supabase has no built-in Reddit provider, so we run the OAuth flow ourselves
// and hand the user over to Supabase in ./callback.
export async function GET(req: NextRequest) {
  const clientId = process.env.REDDIT_LOGIN_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(new URL("/login?error=reddit-disabled", req.url));
  const state = crypto.randomUUID();
  (await cookies()).set("reddit_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 600, path: "/" });
  const url = new URL("https://www.reddit.com/api/v1/authorize");
  url.search = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    state,
    redirect_uri: new URL("/auth/reddit/callback", req.url).toString(),
    duration: "temporary",
    scope: "identity",
  }).toString();
  return NextResponse.redirect(url);
}
