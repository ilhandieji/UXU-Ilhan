// Hand-off of ASCII art from the editor to the Terminal banner (plain text lines in localStorage;
// too large for a URL, and it survives a refresh of the Terminal page).

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
