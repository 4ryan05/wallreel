import { describe, expect, it } from "vitest";
import { estimateVotes, hotScore, orientationOf, ratioLabel } from "../ranking";
import { isWallpaperShaped, parsePost } from "../reddit";
import { parseQuery, queryToParams } from "../query";

const single = {
  id: "abc123",
  subreddit: "EarthPorn",
  title: "Lake at dawn [3840x2160]",
  author: "someone",
  permalink: "/r/EarthPorn/comments/abc123/lake/",
  score: 1500,
  upvote_ratio: 0.95,
  num_comments: 42,
  created_utc: 1_760_000_000,
  url_overridden_by_dest: "https://i.redd.it/xyz.jpg",
  preview: {
    images: [
      {
        source: { url: "https://preview.redd.it/xyz.jpg?width=3840", width: 3840, height: 2160 },
        resolutions: [
          { url: "https://preview.redd.it/xyz.jpg?width=108", width: 108, height: 60 },
          { url: "https://preview.redd.it/xyz.jpg?width=640", width: 640, height: 360 },
        ],
      },
    ],
  },
};

describe("parsePost", () => {
  it("parses a single image post", () => {
    const [row] = parsePost(single);
    expect(row).toMatchObject({
      id: "abc123",
      subreddit: "earthporn",
      image_url: "https://i.redd.it/xyz.jpg",
      width: 3840,
      height: 2160,
      mime: "image/jpeg",
      permalink: "https://www.reddit.com/r/EarthPorn/comments/abc123/lake/",
      tiny_url: "https://preview.redd.it/xyz.jpg?width=108",
    });
    expect(row.thumbs).toHaveLength(2);
  });

  it("falls back to the preview source when the link isn't a direct image", () => {
    const [row] = parsePost({ ...single, url_overridden_by_dest: "https://imgur.com/gallery/foo" });
    expect(row.image_url).toBe("https://preview.redd.it/xyz.jpg?width=3840");
  });

  it("skips NSFW, video and removed posts", () => {
    expect(parsePost({ ...single, over_18: true })).toEqual([]);
    expect(parsePost({ ...single, is_video: true })).toEqual([]);
    expect(parsePost({ ...single, removed_by_category: "moderator" })).toEqual([]);
  });

  it("splits galleries into one row per valid image", () => {
    const gallery = {
      ...single,
      id: "gal1",
      preview: undefined,
      is_gallery: true,
      gallery_data: { items: [{ media_id: "m1" }, { media_id: "m2" }, { media_id: "m3" }] },
      media_metadata: {
        m1: { status: "valid", e: "Image", m: "image/png", s: { x: 1080, y: 2400, u: "https://preview.redd.it/m1.png" }, p: [{ x: 108, y: 240, u: "https://preview.redd.it/m1-s.png" }] },
        m2: { status: "valid", e: "AnimatedImage", m: "image/gif", s: { x: 500, y: 500 } },
        m3: { status: "valid", e: "Image", m: "image/jpg", s: { x: 2560, y: 1440, u: "https://preview.redd.it/m3.jpg" }, p: [] },
      },
    };
    const rows = parsePost(gallery);
    expect(rows.map((r) => r.id)).toEqual(["gal1-0", "gal1-2"]);
    expect(rows[0]).toMatchObject({ image_url: "https://i.redd.it/m1.png", width: 1080, height: 2400, mime: "image/png" });
    expect(rows[1].image_url).toBe("https://i.redd.it/m3.jpg");
  });

  it("uses the parent post's media for crossposts but keeps the crosspost's id and stats", () => {
    const cross = { ...single, id: "x1", score: 10, preview: undefined, url_overridden_by_dest: undefined, crosspost_parent_list: [single] };
    const [row] = parsePost(cross);
    expect(row).toMatchObject({ id: "x1", score: 10, image_url: "https://i.redd.it/xyz.jpg" });
  });

  it("rejects small images", () => {
    const [row] = parsePost(single);
    expect(isWallpaperShaped(row)).toBe(true);
    expect(isWallpaperShaped({ ...row, width: 640, height: 480 })).toBe(false);
  });
});

describe("ranking", () => {
  it("ranks newer posts higher at equal score, and higher scores higher at equal age", () => {
    expect(hotScore(100, 1_760_000_000)).toBeGreaterThan(hotScore(100, 1_759_900_000));
    expect(hotScore(1000, 1_760_000_000)).toBeGreaterThan(hotScore(100, 1_760_000_000));
  });

  it("estimates up and down votes from score and ratio", () => {
    expect(estimateVotes(900, 0.9)).toEqual({ ups: 1013, downs: 113 });
    expect(estimateVotes(5, 1)).toEqual({ ups: 5, downs: 0 });
    expect(estimateVotes(0, 0.5)).toEqual({ ups: 0, downs: 0 });
  });

  it("classifies orientation and ratios", () => {
    expect(orientationOf(1920, 1080)).toBe("landscape");
    expect(orientationOf(1080, 2400)).toBe("portrait");
    expect(orientationOf(1000, 1050)).toBe("square");
    expect(ratioLabel(3440, 1440)).toBe("21:9");
    expect(ratioLabel(1170, 2532)).toBe("9:19.5");
  });
});

describe("query parsing", () => {
  it("falls back to defaults for unknown values and round-trips", () => {
    const q = parseQuery({ sort: "bogus", device: "mobile", res: "2160", ratio: "21x9", t: "month" });
    expect(q).toMatchObject({ sort: "hot", device: "mobile", minRes: 2160, ratio: "21x9" });
    expect(queryToParams({ ...q, sort: "top" }).toString()).toBe("sort=top&t=month&device=mobile&res=2160&ratio=21x9");
  });
});
