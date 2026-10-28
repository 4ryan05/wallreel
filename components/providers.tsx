"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { ACCENT_KEY, MOTION_KEY, THEME_KEY, type Accent, type ThemeId } from "@/lib/themes";

/* ---------------- Theme ---------------- */

interface ThemeState {
  theme: ThemeId;
  accent: Accent;
  reducedMotion: boolean;
  setTheme: (t: ThemeId) => void;
  setAccent: (a: Accent) => void;
  setReducedMotion: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

function resolve(theme: ThemeId) {
  if (theme !== "system") return theme;
  return matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function withTransition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (doc.startViewTransition && document.documentElement.dataset.motion !== "reduced") doc.startViewTransition(update);
  else update();
}

function read<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T) || fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode); the choice lasts for this page only.
  }
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("system");
  const [accent, setAccentState] = useState<Accent>("mauve");
  const [reducedMotion, setReduced] = useState(false);

  useEffect(() => {
    // Sync React state with what the boot script already applied to <html>.
    /* eslint-disable react-hooks/set-state-in-effect */
    setThemeState(read(THEME_KEY, "system"));
    setAccentState(read(ACCENT_KEY, "mauve"));
    setReduced(read<string>(MOTION_KEY, "") === "reduced");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: light)");
    const onChange = () => withTransition(() => (document.documentElement.dataset.theme = resolve("system")));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const value = useMemo<ThemeState>(
    () => ({
      theme,
      accent,
      reducedMotion,
      setTheme: (t) => {
        write(THEME_KEY, t);
        setThemeState(t);
        withTransition(() => (document.documentElement.dataset.theme = resolve(t)));
      },
      setAccent: (a) => {
        write(ACCENT_KEY, a);
        setAccentState(a);
        withTransition(() => (document.documentElement.dataset.accent = a));
      },
      setReducedMotion: (v) => {
        write(MOTION_KEY, v ? "reduced" : "");
        setReduced(v);
        if (v) document.documentElement.dataset.motion = "reduced";
        else delete document.documentElement.dataset.motion;
      },
    }),
    [theme, accent, reducedMotion],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <Providers>");
  return ctx;
}

/* ---------------- Auth + favourites ---------------- */

interface FavouritesState {
  user: User | null;
  authReady: boolean;
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
}

const FavouritesContext = createContext<FavouritesState | null>(null);
const LOCAL_FAVS = "wr-favourites";

function readLocalFavs(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(LOCAL_FAVS) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

async function postFavs(body: { add?: string[]; remove?: string[] }) {
  const res = await fetch("/api/favourites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Could not update favourites");
}

/**
 * Guests keep favourites in localStorage. When someone signs in, those are merged into
 * their account and the account becomes the source of truth.
 */
function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    const db = getBrowserClient();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
    setIds(readLocalFavs());
    if (!db) {
      setAuthReady(true);
      return;
    }
    const load = async (u: User | null) => {
      userRef.current = u;
      setUser(u);
      setAuthReady(true);
      if (!u) {
        setIds(readLocalFavs());
        return;
      }
      const local = readLocalFavs();
      if (local.length) {
        await postFavs({ add: local }).catch(() => {});
        localStorage.removeItem(LOCAL_FAVS);
      }
      const res = await fetch("/api/favourites");
      if (res.ok) setIds((await res.json()).ids);
    };
    const { data } = db.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "SIGNED_OUT") {
        // Defer: Supabase forbids awaiting other client calls inside this callback.
        setTimeout(() => load(session?.user ?? null), 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const idsRef = useRef(ids);
  useEffect(() => {
    idsRef.current = ids;
  }, [ids]);

  const toggle = useCallback((id: string) => {
    const prev = idsRef.current;
    const on = !prev.includes(id);
    const next = on ? [id, ...prev] : prev.filter((x) => x !== id);
    idsRef.current = next;
    setIds(next);
    if (userRef.current) {
      postFavs(on ? { add: [id] } : { remove: [id] }).catch(() => setIds(prev));
    } else {
      write(LOCAL_FAVS, JSON.stringify(next));
    }
  }, []);

  const set = useMemo(() => new Set(ids), [ids]);
  const value = useMemo<FavouritesState>(
    () => ({ user, authReady, ids, has: (id) => set.has(id), toggle }),
    [user, authReady, ids, set, toggle],
  );
  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error("useFavourites must be used inside <Providers>");
  return ctx;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <FavouritesProvider>{children}</FavouritesProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
