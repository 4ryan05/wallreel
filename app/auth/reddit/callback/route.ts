import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, createSessionClient } from "@/lib/supabase/server";

const USER_AGENT = process.env.REDDIT_USER_AGENT || "web:wallreel:1.0 (wallpaper aggregator)";

function fail(req: NextRequest, reason: string) {
  return NextResponse.redirect(new URL(`/login?error=${reason}`, req.url));
}

/**
 * Reddit -> Supabase bridge: exchange the code, read the Reddit identity, find or create a
 * matching Supabase user, then sign them in with a one-time magic-link token.
 */
export async function GET(req: NextRequest) {
  const store = await cookies();
  const expected = store.get("reddit_oauth_state")?.value;
  store.delete("reddit_oauth_state");
  const code = req.nextUrl.searchParams.get("code");
  if (!code || !expected || req.nextUrl.searchParams.get("state") !== expected) return fail(req, "reddit-state");

  const id = process.env.REDDIT_LOGIN_CLIENT_ID!;
  const secret = process.env.REDDIT_LOGIN_CLIENT_SECRET!;
  const tokenRes = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: new URL("/auth/reddit/callback", req.url).toString(),
    }),
  });
  if (!tokenRes.ok) return fail(req, "reddit-token");
  const { access_token } = await tokenRes.json();

  const meRes = await fetch("https://oauth.reddit.com/api/v1/me", {
    headers: { Authorization: `Bearer ${access_token}`, "User-Agent": USER_AGENT },
  });
  if (!meRes.ok) return fail(req, "reddit-identity");
  const me = await meRes.json();

  // Reddit doesn't share email addresses, so each Reddit account maps to a placeholder address.
  const email = `reddit-${me.id}@users.wallreel.local`;
  const admin = createAdminClient();
  const metadata = { username: me.name, avatar_url: String(me.icon_img ?? "").split("?")[0] || null, provider: "reddit" };
  const created = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: metadata });
  if (created.error && !/already/i.test(created.error.message)) return fail(req, "reddit-user");

  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = link.data?.properties?.hashed_token;
  if (link.error || !tokenHash) return fail(req, "reddit-link");

  const db = await createSessionClient();
  const { error } = await db.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  if (error) return fail(req, "reddit-session");
  return NextResponse.redirect(new URL("/favourites", req.url));
}
