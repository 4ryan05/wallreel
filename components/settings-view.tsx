"use client";
import { Monitor, Smartphone, LayoutGrid } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "./providers";
import { ThemeGrid } from "./theme-menu";
import { cn } from "@/lib/cn";
import { readDevice, saveDevice } from "@/lib/device-cookie";
import type { Device } from "@/lib/types";

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-elev p-5">
      <h2 className="font-semibold text-fg">{title}</h2>
      <p className="mb-4 mt-0.5 text-sm text-muted">{hint}</p>
      {children}
    </section>
  );
}

export function SettingsView() {
  const { reducedMotion, setReducedMotion } = useTheme();
  const [device, setDevice] = useState<Device>("all");
  // eslint-disable-next-line react-hooks/set-state-in-effect -- read the cookie after mount
  useEffect(() => setDevice(readDevice()), []);

  return (
    <div className="mt-6 space-y-4">
      <Section title="Theme" hint="Light, dark, or one of the four Catppuccin flavours, plus an accent colour.">
        <ThemeGrid />
      </Section>
      <Section title="Default device" hint="Which wallpapers to show when a page opens. You can still switch on any page.">
        <div className="grid grid-cols-3 gap-2">
          {([["all", LayoutGrid, "Everything"], ["pc", Monitor, "For PC"], ["mobile", Smartphone, "For mobile"]] as const).map(([id, Icon, label]) => (
            <button
              key={id}
              onClick={() => {
                saveDevice(id);
                setDevice(id);
              }}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors",
                device === id ? "border-accent bg-accent/10 text-fg" : "border-line text-muted hover:bg-hover",
              )}
            >
              <Icon className="size-6" />
              {label}
            </button>
          ))}
        </div>
      </Section>
      <Section title="Motion" hint="Turn off animations if you prefer a calmer interface.">
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span className="text-sm text-fg">Reduce motion</span>
          <button
            role="switch"
            aria-checked={reducedMotion}
            onClick={() => setReducedMotion(!reducedMotion)}
            className={cn("relative h-7 w-12 rounded-full transition-colors", reducedMotion ? "bg-accent" : "bg-line")}
          >
            <span className={cn("absolute top-1 size-5 rounded-full bg-white shadow transition-all", reducedMotion ? "left-6" : "left-1")} />
          </button>
        </label>
      </Section>
    </div>
  );
}
