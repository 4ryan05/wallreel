"use client";
import { Heart } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useFavourites } from "./providers";
import { cn } from "@/lib/cn";

export function FavouriteButton({
  id,
  className,
  size = "sm",
  label = false,
}: {
  id: string;
  className?: string;
  size?: "sm" | "lg";
  label?: boolean;
}) {
  const { has, toggle } = useFavourites();
  const on = has(id);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Remove from favourites" : "Add to favourites"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-full transition-colors",
        size === "sm" ? "size-9 bg-black/45 text-white backdrop-blur-md hover:bg-black/65" : "h-11 px-4 font-medium",
        size === "lg" && (on ? "bg-accent/15 text-accent" : "bg-hover text-fg hover:bg-line"),
        className,
      )}
    >
      <motion.span
        key={on ? "on" : "off"}
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
        className="relative inline-flex"
      >
        <Heart className={cn(size === "sm" ? "size-[18px]" : "size-5", on && "fill-current", on && size === "sm" && "text-[#ff4d6d]")} />
        <AnimatePresence>
          {on && (
            <motion.span
              initial={{ scale: 0.4, opacity: 0.8 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 rounded-full border-2 border-current"
            />
          )}
        </AnimatePresence>
      </motion.span>
      {label && <span>{on ? "Favourited" : "Favourite"}</span>}
    </button>
  );
}
