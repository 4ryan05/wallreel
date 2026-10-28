import type { Metadata } from "next";
import { Suspense } from "react";
import { Browse, BrowseSkeleton } from "@/components/browse";
import { SearchBox } from "@/components/search-box";

export const metadata: Metadata = { title: "Explore wallpapers" };

async function Heading({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const q = (await searchParams).q;
  const text = typeof q === "string" && q.trim() ? q.trim() : "";
  return (
    <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-fg">{text ? <>Results for “{text}”</> : "Explore"}</h1>
        <p className="mt-1 text-muted">{text ? "Matching titles, subreddits and uploaders" : "Every wallpaper from every subreddit"}</p>
      </div>
      <SearchBox key={text} initial={text} />
    </div>
  );
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className="mx-auto max-w-[2000px] px-4 sm:px-6">
      <Suspense fallback={<div className="h-[124px]" />}>
        <Heading searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<BrowseSkeleton />}>
        <Browse searchParams={searchParams} emptyText="Nothing found. Try fewer words or different filters." />
      </Suspense>
    </div>
  );
}
