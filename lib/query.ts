import { RATIOS } from "./ranking";
import type { Device, Sort, TopWindow, WallpaperQuery } from "./types";

const SORTS: Sort[] = ["hot", "new", "top", "comments", "favourites", "views"];
const WINDOWS: TopWindow[] = ["hour", "day", "week", "month", "year", "all"];
const DEVICES: Device[] = ["all", "pc", "mobile"];
export const RESOLUTIONS = [0, 1080, 1440, 2160] as const;

export const TOP_WINDOW_SECONDS: Record<TopWindow, number | null> = {
  hour: 3600,
  day: 86400,
  week: 86400 * 7,
  month: 86400 * 30,
  year: 86400 * 365,
  all: null,
};

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

function get(params: Params, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

function pick<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function parseQuery(
  params: Params,
  defaults: { sort?: Sort; device?: Device; limit?: number } = {},
): WallpaperQuery {
  const ratio = get(params, "ratio");
  const minRes = Number(get(params, "res") ?? 0);
  const ids = get(params, "ids");
  return {
    sub: get(params, "sub") || undefined,
    q: get(params, "q")?.trim().slice(0, 100) || undefined,
    sort: pick(get(params, "sort"), SORTS, defaults.sort ?? "hot"),
    t: pick(get(params, "t"), WINDOWS, "week"),
    device: pick(get(params, "device"), DEVICES, defaults.device ?? "all"),
    minRes: (RESOLUTIONS as readonly number[]).includes(minRes) ? minRes : 0,
    ratio: ratio && ratio in RATIOS ? ratio : undefined,
    ids: ids ? ids.split(",").filter(Boolean).slice(0, 200) : undefined,
    cursor: Math.max(0, Number(get(params, "cursor") ?? 0) || 0),
    limit: Math.min(60, Math.max(1, Number(get(params, "limit") ?? defaults.limit ?? 36) || 36)),
  };
}

/** Serialise a query back to URL params, leaving out defaults so URLs stay short. */
export function queryToParams(q: Partial<WallpaperQuery>): URLSearchParams {
  const p = new URLSearchParams();
  if (q.sub) p.set("sub", q.sub);
  if (q.q) p.set("q", q.q);
  if (q.sort && q.sort !== "hot") p.set("sort", q.sort);
  if (q.sort === "top" && q.t && q.t !== "week") p.set("t", q.t);
  if (q.device && q.device !== "all") p.set("device", q.device);
  if (q.minRes) p.set("res", String(q.minRes));
  if (q.ratio) p.set("ratio", q.ratio);
  if (q.ids?.length) p.set("ids", q.ids.join(","));
  return p;
}
