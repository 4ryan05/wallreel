"use client";
import { LoaderCircle, Mail } from "lucide-react";
import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { getBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const ERRORS: Record<string, string> = {
  callback: "That sign-in link didn't work. Please try again.",
  "reddit-disabled": "Reddit sign-in isn't set up on this site yet.",
  "reddit-state": "Reddit sign-in expired. Please try again.",
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function RedditIcon() {
  return (
    <span className="grid size-5 place-items-center rounded-full bg-[#ff4500]">
      <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
        <circle cx="10" cy="11" r="5" fill="white" />
        <circle cx="8" cy="10.6" r="0.9" fill="#ff4500" />
        <circle cx="12" cy="10.6" r="0.9" fill="#ff4500" />
      </svg>
    </span>
  );
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(() => {
    const e = params.get("error");
    return e ? { kind: "error", text: ERRORS[e] ?? "Sign-in failed. Please try again." } : null;
  });

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-3 text-center">
        <h1 className="text-xl font-semibold text-fg">Accounts are off in demo mode</h1>
        <p className="text-sm text-muted">
          Favourites are saved on this device for now. Add Supabase keys to <code className="rounded bg-hover px-1">.env.local</code> to turn on
          email, Google and Reddit sign-in. Anything you favourite now is copied to your account when you first sign in.
        </p>
      </div>
    );
  }

  const db = getBrowserClient()!;
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res =
      mode === "signin"
        ? await db.auth.signInWithPassword({ email, password })
        : await db.auth.signUp({ email, password, options: { emailRedirectTo: `${origin}/auth/callback?next=/favourites` } });
    setBusy(false);
    if (res.error) return setMessage({ kind: "error", text: res.error.message });
    if (mode === "signup" && !res.data.session) {
      return setMessage({ kind: "info", text: "Check your inbox for a confirmation link to finish signing up." });
    }
    router.push("/favourites");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-center text-xl font-semibold text-fg">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-1 text-center text-sm text-muted">Save favourites and get them on every device.</p>

      <div className="mt-6 grid gap-2">
        <button
          onClick={() => db.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin}/auth/callback?next=/favourites` } })}
          className="flex h-11 items-center justify-center gap-3 rounded-full border border-line bg-bg font-medium text-fg transition-colors hover:bg-hover"
        >
          <GoogleIcon /> Continue with Google
        </button>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- route handler that redirects to Reddit */}
        <a
          href="/auth/reddit"
          className="flex h-11 items-center justify-center gap-3 rounded-full border border-line bg-bg font-medium text-fg transition-colors hover:bg-hover"
        >
          <RedditIcon /> Continue with Reddit
        </a>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-subtle">
        <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
      </div>

      <div className="mb-4 grid grid-cols-2 rounded-full bg-sunken p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={cn("relative h-9 rounded-full text-sm font-medium", mode === m ? "text-fg" : "text-muted")}>
            {mode === m && <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-full bg-elev shadow" />}
            <span className="relative">{m === "signin" ? "Sign in" : "Sign up"}</span>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="grid gap-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 rounded-xl border border-line bg-bg px-4 text-fg outline-none transition-colors placeholder:text-subtle focus:border-accent"
        />
        <input
          type="password"
          required
          minLength={8}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="Password (8+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 rounded-xl border border-line bg-bg px-4 text-fg outline-none transition-colors placeholder:text-subtle focus:border-accent"
        />
        {message && (
          <p className={cn("rounded-xl px-3 py-2 text-sm", message.kind === "error" ? "bg-red-500/10 text-red-500" : "bg-accent/10 text-accent")}>
            {message.text}
          </p>
        )}
        <button
          disabled={busy}
          className="mt-1 flex h-11 items-center justify-center gap-2 rounded-full bg-accent font-medium text-accent-fg transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? <LoaderCircle className="size-5 animate-spin" /> : <Mail className="size-5" />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
