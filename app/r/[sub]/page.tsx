import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Browse, BrowseSkeleton } from "@/components/browse";
import { getSubreddit } from "@/lib/data";
import { formatCount, pickThumb } from "@/lib/ranking";
import { SUBREDDITS } from "@/lib/subreddits";

export function generateStaticParams() {
  return SUBREDDITS.map((s) => ({ sub: s.name }));
}

export async function generateMetadata({ params }: PageProps<"/r/[sub]">): Promise<Metadata> {
  const { sub } = await params;
  return { title: `r/${sub} wallpapers` };
}

type Params = PageProps<"/r/[sub]">["params"];

async function Banner({ params }: { params: Params }) {
  const s = await getSubreddit((await params).sub);
  if (!s) notFound();
  return (
    <section className="relative -mt-16 overflow-hidden pt-16">
      {s.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={s.bannerUrl ?? pickThumb(s.cover.thumbs, 1600, s.cover.imageUrl)}
          alt=""
          className="absolute inset-0 size-full scale-110 object-cover opacity-60 blur-2xl"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-bg/30 via-bg/70 to-bg" />
      <div className="relative mx-auto flex max-w-[2000px] flex-col gap-5 px-4 py-10 sm:flex-row sm:items-end sm:px-6 sm:py-14">
        {s.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.iconUrl} alt="" className="size-20 rounded-2xl shadow-xl ring-4 ring-bg" />
        ) : (
          <span className="grid size-20 place-items-center rounded-2xl bg-accent text-3xl font-bold text-accent-fg shadow-xl shadow-accent/30">
            {s.name[0].toUpperCase()}
          </span>
        )}
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{s.category}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-fg sm:text-4xl">r/{s.name}</h1>
          <p className="mt-2 max-w-2xl text-muted">{s.description}</p>
          <p className="mt-3 flex gap-4 text-sm text-subtle">
            <span>
              <b className="text-fg">{formatCount(s.subscribers)}</b> members
            </span>
            <span>
              <b className="text-fg">{formatCount(s.wallpaperCount)}</b> wallpapers indexed
            </span>
          </p>
        </div>
        <a
          href={`https://www.reddit.com/r/${s.name}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-2 self-start rounded-full border border-line bg-elev/70 px-4 text-sm font-medium text-fg backdrop-blur transition hover:border-[#ff4500]/60 sm:self-auto"
        >
          Open on Reddit <ExternalLink className="size-4" />
        </a>
      </div>
    </section>
  );
}

async function SubBrowse({ params, searchParams }: PageProps<"/r/[sub]">) {
  const { sub } = await params;
  return <Browse searchParams={searchParams} sub={sub} emptyText={`No wallpapers from r/${sub} match these filters.`} />;
}

// Params are awaited inside Suspense so navigation can show the page shell instantly.
export default function SubredditPage({ params, searchParams }: PageProps<"/r/[sub]">) {
  return (
    <>
      <Suspense fallback={<div className="h-56" />}>
        <Banner params={params} />
      </Suspense>
      <div className="mx-auto max-w-[2000px] px-4 sm:px-6">
        <Suspense fallback={<BrowseSkeleton />}>
          <SubBrowse params={params} searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
