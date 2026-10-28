import { cookies } from "next/headers";
import { FilterBar } from "./filter-bar";
import { GridSkeleton, WallpaperGrid } from "./wallpaper-grid";
import { listWallpapers } from "@/lib/data";
import { parseQuery, queryToParams } from "@/lib/query";
import type { Device, Sort } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Filter bar plus infinite grid for any listing (all wallpapers, one subreddit, or a search). */
export async function Browse({
  searchParams,
  sub,
  defaultSort = "hot",
  emptyText,
}: {
  searchParams: SearchParams;
  sub?: string;
  defaultSort?: Sort;
  emptyText?: string;
}) {
  const [params, store] = await Promise.all([searchParams, cookies()]);
  const savedDevice = store.get("wr-device")?.value as Device | undefined;
  const query = parseQuery({ ...params, ...(sub ? { sub } : {}) }, { sort: defaultSort, device: savedDevice });
  const page = await listWallpapers({ ...query, cursor: 0 });
  const key = queryToParams(query).toString();
  return (
    <>
      <FilterBar sort={query.sort} t={query.t} device={query.device} minRes={query.minRes} ratio={query.ratio} />
      <WallpaperGrid key={key} initial={page} params={key} showSub={!sub} emptyText={emptyText} />
    </>
  );
}

export function BrowseSkeleton() {
  return (
    <>
      <div className="mb-5 h-[61px] border-b border-line/70" />
      <GridSkeleton />
    </>
  );
}
