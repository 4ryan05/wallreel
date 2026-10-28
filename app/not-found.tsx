import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-7xl font-bold text-accent">404</p>
      <h1 className="text-xl font-semibold text-fg">This wallpaper drifted away</h1>
      <p className="max-w-sm text-muted">It may have been removed from Reddit, or the link is wrong.</p>
      <Link href="/" className="rounded-full bg-accent px-5 py-2.5 font-medium text-accent-fg">
        Back to home
      </Link>
    </div>
  );
}
