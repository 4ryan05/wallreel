"use client";
import { X } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Overlay used by the intercepted /w/[id] route; closing goes back to the grid underneath. */
export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && router.back();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [router]);

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto bg-[var(--overlay)] backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onMouseDown={(e) => e.target === e.currentTarget && router.back()}
    >
      <motion.div
        role="dialog"
        aria-modal
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="relative mx-auto my-4 w-[min(1600px,calc(100%-1.5rem))] rounded-3xl border border-line bg-elev p-4 shadow-2xl shadow-black/50 sm:my-8 sm:p-5 lg:h-[calc(100vh-4rem)]"
      >
        <button
          onClick={() => router.back()}
          aria-label="Close"
          className="absolute -top-2 right-2 z-10 grid size-10 place-items-center rounded-full border border-line bg-elev text-muted shadow-lg transition hover:rotate-90 hover:text-fg sm:-right-3 sm:-top-3"
        >
          <X className="size-5" />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}
