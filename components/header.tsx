"use client";
import { Heart, LogIn, LogOut, Search, Settings, User } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CommandPalette } from "./command-palette";
import { useFavourites } from "./providers";
import { ThemeMenu } from "./theme-menu";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Explore" },
  { href: "/subreddits", label: "Subreddits" },
  { href: "/favourites", label: "Favourites" },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-fg">
      <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-fg shadow-lg shadow-accent/30">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17l5-6 4 4 3-3 6 5" />
          <circle cx="16" cy="7" r="2" />
        </svg>
      </span>
      <span className="text-lg">wallreel</span>
    </Link>
  );
}

function UserMenu() {
  const { user, authReady, ids } = useFavourites();
  const [open, setOpen] = useState(false);
  if (!authReady) return <div className="size-10" />;
  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-fg transition-transform hover:scale-[1.03] active:scale-95"
      >
        <LogIn className="size-4" />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }
  const name = (user.user_metadata.username || user.user_metadata.full_name || user.email?.split("@")[0]) as string;
  const avatar = (user.user_metadata.avatar_url || user.user_metadata.picture) as string | undefined;
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account"
        className="grid size-10 place-items-center overflow-hidden rounded-full bg-hover ring-2 ring-transparent transition hover:ring-accent"
      >
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="size-full object-cover" />
        ) : (
          <User className="size-5 text-muted" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-56 rounded-2xl border border-line bg-elev p-2 shadow-2xl shadow-black/30">
          <p className="truncate px-3 py-2 text-sm font-medium">{name}</p>
          <Link href="/favourites" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-hover hover:text-fg">
            <Heart className="size-4" /> Favourites <span className="ml-auto text-subtle">{ids.length}</span>
          </Link>
          <Link href="/settings" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-hover hover:text-fg">
            <Settings className="size-4" /> Settings
          </Link>
          <form action="/auth/signout" method="post">
            <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted hover:bg-hover hover:text-fg">
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function NavLinks({ pathname, mobile }: { pathname: string; mobile?: boolean }) {
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  if (mobile) {
    return NAV.map((n) => (
      <Link
        key={n.href}
        href={n.href}
        className={cn("flex-1 rounded-xl py-2 text-center text-xs font-medium", isActive(n.href) ? "bg-accent text-accent-fg" : "text-muted")}
      >
        {n.label}
      </Link>
    ));
  }
  return NAV.map((n) => (
    <Link
      key={n.href}
      href={n.href}
      className={cn("relative rounded-full px-3.5 py-1.5 text-sm transition-colors", isActive(n.href) ? "text-fg" : "text-muted hover:text-fg")}
    >
      {isActive(n.href) && (
        <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-hover" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
      )}
      <span className="relative">{n.label}</span>
    </Link>
  ));
}

/** The pathname is request data on dynamic routes, so the active state streams in under Suspense. */
function ActiveNavLinks({ mobile }: { mobile?: boolean }) {
  return <NavLinks pathname={usePathname()} mobile={mobile} />;
}

export function Header() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 h-16 border-b transition-colors duration-300",
          scrolled ? "border-line/70 bg-bg/75 backdrop-blur-xl" : "border-transparent bg-bg/0",
        )}
      >
        <div className="mx-auto flex h-full max-w-[2000px] items-center gap-3 px-4 sm:px-6">
          <Logo />
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            <Suspense fallback={<NavLinks pathname="" />}>
              <ActiveNavLinks />
            </Suspense>
          </nav>
          <button
            onClick={() => setPaletteOpen(true)}
            className="ml-auto flex h-10 w-10 items-center gap-2 rounded-full border border-line bg-elev/70 px-3 text-sm text-subtle transition-colors hover:border-accent/50 hover:text-fg sm:w-64 lg:w-80"
          >
            <Search className="size-4 shrink-0" />
            <span className="hidden flex-1 text-left sm:inline">Search wallpapers…</span>
            <kbd className="hidden rounded-md border border-line px-1.5 text-[11px] sm:inline">Ctrl K</kbd>
          </button>
          <ThemeMenu />
          <UserMenu />
        </div>
      </header>
      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-2xl border border-line bg-elev/85 p-1.5 shadow-2xl shadow-black/30 backdrop-blur-xl md:hidden">
        <Suspense fallback={<NavLinks pathname="" mobile />}>
          <ActiveNavLinks mobile />
        </Suspense>
      </nav>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
