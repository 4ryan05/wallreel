import type { Orientation, Thumb } from "./types";

const REDDIT_EPOCH = 1134028003;

/** Reddit's "hot" ranking: log-scaled score plus a time bonus that doubles every 12.5h. */
export function hotScore(score: number, createdSeconds: number): number {
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  return Math.round((sign * order + (createdSeconds - REDDIT_EPOCH) / 45000) * 1e7) / 1e7;
}

/**
 * Reddit only exposes score and upvote ratio, so up/down votes are estimated:
 * ups - downs = score and ups / (ups + downs) = ratio.
 */
export function estimateVotes(score: number, ratio: number): { ups: number; downs: number } {
  if (score <= 0 || ratio <= 0.5 || ratio > 1) return { ups: Math.max(score, 0), downs: 0 };
  const ups = Math.round((score * ratio) / (2 * ratio - 1));
  return { ups, downs: Math.max(ups - score, 0) };
}

export function orientationOf(width: number, height: number): Orientation {
  if (width > height * 1.1) return "landscape";
  if (height > width * 1.1) return "portrait";
  return "square";
}

export const RATIOS: Record<string, { label: string; value: number }> = {
  "16x9": { label: "16:9", value: 16 / 9 },
  "16x10": { label: "16:10", value: 16 / 10 },
  "21x9": { label: "21:9", value: 21 / 9 },
  "32x9": { label: "32:9", value: 32 / 9 },
  "9x16": { label: "9:16", value: 9 / 16 },
  "9x19.5": { label: "9:19.5", value: 9 / 19.5 },
  "9x20": { label: "9:20", value: 9 / 20 },
  "1x1": { label: "1:1", value: 1 },
};

export const RATIO_TOLERANCE = 0.03;

export function ratioLabel(width: number, height: number): string {
  const r = width / height;
  for (const { label, value } of Object.values(RATIOS)) {
    if (Math.abs(r - value) / value <= RATIO_TOLERANCE) return label;
  }
  return r >= 1 ? `${r.toFixed(2)}:1` : `1:${(1 / r).toFixed(2)}`;
}

export function resolutionTag(width: number, height: number): string | null {
  const side = Math.min(width, height);
  if (side >= 4320) return "8K";
  if (side >= 2160) return "4K";
  if (side >= 1440) return "QHD";
  if (side >= 1080) return "FHD";
  return null;
}

export function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const steps: [number, string][] = [
    [60, "m"],
    [3600, "h"],
    [86400, "d"],
    [86400 * 30, "mo"],
    [86400 * 365, "y"],
  ];
  let label = "m";
  let unit = 60;
  for (const [size, l] of steps) {
    if (s >= size) {
      unit = size;
      label = l;
    }
  }
  return `${Math.floor(s / unit)}${label} ago`;
}

/** Smallest thumb at least `minWidth` wide, falling back to the largest available. */
export function pickThumb(thumbs: Thumb[], minWidth: number, fallback: string): string {
  const sorted = [...thumbs].sort((a, b) => a.w - b.w);
  return (sorted.find((t) => t.w >= minWidth) ?? sorted.at(-1))?.u ?? fallback;
}

export function extensionOf(mime: string | null, url: string): string {
  if (mime?.includes("png")) return "png";
  if (mime?.includes("webp")) return "webp";
  const m = /\.(jpe?g|png|webp)(?:\?|$)/i.exec(url);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}
