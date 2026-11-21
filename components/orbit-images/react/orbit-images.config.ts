// OrbitImages settings and types — names must match the Vanilla version.
// Look values live in `themes`; colors/radius/shadow are CSS variables `--ux-orbit-images-*`
// set on the root and consumed by the static Tailwind classes below.

export type OrbitShape =
  | "ellipse"
  | "circle"
  | "square"
  | "rectangle"
  | "triangle"
  | "star"
  | "heart"
  | "infinity"
  | "wave"
  | "polygon"
  | "flower"
  | "custom";
export type OrbitImagesThemeName =
  | "orbit"
  | "carousel"
  | "halo"
  | "ribbon"
  | "star"
  | "heart"
  | "wave"
  | "hexagon"
  | "flower"
  | "gallery"
  | "tilted";
/** Item style: rounded (original) · circle · polaroid frame · glass frame */
export type OrbitImagesVariant = "rounded" | "circle" | "polaroid" | "glass";
export type OrbitImagesSize = "sm" | "md" | "lg";
export type OrbitEasing = "linear" | "easeIn" | "easeOut" | "easeInOut";
export type OrbitDirection = "normal" | "reverse";
/** off · hover: wheel spins while the pointer is over the orbit · focus: only while it has focus */
export type OrbitWheel = "off" | "hover" | "focus";
export type OrbitCaptions = "off" | "hover" | "front" | "always";
export type OrbitObjectFit = "cover" | "contain";

export type OrbitImage = string | { src: string; alt?: string; caption?: string };
export type OrbitItem = { src: string; alt: string; caption: string };

/** Values a theme preset controls */
export interface OrbitImagesLook {
  shape: OrbitShape;
  /** Horizontal / vertical radius for ellipse, rectangle, infinity, wave */
  radiusX: number;
  radiusY: number;
  /** Radius for circle, square, triangle, star, heart, polygon, flower */
  radius: number;
  /** Path rotation in degrees (images stay upright) */
  rotation: number;
  /** Seconds per lap */
  duration: number;
  /** Image size in path units */
  itemSize: number;
  /** 0–1: back items smaller/dimmer, front items larger */
  depth: number;
  /** Corner radius in path units, or any CSS length */
  itemRadius: number | string;
  shadow: number;
  hoverScale: number;
  /** Speed while hovered, as a fraction of the normal speed */
  hoverSpeed: number;
  pathDash: number;
  direction: OrbitDirection;
  easing: OrbitEasing;
  /** true = spread evenly, false = follow each other in a train */
  fill: boolean;
  showPath: boolean;
  alignToPath: boolean;
  /** 0–1: items far from the front turn grayscale */
  spotlight: number;
  /** Blur (px) for items at the back */
  backBlur: number;
  /** Degrees the orbit tilts toward the pointer (3D parallax) */
  tilt: number;
}

export type OrbitImagesTheme = OrbitImagesThemeName | Partial<OrbitImagesLook>;

export interface OrbitImagesOptions extends Partial<OrbitImagesLook> {
  theme?: OrbitImagesTheme;
  variant?: OrbitImagesVariant;
  size?: OrbitImagesSize;
  images?: OrbitImage[];
  altPrefix?: string;
  /** SVG path in a baseWidth × baseWidth space, used when shape is custom */
  customPath?: string;
  baseWidth?: number;
  starPoints?: number;
  starInnerRatio?: number;
  sides?: number;
  petals?: number;
  waveCount?: number;
  /** Spacing of the train when fill is false, in item sizes */
  gap?: number;
  /** Shifts every image along the path (0–1 of a lap) */
  startOffset?: number;
  /** CSS width, e.g. '100%' or 600 */
  width?: number | string;
  /** CSS height; 'auto' matches the shape of the orbit */
  height?: number | string;
  pathColor?: string;
  pathWidth?: number;
  paused?: boolean;
  intro?: boolean;
  draggable?: boolean;
  clickToFront?: boolean;
  /** Arrow keys move to the previous/next image */
  keyboard?: boolean;
  wheel?: OrbitWheel;
  wheelSpeed?: number;
  /** Page scroll spins the orbit */
  scrollLink?: boolean;
  /** Laps per viewport height of page scroll */
  scrollSpeed?: number;
  /** Holding a finger on the orbit slows it like hover */
  touchHold?: boolean;
  frontGrow?: number;
  backShrink?: number;
  backDim?: number;
  captions?: OrbitCaptions;
  objectFit?: OrbitObjectFit;
  loading?: "lazy" | "eager";
  onItemClick?: (index: number, src: string) => void;
  onActiveChange?: (index: number) => void;
}

export const defaults = {
  theme: "orbit",
  variant: "rounded",
  size: "md",
  images: [
    { src: "https://picsum.photos/300/300?grayscale&random=1", caption: "Morning" },
    { src: "https://picsum.photos/300/300?grayscale&random=2", caption: "Coast" },
    { src: "https://picsum.photos/300/300?grayscale&random=3", caption: "City" },
    { src: "https://picsum.photos/300/300?grayscale&random=4", caption: "Forest" },
    { src: "https://picsum.photos/300/300?grayscale&random=5", caption: "Desert" },
    { src: "https://picsum.photos/300/300?grayscale&random=6", caption: "Night" },
  ],
  altPrefix: "Orbiting image",
  customPath: "",
  baseWidth: 1400,
  starPoints: 5,
  starInnerRatio: 0.5,
  sides: 6,
  petals: 5,
  waveCount: 3,
  gap: 1.3,
  startOffset: 0,
  width: "100%",
  height: "auto",
  pathColor: "rgba(128,128,128,0.35)",
  pathWidth: 2,
  paused: false,
  intro: true,
  draggable: true,
  clickToFront: true,
  keyboard: true,
  wheel: "hover",
  wheelSpeed: 1,
  scrollLink: false,
  scrollSpeed: 0.5,
  touchHold: true,
  frontGrow: 0.3,
  backShrink: 0.45,
  backDim: 0.55,
  captions: "off",
  objectFit: "cover",
  loading: "lazy",
} satisfies OrbitImagesOptions;

const orbit: OrbitImagesLook = {
  shape: "ellipse",
  radiusX: 340,
  radiusY: 80,
  radius: 160,
  rotation: -8,
  duration: 30,
  itemSize: 90,
  depth: 0.6,
  itemRadius: 14,
  shadow: 0.3,
  hoverScale: 1.08,
  hoverSpeed: 0.3,
  pathDash: 0,
  direction: "normal",
  easing: "linear",
  fill: true,
  showPath: true,
  alignToPath: false,
  spotlight: 0,
  backBlur: 0,
  tilt: 0,
};

export const themes: Record<OrbitImagesThemeName, OrbitImagesLook> = {
  orbit: { ...orbit },
  carousel: {
    ...orbit,
    radiusX: 420,
    radiusY: 60,
    rotation: 0,
    depth: 0.85,
    itemSize: 120,
    duration: 24,
    showPath: false,
  },
  halo: {
    ...orbit,
    shape: "circle",
    radius: 170,
    rotation: 0,
    depth: 0,
    itemSize: 64,
    itemRadius: 32,
    pathDash: 5,
  },
  ribbon: {
    ...orbit,
    shape: "infinity",
    radiusX: 360,
    radiusY: 120,
    rotation: 0,
    depth: 0.3,
    itemSize: 70,
    duration: 16,
    fill: false,
    alignToPath: true,
  },
  star: { ...orbit, shape: "star", radius: 180, rotation: 0, depth: 0, itemSize: 56 },
  heart: { ...orbit, shape: "heart", radius: 200, rotation: 0, depth: 0, itemSize: 56 },
  wave: {
    ...orbit,
    shape: "wave",
    radiusX: 400,
    radiusY: 60,
    rotation: 0,
    depth: 0.2,
    itemSize: 64,
    duration: 14,
    fill: false,
    alignToPath: true,
  },
  hexagon: {
    ...orbit,
    shape: "polygon",
    radius: 180,
    rotation: 0,
    depth: 0,
    itemSize: 60,
    pathDash: 6,
  },
  flower: {
    ...orbit,
    shape: "flower",
    radius: 190,
    rotation: 0,
    depth: 0,
    itemSize: 54,
    itemRadius: 27,
    duration: 36,
  },
  gallery: {
    ...orbit,
    radiusX: 440,
    radiusY: 70,
    rotation: 0,
    depth: 0.9,
    itemSize: 130,
    duration: 28,
    hoverSpeed: 0,
    showPath: false,
    spotlight: 1,
    backBlur: 2,
  },
  tilted: {
    ...orbit,
    radiusX: 360,
    radiusY: 110,
    rotation: -18,
    depth: 0.7,
    itemSize: 84,
    tilt: 14,
  },
};

/** Multiplier for itemSize */
export const sizes: Record<OrbitImagesSize, { scale: number }> = {
  sm: { scale: 0.75 },
  md: { scale: 1 },
  lg: { scale: 1.3 },
};

/** Item frame tokens per variant (keys without the --ux-orbit-images- prefix) */
export const variants: Record<OrbitImagesVariant, Record<string, string>> = {
  rounded: {
    frame: "transparent",
    padding: "0%",
    border: "0px",
    ring: "transparent",
    "caption-color": "#ffffff",
    "caption-bg": "rgba(0,0,0,0.55)",
  },
  circle: {
    radius: "50%",
    frame: "transparent",
    padding: "0%",
    border: "0px",
    ring: "transparent",
    "caption-color": "#ffffff",
    "caption-bg": "rgba(0,0,0,0.55)",
  },
  polaroid: {
    radius: "3%",
    frame: "#f6f5f0",
    padding: "6% 6% 22%",
    border: "0px",
    ring: "transparent",
    "caption-color": "#3a3a3a",
    "caption-bg": "transparent",
  },
  glass: {
    frame: "rgba(255,255,255,0.08)",
    padding: "5%",
    border: "1px",
    ring: "rgba(255,255,255,0.28)",
    "caption-color": "#ffffff",
    "caption-bg": "rgba(0,0,0,0.35)",
  },
};

/** Tailwind v4 classes — complete, static strings (so the scanner can see them) */
export const classes = {
  root: "group/orbit relative isolate mx-auto w-(--ux-orbit-images-width) select-none [perspective:1200px] [-webkit-user-select:none] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current",
  autoHeight: "aspect-(--ux-orbit-images-aspect)",
  fixedHeight: "h-(--ux-orbit-images-height)",
  draggable:
    "cursor-grab [touch-action:pan-y_pinch-zoom] data-dragging:cursor-grabbing [&[data-dragging]_*]:cursor-grabbing",
  stage: "absolute inset-0 will-change-transform",
  svg: "pointer-events-none absolute inset-0 h-full w-full overflow-visible",
  svgBack: "z-0",
  svgFront: "z-105",
  hidden: "invisible",
  stroke: "fill-none stroke-(color:--ux-orbit-images-path-color) [stroke-linecap:round]",
  item: "group/item absolute top-0 left-0 will-change-[transform,opacity] focus-visible:outline-none group-data-intro/orbit:opacity-0",
  clickable: "cursor-pointer",
  frame:
    "relative h-full w-full overflow-hidden rounded-(--ux-orbit-images-radius) border-(length:--ux-orbit-images-border) border-(color:--ux-orbit-images-ring) bg-(color:--ux-orbit-images-frame) p-(--ux-orbit-images-padding) [box-shadow:0_calc(var(--ux-orbit-images-shadow)*16px)_calc(var(--ux-orbit-images-shadow)*36px)_rgba(0,0,0,calc(var(--ux-orbit-images-shadow)*0.45))] transition-transform duration-450 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover/item:scale-(--ux-orbit-images-hover-scale) group-focus-visible/item:scale-(--ux-orbit-images-hover-scale) group-focus-visible/item:outline-2 group-focus-visible/item:outline-offset-3 group-focus-visible/item:outline-current motion-reduce:transition-none",
  frameGlass: "backdrop-blur-md",
  image:
    "pointer-events-none block h-full w-full rounded-[calc(var(--ux-orbit-images-radius)*0.6)] [-webkit-user-drag:none]",
  caption:
    "pointer-events-none absolute inset-x-0 bottom-0 truncate bg-(color:--ux-orbit-images-caption-bg) px-[6%] py-[4%] text-center text-[length:calc(var(--ux-orbit-images-item-size)*0.12)] leading-tight font-medium text-(color:--ux-orbit-images-caption-color) transition-opacity duration-300",
  center:
    "pointer-events-none absolute inset-0 z-100 flex items-center justify-center [&>*]:pointer-events-auto",
};

export const fitClasses: Record<OrbitObjectFit, string> = {
  cover: "object-cover",
  contain: "object-contain",
};

export const captionClasses: Record<OrbitCaptions, string> = {
  off: "hidden",
  hover: "opacity-0 group-hover/item:opacity-100 group-focus-visible/item:opacity-100",
  front: "opacity-0 group-data-front/item:opacity-100",
  always: "opacity-100",
};

/** Everything the engine and renderers need, validated and merged */
export type OrbitImagesSettings = OrbitImagesLook &
  Required<
    Omit<
      OrbitImagesOptions,
      keyof OrbitImagesLook | "theme" | "size" | "images" | "onItemClick" | "onActiveChange"
    >
  > & {
    items: OrbitItem[];
    onItemClick?: (index: number, src: string) => void;
    onActiveChange?: (index: number) => void;
  };

const warned = new Set<string>();
function warn(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[OrbitImages] ${message}`);
}

function num(value: unknown, fallback: number, min: number, max: number, name: string): number {
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    warn(`invalid ${name}: ${String(value)}, using ${fallback}`);
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}

function oneOf<T extends string>(value: unknown, list: readonly T[], fallback: T, name: string): T {
  if (value === undefined) return fallback;
  if (list.includes(value as T)) return value as T;
  warn(`invalid ${name}: ${String(value)}, using ${fallback}`);
  return fallback;
}

const bool = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback);
const str = (value: unknown, fallback: string) => (typeof value === "string" ? value : fallback);
const length = (value: unknown, fallback: number | string) =>
  typeof value === "number" && Number.isFinite(value)
    ? value
    : typeof value === "string" && value
      ? value
      : fallback;

const SHAPES = [
  "ellipse",
  "circle",
  "square",
  "rectangle",
  "triangle",
  "star",
  "heart",
  "infinity",
  "wave",
  "polygon",
  "flower",
  "custom",
] as const;

function toItems(images: unknown, altPrefix: string): OrbitItem[] {
  if (!Array.isArray(images)) return [];
  return images.flatMap((image, index): OrbitItem[] => {
    const fallbackAlt = `${altPrefix} ${index + 1}`;
    if (typeof image === "string")
      return image ? [{ src: image, alt: fallbackAlt, caption: "" }] : [];
    if (image && typeof image === "object" && typeof image.src === "string")
      return [{ src: image.src, alt: image.alt ?? fallbackAlt, caption: image.caption ?? "" }];
    warn(`invalid image at index ${index}`);
    return [];
  });
}

/** Merge order: theme preset ← theme object ← top-level look options; then size scale */
export function resolveSettings(options: OrbitImagesOptions = {}): OrbitImagesSettings {
  const o = { ...defaults, ...options };
  const named = typeof o.theme === "string";
  if (named && !((o.theme as string) in themes))
    warn(`unknown theme: ${String(o.theme)}, using ${defaults.theme}`);
  const base =
    (named ? themes[o.theme as OrbitImagesThemeName] : undefined) ?? themes[defaults.theme];
  const pick = <K extends keyof OrbitImagesLook>(key: K): OrbitImagesLook[K] | undefined =>
    options[key] ?? (named ? undefined : (o.theme as Partial<OrbitImagesLook>)[key]);
  const size = oneOf(o.size, ["sm", "md", "lg"] as const, defaults.size, "size");
  const altPrefix = str(o.altPrefix, defaults.altPrefix);

  return {
    shape: oneOf(pick("shape"), SHAPES, base.shape, "shape"),
    radiusX: num(pick("radiusX"), base.radiusX, 1, 5000, "radiusX"),
    radiusY: num(pick("radiusY"), base.radiusY, 1, 5000, "radiusY"),
    radius: num(pick("radius"), base.radius, 1, 5000, "radius"),
    rotation: num(pick("rotation"), base.rotation, -360, 360, "rotation"),
    duration: num(pick("duration"), base.duration, 0, 600, "duration"),
    itemSize: num(pick("itemSize"), base.itemSize, 4, 2000, "itemSize") * sizes[size].scale,
    depth: num(pick("depth"), base.depth, 0, 1, "depth"),
    itemRadius: length(pick("itemRadius"), base.itemRadius),
    shadow: num(pick("shadow"), base.shadow, 0, 1, "shadow"),
    hoverScale: num(pick("hoverScale"), base.hoverScale, 0.5, 3, "hoverScale"),
    hoverSpeed: num(pick("hoverSpeed"), base.hoverSpeed, 0, 1, "hoverSpeed"),
    pathDash: num(pick("pathDash"), base.pathDash, 0, 200, "pathDash"),
    direction: oneOf(
      pick("direction"),
      ["normal", "reverse"] as const,
      base.direction,
      "direction",
    ),
    easing: oneOf(
      pick("easing"),
      ["linear", "easeIn", "easeOut", "easeInOut"] as const,
      base.easing,
      "easing",
    ),
    fill: bool(pick("fill"), base.fill),
    showPath: bool(pick("showPath"), base.showPath),
    alignToPath: bool(pick("alignToPath"), base.alignToPath),
    spotlight: num(pick("spotlight"), base.spotlight, 0, 1, "spotlight"),
    backBlur: num(pick("backBlur"), base.backBlur, 0, 20, "backBlur"),
    tilt: num(pick("tilt"), base.tilt, 0, 45, "tilt"),
    variant: oneOf(
      o.variant,
      ["rounded", "circle", "polaroid", "glass"] as const,
      defaults.variant,
      "variant",
    ),
    items: toItems(o.images, altPrefix),
    altPrefix,
    customPath: str(o.customPath, ""),
    baseWidth: num(o.baseWidth, defaults.baseWidth, 10, 20000, "baseWidth"),
    starPoints: Math.round(num(o.starPoints, defaults.starPoints, 2, 32, "starPoints")),
    starInnerRatio: num(o.starInnerRatio, defaults.starInnerRatio, 0.05, 1, "starInnerRatio"),
    sides: Math.round(num(o.sides, defaults.sides, 3, 32, "sides")),
    petals: Math.round(num(o.petals, defaults.petals, 2, 24, "petals")),
    waveCount: Math.round(num(o.waveCount, defaults.waveCount, 1, 12, "waveCount")),
    gap: num(o.gap, defaults.gap, 0.5, 10, "gap"),
    startOffset: num(o.startOffset, defaults.startOffset, -1, 1, "startOffset"),
    width: length(o.width, defaults.width),
    height: length(o.height, defaults.height),
    pathColor: str(o.pathColor, defaults.pathColor) || defaults.pathColor,
    pathWidth: num(o.pathWidth, defaults.pathWidth, 0, 50, "pathWidth"),
    paused: bool(o.paused, defaults.paused),
    intro: bool(o.intro, defaults.intro),
    draggable: bool(o.draggable, defaults.draggable),
    clickToFront: bool(o.clickToFront, defaults.clickToFront),
    keyboard: bool(o.keyboard, defaults.keyboard),
    wheel: oneOf(o.wheel, ["off", "hover", "focus"] as const, defaults.wheel, "wheel"),
    wheelSpeed: num(o.wheelSpeed, defaults.wheelSpeed, 0, 10, "wheelSpeed"),
    scrollLink: bool(o.scrollLink, defaults.scrollLink),
    scrollSpeed: num(o.scrollSpeed, defaults.scrollSpeed, -10, 10, "scrollSpeed"),
    touchHold: bool(o.touchHold, defaults.touchHold),
    frontGrow: num(o.frontGrow, defaults.frontGrow, 0, 2, "frontGrow"),
    backShrink: num(o.backShrink, defaults.backShrink, 0, 0.95, "backShrink"),
    backDim: num(o.backDim, defaults.backDim, 0, 1, "backDim"),
    captions: oneOf(
      o.captions,
      ["off", "hover", "front", "always"] as const,
      defaults.captions,
      "captions",
    ),
    objectFit: oneOf(o.objectFit, ["cover", "contain"] as const, defaults.objectFit, "objectFit"),
    loading: oneOf(o.loading, ["lazy", "eager"] as const, defaults.loading, "loading"),
    onItemClick: options.onItemClick,
    onActiveChange: options.onActiveChange,
  };
}

const WIDE_SHAPES: OrbitShape[] = ["ellipse", "rectangle", "infinity", "wave"];
const toCss = (value: number | string) => (typeof value === "number" ? `${value}px` : value);

/** Aspect ratio before the path is measured (the engine replaces it with the exact one) */
export function estimateAspect(s: OrbitImagesSettings): number {
  const wide = WIDE_SHAPES.includes(s.shape);
  const w = (wide ? s.radiusX : s.radius) * 2 + s.itemSize * 1.6;
  const h = (wide ? s.radiusY : s.radius) * 2 + s.itemSize * 1.6;
  return w > 0 && h > 0 ? w / h : 1;
}

/** CSS variables for the root: variant frame tokens + look values */
export function resolveTokens(s: OrbitImagesSettings): Record<string, string> {
  const radius =
    typeof s.itemRadius === "number"
      ? `${(s.itemRadius / Math.max(1, s.itemSize)) * 100}%`
      : s.itemRadius;
  const tokens: Record<string, string> = {
    radius,
    shadow: String(s.shadow),
    "hover-scale": String(s.hoverScale),
    "path-color": s.pathColor,
    width: toCss(s.width),
    height: toCss(s.height),
    aspect: String(estimateAspect(s)),
    ...variants[s.variant],
  };
  return Object.fromEntries(
    Object.entries(tokens).map(([key, value]) => [`--ux-orbit-images-${key}`, value]),
  );
}
