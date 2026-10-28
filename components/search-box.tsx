"use client";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initial);

  function submit(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value.trim()) next.set("q", value.trim());
    else next.delete("q");
    router.push(`/search?${next.toString()}`, { scroll: false });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(q);
      }}
      className="flex h-12 w-full items-center gap-2 rounded-full border border-line bg-elev px-4 transition-colors focus-within:border-accent sm:w-96"
    >
      <Search className="size-5 text-subtle" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="mountains, neon, 4k anime…"
        className="flex-1 bg-transparent text-fg outline-none placeholder:text-subtle"
        aria-label="Search wallpapers"
      />
      {q && (
        <button
          type="button"
          aria-label="Clear"
          onClick={() => {
            setQ("");
            submit("");
          }}
          className="text-subtle hover:text-fg"
        >
          <X className="size-4" />
        </button>
      )}
    </form>
  );
}
