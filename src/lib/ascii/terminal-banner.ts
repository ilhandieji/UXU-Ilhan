// Hand-off of ASCII art / animations from the editor to the Terminal (plain text lines in
// localStorage; too large for a URL, and it survives a refresh of the Terminal page).

const KEY = "uxu:terminal-banner";
const MAX_LINES = 200;

export function saveBannerArt(lines: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines.slice(0, MAX_LINES)));
  } catch {
    // Without storage the Terminal keeps its default banner
  }
}

export function readBannerArt(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return Array.isArray(parsed) && parsed.length && parsed.every((l) => typeof l === "string")
      ? (parsed as string[]).slice(0, MAX_LINES)
      : null;
  } catch {
    return null;
  }
}

const ANIMATION_KEY = "uxu:terminal-animation";
const MAX_FRAMES = 60;

export interface BannerAnimation {
  frames: string[][];
  fps: number;
}

export function saveBannerAnimation(animation: BannerAnimation) {
  try {
    localStorage.setItem(
      ANIMATION_KEY,
      JSON.stringify({
        fps: animation.fps,
        frames: animation.frames.slice(0, MAX_FRAMES).map((f) => f.slice(0, MAX_LINES)),
      }),
    );
  } catch {
    // Without storage the Terminal simply has no `play` animation
  }
}

export function readBannerAnimation(): BannerAnimation | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(
      localStorage.getItem(ANIMATION_KEY) ?? "null",
    ) as BannerAnimation | null;
    const valid =
      parsed &&
      typeof parsed.fps === "number" &&
      Array.isArray(parsed.frames) &&
      parsed.frames.length > 0 &&
      parsed.frames.every((f) => Array.isArray(f) && f.every((l) => typeof l === "string"));
    return valid
      ? { fps: Math.min(30, Math.max(1, parsed.fps)), frames: parsed.frames.slice(0, MAX_FRAMES) }
      : null;
  } catch {
    return null;
  }
}
