"use client";
import { Search } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { SubredditCard } from "./subreddit-card";
import { cn } from "@/lib/cn";
import { CATEGORIES } from "@/lib/subreddits";
import type { Subreddit } from "@/lib/types";

export function SubredditDirectory({ subs }: { subs: Subreddit[] }) {
  const [category, setCategory] = useState<string>("All");
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = subs.filter(
    (s) =>
      (category === "All" || s.category === category) &&
      (!needle || s.id.includes(needle) || s.description.toLowerCase().includes(needle)),
  );
  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 my-6 flex flex-wrap items-center gap-3 border-b border-line/70 bg-bg/80 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "relative h-9 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors",
                category === c ? "text-accent-fg" : "text-muted hover:bg-hover hover:text-fg",
              )}
            >
              {category === c && <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-accent" />}
              <span className="relative">{c}</span>
            </button>
          ))}
        </div>
        <label className="ml-auto flex h-10 w-full items-center gap-2 rounded-full border border-line bg-elev px-4 focus-within:border-accent sm:w-72">
          <Search className="size-4 text-subtle" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter subreddits"
            className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-subtle"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {shown.map((s, i) => (
          <SubredditCard key={s.id} s={s} index={i} />
        ))}
      </div>
      {!shown.length && <p className="py-20 text-center text-muted">No subreddits match “{q}”.</p>}
    </>
  );
}
