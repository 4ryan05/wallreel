"use client";
import { ArrowBigUp, ChevronLeft, ChevronRight, Download, Maximize2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatCount, pickThumb } from "@/lib/ranking";
import type { Wallpaper } from "@/lib/types";

/** Full-bleed carousel of the week's top desktop wallpapers with a slow Ken Burns pan. */
export function Hero({ items }: { items: Wallpaper[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback((d: number) => setIndex((i) => (i + d + items.length) % items.length), [items.length]);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const id = setTimeout(() => go(1), 7000);
    return () => clearTimeout(id);
  }, [index, paused, go, items.length]);

  // Warm the next slide so the crossfade never shows a blank frame.
  useEffect(() => {
    const next = items[(index + 1) % items.length];
    if (next) new Image().src = pickThumb(next.thumbs, 1900, next.imageUrl);
  }, [index, items]);

  if (!items.length) return null;
  const w = items[index];

  return (
    <section
      className="relative -mt-16 h-[78vh] min-h-[520px] overflow-hidden bg-sunken"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={w.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pickThumb(w.thumbs, 1900, w.imageUrl)}
            alt={w.title}
            fetchPriority={index === 0 ? "high" : "auto"}
            className="kenburns size-full object-cover"
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

      <div className="relative mx-auto flex h-full max-w-[2000px] flex-col justify-end px-4 pb-14 sm:px-6 lg:pb-20">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-white/70"
        >
          Top wallpapers this week
        </motion.p>
        <AnimatePresence mode="wait">
          <motion.div
            key={w.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
            className="max-w-3xl"
          >
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl">
              {w.title.replace(/\s*[[(]\d{3,5}\s*[x×]\s*\d{3,5}[\])]\s*/i, " ").trim()}
            </h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/80">
              <Link href={`/r/${w.subreddit}`} className="font-semibold text-white hover:underline">
                r/{w.subreddit}
              </Link>
              <span>u/{w.author}</span>
              <span>
                {w.width}×{w.height}
              </span>
              <span className="inline-flex items-center">
                <ArrowBigUp className="size-4" /> {formatCount(w.score)}
              </span>
            </p>
          </motion.div>
        </AnimatePresence>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={`/w/${w.id}`}
            scroll={false}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 font-medium text-black transition-transform hover:scale-[1.03] active:scale-95"
          >
            <Maximize2 className="size-4" /> View wallpaper
          </Link>
          <a
            href={`/api/download/${w.id}`}
            download
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white/15 px-5 font-medium text-white backdrop-blur-md transition hover:bg-white/25"
          >
            <Download className="size-4" /> Download
          </a>
          <div className="ml-auto flex items-center gap-2">
            <div className="mr-2 hidden gap-1.5 sm:flex">
              {items.map((item, i) => (
                <button
                  key={item.id}
                  aria-label={`Show slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className="relative h-1.5 w-8 overflow-hidden rounded-full bg-white/25"
                >
                  {i === index && (
                    <motion.span
                      key={`${item.id}-${paused}`}
                      className="absolute inset-y-0 left-0 bg-white"
                      initial={{ width: paused ? "100%" : "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: paused ? 0 : 7, ease: "linear" }}
                    />
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => go(-1)} aria-label="Previous" className="grid size-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md hover:bg-white/25">
              <ChevronLeft className="size-5" />
            </button>
            <button onClick={() => go(1)} aria-label="Next" className="grid size-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md hover:bg-white/25">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
