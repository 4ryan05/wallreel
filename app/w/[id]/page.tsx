import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { WallpaperDetail } from "@/components/wallpaper-detail";
import { getWallpaper } from "@/lib/data";
import { getWallpaperWithRelated } from "@/lib/data/detail";
import { pickThumb } from "@/lib/ranking";

export async function generateMetadata({ params }: PageProps<"/w/[id]">): Promise<Metadata> {
  const w = await getWallpaper((await params).id);
  if (!w) return { title: "Wallpaper not found" };
  return {
    title: w.title,
    description: `${w.width}×${w.height} wallpaper from r/${w.subreddit} by u/${w.author}`,
    openGraph: { images: [pickThumb(w.thumbs, 960, w.imageUrl)] },
  };
}

async function Content({ params }: { params: PageProps<"/w/[id]">["params"] }) {
  const data = await getWallpaperWithRelated((await params).id);
  if (!data) notFound();
  return (
    <>
      <Link href={`/r/${data.w.subreddit}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> r/{data.w.subreddit}
      </Link>
      <WallpaperDetail w={data.w} related={data.related} />
    </>
  );
}

export default function WallpaperPage({ params }: PageProps<"/w/[id]">) {
  return (
    <div className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6">
      <Suspense fallback={<div className="skeleton h-[70vh] rounded-2xl" />}>
        <Content params={params} />
      </Suspense>
    </div>
  );
}
