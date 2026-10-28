import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Modal } from "@/components/modal";
import { WallpaperDetail } from "@/components/wallpaper-detail";
import { getWallpaperWithRelated } from "@/lib/data/detail";

async function Content({ params }: { params: PageProps<"/w/[id]">["params"] }) {
  const data = await getWallpaperWithRelated((await params).id);
  if (!data) notFound();
  return <WallpaperDetail w={data.w} related={data.related} inModal />;
}

/** Opening a wallpaper from a grid shows it in a modal; a direct visit renders app/w/[id]. */
export default function WallpaperModal({ params }: PageProps<"/w/[id]">) {
  return (
    <Modal>
      <Suspense fallback={<div className="skeleton h-[60vh] rounded-2xl lg:h-full" />}>
        <Content params={params} />
      </Suspense>
    </Modal>
  );
}
