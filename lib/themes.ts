export const THEMES = [
  { id: "system", label: "System", swatch: ["#f6f6f9", "#0b0b10"] },
  { id: "light", label: "Light", swatch: ["#ffffff", "#15151d"] },
  { id: "dark", label: "Dark", swatch: ["#0b0b10", "#ececf3"] },
  { id: "latte", label: "Catppuccin Latte", swatch: ["#eff1f5", "#4c4f69"] },
  { id: "frappe", label: "Catppuccin Frappé", swatch: ["#303446", "#c6d0f5"] },
  { id: "macchiato", label: "Catppuccin Macchiato", swatch: ["#24273a", "#cad3f5"] },
  { id: "mocha", label: "Catppuccin Mocha", swatch: ["#1e1e2e", "#cdd6f4"] },
] as const;

export const ACCENTS = ["mauve", "blue", "lavender", "teal", "green", "yellow", "peach", "pink", "red"] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export type Accent = (typeof ACCENTS)[number];

export const THEME_KEY = "wr-theme";
export const ACCENT_KEY = "wr-accent";
export const MOTION_KEY = "wr-motion";

/** Runs before first paint (inlined in <head>) so the saved theme never flashes. */
export const themeBootScript = `(function(){try{var d=document.documentElement,t=localStorage.getItem("${THEME_KEY}")||"system",a=localStorage.getItem("${ACCENT_KEY}")||"mauve",m=localStorage.getItem("${MOTION_KEY}");if(t==="system")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";d.dataset.theme=t;d.dataset.accent=a;if(m)d.dataset.motion=m}catch(e){}})()`;
