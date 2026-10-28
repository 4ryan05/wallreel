# Wallreel

Wallpapers from 25 Reddit wallpaper communities in one place. You can browse, search, filter for PC or mobile, sort like on Reddit, save favourites and download the full original image.

Built with Next.js 16 (App Router, Cache Components), Supabase (Postgres + Auth), Tailwind CSS 4 and Motion.

## Run it locally

```bash
npm install
npm run dev
```

Without any keys the site runs in **demo mode** on sample photos, so you can try every page right away. Favourites are saved in the browser.

## Going live with real Reddit data

1. **Supabase**: create a free project at supabase.com. In the SQL editor, run `supabase/migrations/0001_init.sql`.
   - Under Authentication → Providers, enable **Email** and **Google** (you'll need a Google Cloud OAuth client).
   - Under Authentication → URL Configuration, add `https://wallreel.vercel.app/auth/callback` (and `http://localhost:3000/auth/callback`) as redirect URLs.
2. **Reddit API app** for syncing posts: at https://www.reddit.com/prefs/apps create a **script** app. Copy its id and secret.
3. **Reddit login app** (optional) for "Continue with Reddit": create a **web app** whose redirect URI is `https://wallreel.vercel.app/auth/reddit/callback`.
4. Copy `.env.example` to `.env.local` and fill it in. Add the same variables in Vercel → Project → Settings → Environment Variables.
5. Deploy to Vercel (`vercel` or import the repo), then do the first full sync:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" "https://wallreel.vercel.app/api/cron/sync?all=1"
   ```
6. Schedule ongoing syncs: edit `supabase/cron.sql` with your URL and secret, then run it in the Supabase SQL editor. It refreshes 8 subreddits every 10 minutes, which keeps well inside Reddit's free rate limit.

## How it works

- **Sync** (`lib/sync.ts`, `/api/cron/sync`): fetches new, hot and top posts per subreddit through Reddit's OAuth API. It splits galleries into single images, skips NSFW posts, videos and tiny images, and records the file size with a HEAD request. It refreshes vote and comment counts on older posts and hides posts that were deleted on Reddit.
- **Pages never call Reddit.** They read from Postgres through `lib/data`, with results cached for a minute. Images load straight from Reddit's CDN.
- **Votes**: Reddit only exposes the score and upvote ratio, so up and down votes are estimates (`lib/ranking.ts`). **Views** are counted on this site.
- **Downloads** go through `/api/download/[id]`, which only fetches from Reddit's image hosts, so files save with a proper filename on desktop and phone.
- **Favourites**: guests' favourites live in localStorage. They merge into the account the first time the user signs in.
- **Themes**: Light, Dark and the four Catppuccin flavours, each with 9 accent colours (`app/globals.css`).
- **Subreddit list**: edit `lib/subreddits.ts`.

## Scripts

- `npm run dev`: start the dev server
- `npm run build`: production build
- `npm test`: unit tests (Reddit parser, ranking, query parsing)
- `npm run typecheck`, `npm run lint`

Reddit's free API tier is for non-commercial use. Running ads or charging money requires Reddit's approval.
