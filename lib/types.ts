export type Orientation = "landscape" | "portrait" | "square";

export interface Thumb {
  w: number;
  h: number;
  u: string;
}

export interface Wallpaper {
  id: string;
  postId: string;
  subreddit: string;
  title: string;
  author: string;
  permalink: string;
  imageUrl: string;
  thumbs: Thumb[];
  tinyUrl: string | null;
  width: number;
  height: number;
  orientation: Orientation;
  fileSize: number | null;
  mime: string | null;
  score: number;
  upvoteRatio: number;
  numComments: number;
  createdUtc: string;
  views: number;
  favouritesCount: number;
}

export interface Subreddit {
  id: string;
  name: string;
  title: string;
  description: string;
  category: string;
  iconUrl: string | null;
  bannerUrl: string | null;
  subscribers: number;
  wallpaperCount: number;
  cover: Wallpaper | null;
}

export type Sort = "hot" | "new" | "top" | "comments" | "favourites" | "views";
export type TopWindow = "hour" | "day" | "week" | "month" | "year" | "all";
export type Device = "all" | "pc" | "mobile";

export interface WallpaperQuery {
  sub?: string;
  q?: string;
  sort: Sort;
  t: TopWindow;
  device: Device;
  minRes: number;
  ratio?: string;
  ids?: string[];
  cursor: number;
  limit: number;
}

export interface Page<T> {
  items: T[];
  nextCursor: number | null;
}
