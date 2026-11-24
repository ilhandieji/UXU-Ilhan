// Image → ASCII grid. The conversion lives in the AsciiRenderer component's engine (single source of
// truth); the playground re-exports it so the ASCII Editor and the component always match.
// The site may import from the library (never the other way round).
export {
  convertImage,
  defaultImageOptions,
  RAMPS,
  type Charset,
  type ColorMode,
  type Dither,
  type ImageOptions,
} from "@lib/ascii-renderer/react/ascii-renderer.engine";
