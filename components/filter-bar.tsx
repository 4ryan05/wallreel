"use client";
import { Eye, Flame, Heart, MessageSquare, Monitor, Smartphone, Sparkles, Trophy, LayoutGrid } from "lucide-react";
import { motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/cn";
import { saveDevice } from "@/lib/device-cookie";
import { RATIOS } from "@/lib/ranking";
import type { Device, Sort, TopWindow } from "@/lib/types";

const SORTS: { id: Sort; label: string; icon: React.ElementType }[] = [
  { id: "hot", label: "Hot", icon: Flame },
  { id: "new", label: "New", icon: Sparkles },
  { id: "top", label: "Top", icon: Trophy },
  { id: "comments", label: "Comments", icon: MessageSquare },
  { id: "favourites", label: "Favourites", icon: Heart },
  { id: "views", label: "Views", icon: Eye },
];

const WINDOWS: { id: TopWindow; label: string }[] = [
  { id: "hour", label: "Past hour" },
  { id: "day", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "year", label: "This year" },
  { id: "all", label: "All time" },
];

const DEVICES: { id: Device; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "pc", label: "For PC", icon: Monitor },
  { id: "mobile", label: "For Mobile", icon: Smartphone },
];

export function FilterBar({
  sort,
  t,
  device,
  minRes,
  ratio,
  sorts = SORTS.map((s) => s.id),
}: {
  sort: Sort;
  t: TopWindow;
  device: Device;
  minRes: number;
  ratio?: string;
  sorts?: Sort[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, start] = useTransition();

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(search.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    // Remember the device choice so every page opens with it.
    if ("device" in patch) saveDevice((patch.device ?? "all") as Device);
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  const visibleSorts = SORTS.filter((s) => sorts.includes(s.id));
  const isRatioForDevice = (key: string) =>
    device === "all" || (device === "pc" ? RATIOS[key].value > 1 : RATIOS[key].value < 1);

  return (
    <div
      className={cn(
        "sticky top-16 z-30 -mx-4 mb-5 border-b border-line/70 bg-bg/80 px-4 py-3 backdrop-blur-xl transition-opacity sm:-mx-6 sm:px-6",
        pending && "opacity-80",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="no-scrollbar -mx-1 flex max-w-full items-center gap-1 overflow-x-auto px-1">
          {visibleSorts.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => update({ sort: id === "hot" ? null : id, t: id === "top" ? t : null })}
              className={cn(
                "relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors",
                sort === id ? "text-accent-fg" : "text-muted hover:bg-hover hover:text-fg",
              )}
            >
              {sort === id && (
                <motion.span
                  layoutId="sort-pill"
                  className="absolute inset-0 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon className="relative size-4" />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>

        {sort === "top" && (
          <select
            aria-label="Time range"
            value={t}
            onChange={(e) => update({ t: e.target.value })}
            className="h-9 rounded-full border border-line bg-elev px-3 text-sm text-fg"
          >
            {WINDOWS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-line bg-elev p-0.5" role="radiogroup" aria-label="Device">
            {DEVICES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="radio"
                aria-checked={device === id}
                onClick={() => update({ device: id, ratio: null })}
                className={cn(
                  "relative inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm transition-colors",
                  device === id ? "text-fg" : "text-muted hover:text-fg",
                )}
              >
                {device === id && (
                  <motion.span
                    layoutId="device-pill"
                    className="absolute inset-0 rounded-full bg-hover ring-1 ring-line"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon className="relative size-4" />
                <span className="relative hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <select
            aria-label="Minimum resolution"
            value={minRes}
            onChange={(e) => update({ res: e.target.value === "0" ? null : e.target.value })}
            className="h-9 rounded-full border border-line bg-elev px-3 text-sm text-fg"
          >
            <option value={0}>Any resolution</option>
            <option value={1080}>1080p+</option>
            <option value={1440}>1440p+</option>
            <option value={2160}>4K+</option>
          </select>
          <select
            aria-label="Aspect ratio"
            value={ratio ?? ""}
            onChange={(e) => update({ ratio: e.target.value || null })}
            className="h-9 rounded-full border border-line bg-elev px-3 text-sm text-fg"
          >
            <option value="">Any ratio</option>
            {Object.entries(RATIOS)
              .filter(([key]) => isRatioForDevice(key))
              .map(([key, r]) => (
                <option key={key} value={key}>
                  {r.label}
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
}
