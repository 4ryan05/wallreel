import type { Metadata } from "next";
import { SubredditDirectory } from "@/components/subreddit-directory";
import { listSubreddits } from "@/lib/data";

export const metadata: Metadata = { title: "Subreddits" };

export default async function SubredditsPage() {
  const subs = await listSubreddits();
  return (
    <div className="mx-auto max-w-[2000px] px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-fg">Subreddits</h1>
      <p className="mt-1 text-muted">The wallpaper communities Wallreel collects, refreshed every few minutes.</p>
      <SubredditDirectory subs={subs} />
    </div>
  );
}
