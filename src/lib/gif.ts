// Animated GIF encoding (preview recordings and ASCII animations), via gifenc.
import { applyPalette, GIFEncoder, quantize } from "gifenc";

export interface GifFrame {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Frames must share one size; `delay` is per frame in ms. Loops forever. */
export function encodeGif(frames: GifFrame[], delay: number): Blob {
  const gif = GIFEncoder();
  for (const frame of frames) {
    const palette = quantize(frame.data, 256);
    const index = applyPalette(frame.data, palette);
    gif.writeFrame(index, frame.width, frame.height, { palette, delay, repeat: 0 });
  }
  gif.finish();
  const bytes = gif.bytes();
  return new Blob([bytes.slice().buffer], { type: "image/gif" });
}
