// The communities Wallreel indexes. Edit this list to add or remove subreddits;
// the sync job validates each one and deactivates any that are private, banned or NSFW.
export interface SubredditSeed {
  name: string;
  category: "General" | "Desktop" | "Mobile" | "Nature" | "Space" | "City" | "Art" | "Anime";
  blurb: string;
}

export const SUBREDDITS: SubredditSeed[] = [
  { name: "wallpaper", category: "General", blurb: "The original home of desktop and phone backgrounds." },
  { name: "wallpapers", category: "General", blurb: "High-resolution wallpapers of every kind." },
  { name: "WidescreenWallpaper", category: "Desktop", blurb: "Wallpapers made for wide and ultrawide screens." },
  { name: "MinimalWallpaper", category: "Art", blurb: "Clean, simple and minimal backgrounds." },
  { name: "Animewallpaper", category: "Anime", blurb: "Anime and manga art sized for your screens." },
  { name: "MobileWallpaper", category: "Mobile", blurb: "Tall wallpapers for phones and tablets." },
  { name: "iphonewallpapers", category: "Mobile", blurb: "Backgrounds made for iPhone displays." },
  { name: "Amoledbackgrounds", category: "Mobile", blurb: "True-black wallpapers that save OLED battery." },
  { name: "VerticalWallpapers", category: "Mobile", blurb: "Portrait-first wallpapers for vertical screens." },
  { name: "phonewallpapers", category: "Mobile", blurb: "A daily stream of phone backgrounds." },
  { name: "wallpaperdump", category: "General", blurb: "Big themed albums of wallpapers." },
  { name: "ultrawidemasterrace", category: "Desktop", blurb: "Ultrawide setups and 21:9 wallpapers." },
  { name: "EarthPorn", category: "Nature", blurb: "Stunning photos of the natural world." },
  { name: "SpacePorn", category: "Space", blurb: "Astrophotography and images from space." },
  { name: "CityPorn", category: "City", blurb: "Skylines and streets from cities worldwide." },
  { name: "SkyPorn", category: "Nature", blurb: "Sunsets, storms and dramatic skies." },
  { name: "ImaginaryLandscapes", category: "Art", blurb: "Painted and digital fantasy landscapes." },
  { name: "ImaginaryTechnology", category: "Art", blurb: "Concept art of machines and sci-fi tech." },
  { name: "ImaginaryCityscapes", category: "Art", blurb: "Fantasy and futuristic cities." },
  { name: "ExposurePorn", category: "Nature", blurb: "Long exposures and light trails." },
  { name: "WaterPorn", category: "Nature", blurb: "Oceans, lakes, rivers and waterfalls." },
  { name: "VillagePorn", category: "City", blurb: "Small towns and villages around the world." },
  { name: "AbandonedPorn", category: "City", blurb: "Abandoned and forgotten places." },
  { name: "DigitalArt", category: "Art", blurb: "Digital paintings and illustrations." },
  { name: "PixelArt", category: "Art", blurb: "Pixel art scenes and characters." },
];

export const CATEGORIES = ["All", "General", "Desktop", "Mobile", "Nature", "Space", "City", "Art", "Anime"] as const;

export function findSeed(name: string) {
  const key = name.toLowerCase();
  return SUBREDDITS.find((s) => s.name.toLowerCase() === key);
}
