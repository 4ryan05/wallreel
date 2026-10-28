"use client";
import { Check, Palette } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "./providers";
import { cn } from "@/lib/cn";
import { ACCENTS, THEMES } from "@/lib/themes";

export function ThemeGrid({ compact = false }: { compact?: boolean }) {
  const { theme, accent, setTheme, setAccent } = useTheme();
  return (
    <div className="space-y-4">
      <div className={cn("grid gap-2", compact ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-4")}>
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
              theme === t.id ? "border-accent bg-accent/10 text-fg" : "border-line hover:bg-hover",
            )}
          >
            <span
              className="relative size-6 shrink-0 overflow-hidden rounded-full ring-1 ring-line"
              style={{ background: `linear-gradient(135deg, ${t.swatch[0]} 50%, ${t.swatch[1]} 50%)` }}
            />
            <span className="flex-1 truncate">{t.label}</span>
            {theme === t.id && <Check className="size-4 text-accent" />}
          </button>
        ))}
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-subtle">Accent</p>
        <div className="flex flex-wrap gap-2">
          {ACCENTS.map((a) => (
            <button
              key={a}
              aria-label={`${a} accent`}
              title={a}
              onClick={() => setAccent(a)}
              className={cn(
                "grid size-8 place-items-center rounded-full transition-transform hover:scale-110",
                accent === a && "ring-2 ring-fg ring-offset-2 ring-offset-elev",
              )}
              style={{ background: `var(--c-${a})` }}
            >
              {accent === a && <Check className="size-4 text-black/70" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ThemeMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Theme"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid size-10 place-items-center rounded-full text-muted transition-colors hover:bg-hover hover:text-fg"
      >
        <Palette className="size-5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-12 w-72 origin-top-right rounded-2xl border border-line bg-elev p-3 shadow-2xl shadow-black/30"
          >
            <ThemeGrid compact />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
