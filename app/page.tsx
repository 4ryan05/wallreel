import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Hero } from "@/components/hero";
import { PhoneShelf, SectionHeader } from "@/components/shelf";
import { SubredditCard } from "@/components/subreddit-card";
import { WallpaperCard } from "@/components/wallpaper-card";
import { getHomeData } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Wallpaper } from "@/lib/types";

function Masonry({ items }: { items: Wallpaper[] }) {
  return (
    <div className="masonry">
      {items.map((w, i) => (
        <WallpaperCard key={w.id} w={w} index={i} />
      ))}
    </div>
  );
}

export default async function Home() {
  const data = await getHomeData();
  if (!data.trending.length) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-accent/15 text-3xl">🖼️</span>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">No wallpapers yet</h1>
        <p className="text-muted">
          The database is connected but empty. Wallpapers appear here after the first sync from Reddit, which needs Reddit API keys in{" "}
          <code className="rounded bg-hover px-1">.env.local</code>.
        </p>
      </div>
    );
  }
  return (
    <>
      <Hero items={data.hero} />
      <div className="mx-auto max-w-[2000px] space-y-16 px-4 pt-10 sm:px-6">
        {!isSupabaseConfigured && (
          <p className="rounded-2xl border border-dashed border-accent/40 bg-accent/5 px-4 py-3 text-sm text-muted">
            <b className="text-fg">Demo mode.</b> These are sample photos laid out like Reddit posts. Add your Supabase and Reddit keys
            to <code className="rounded bg-hover px-1">.env.local</code> to load real wallpapers.
          </p>
        )}

        <section>
          <SectionHeader title="Trending now" subtitle="What's hot across every wallpaper subreddit" href="/search?sort=hot" />
          <Masonry items={data.trending.slice(0, 12)} />
        </section>

        <section>
          <SectionHeader title="Browse subreddits" subtitle={`${data.subreddits.length} communities, one place`} href="/subreddits" />
          <div className="no-scrollbar -mx-4 grid snap-x auto-cols-[78%] grid-flow-col gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:auto-cols-[42%] sm:px-6 lg:auto-cols-[28%] 2xl:auto-cols-[19%]">
            {data.subreddits.map((s, i) => (
              <div key={s.id} className="snap-start">
                <SubredditCard s={s} index={i} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="For your phone" subtitle="Hot portrait wallpapers" href="/search?device=mobile" />
          <PhoneShelf items={data.mobile} />
        </section>

        <section>
          <SectionHeader title="Fresh uploads" subtitle="The newest posts, straight from Reddit" href="/search?sort=new" />
          <Masonry items={data.latest.slice(0, 12)} />
        </section>

        <section>
          <SectionHeader title="Top this month" subtitle="The most upvoted wallpapers of the last 30 days" href="/search?sort=top&t=month" />
          <Masonry items={data.topWeek} />
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-line bg-elev p-8 sm:p-12">
          <div className="absolute -right-20 -top-20 size-72 rounded-full bg-accent/20 blur-3xl" />
          <h2 className="relative text-2xl font-semibold tracking-tight sm:text-3xl">Looking for something specific?</h2>
          <p className="relative mt-2 max-w-xl text-muted">
            Search every subreddit at once, filter for PC or mobile, by resolution and aspect ratio, and sort like on Reddit.
          </p>
          <Link
            href="/search"
            className="relative mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 font-medium text-accent-fg transition-transform hover:scale-[1.03]"
          >
            Explore all wallpapers <ArrowRight className="size-4" />
          </Link>
        </section>
      </div>
    </>
  );
}
