import type { Device } from "./types";

/** The device filter a visitor last picked; the server reads it to choose the default filter. */
export function saveDevice(device: Device) {
  document.cookie = `wr-device=${device}; path=/; max-age=31536000; samesite=lax`;
}

export function readDevice(): Device {
  const m = /(?:^|; )wr-device=(all|pc|mobile)/.exec(document.cookie);
  return (m?.[1] as Device) ?? "all";
}
