// OrbitImages engine — framework-free animation and interaction (identical in React and Vanilla).
// Ported from React Bits "Orbit Images" (Dominik Koch) and extended with mouse-wheel spin, scroll link,
// touch hold, 3D tilt, keyboard navigation, spotlight/blur depth cues and an imperative API.
// Works on a DOM built by the renderer, found through data-orbit-* attributes.
import type { OrbitImagesSettings } from "./orbit-images.config";

export interface OrbitEngine {
  /** Applies new settings; re-measures the path when the DOM changed */
  update(settings: OrbitImagesSettings): void;
  next(): void;
  prev(): void;
  /** Glides the image at `index` to the front */
  goTo(index: number): void;
  destroy(): void;
}

type ItemState = { el: HTMLElement; t: string; o: string; z: string; f: string };

type Drag = {
  id: number;
  x: number;
  y: number;
  active: boolean;
  samples: [number, number][];
  rate: number;
  anchor: number;
  manual: number;
};

type Seek = { from: number; delta: number; t: number; dur: number };

const SAMPLES = 720;
const INTRO_SPREAD = 1.3;
const INTRO_FADE = 0.45;
const DRAG_THRESHOLD = 5;
const WHEEL_LINE = 16;
const WHEEL_IMPULSE = 1.5;
const MAX_GLIDE = 3;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const wrapSigned = (value: number) => value - Math.round(value);
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
const fmt = (n: number) => +n.toFixed(2);

function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const sample = (a1: number, a2: number, t: number) =>
    ((1 - 3 * a2 + 3 * a1) * t + (3 * a2 - 6 * a1)) * t * t + 3 * a1 * t;
  const slope = (a1: number, a2: number, t: number) =>
    3 * (1 - 3 * a2 + 3 * a1) * t * t + 2 * (3 * a2 - 6 * a1) * t + 3 * a1;
  return (x: number) => {
    if (x <= 0 || x >= 1) return x;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const s = slope(x1, x2, t);
      if (Math.abs(s) < 1e-6) break;
      t = clamp(t - (sample(x1, x2, t) - x) / s, 0, 1);
    }
    return sample(y1, y2, t);
  };
}

const EASINGS: Record<OrbitImagesSettings["easing"], (t: number) => number> = {
  linear: (t) => t,
  easeIn: cubicBezier(0.42, 0, 1, 1),
  easeOut: cubicBezier(0, 0, 0.58, 1),
  easeInOut: cubicBezier(0.42, 0, 0.58, 1),
};

// ---------- Path generators (all centered in a baseWidth × baseWidth space) ----------

const ellipse = (c: number, rx: number, ry: number) =>
  `M ${c - rx} ${c} A ${rx} ${ry} 0 1 0 ${c + rx} ${c} A ${rx} ${ry} 0 1 0 ${c - rx} ${c}`;

const rectangle = (c: number, w: number, h: number) =>
  `M ${c - w / 2} ${c - h / 2} L ${c + w / 2} ${c - h / 2} L ${c + w / 2} ${c + h / 2} L ${c - w / 2} ${c + h / 2} Z`;

function triangle(c: number, size: number) {
  const height = (size * Math.sqrt(3)) / 2;
  return `M ${c} ${c - height / 1.5} L ${c + size / 2} ${c + height / 3} L ${c - size / 2} ${c + height / 3} Z`;
}

/** Closed polyline through `count` points of a polar function r(angle) */
function polar(c: number, count: number, r: (angle: number, i: number) => number) {
  const points: string[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const radius = r(angle, i);
    points.push(
      `${i ? "L" : "M"} ${fmt(c + radius * Math.cos(angle))} ${fmt(c + radius * Math.sin(angle))}`,
    );
  }
  return `${points.join(" ")} Z`;
}

function heart(c: number, size: number) {
  const s = size / 30;
  return `M ${c} ${c + 12 * s} C ${c - 20 * s} ${c - 5 * s}, ${c - 12 * s} ${c - 18 * s}, ${c} ${c - 8 * s} C ${c + 12 * s} ${c - 18 * s}, ${c + 20 * s} ${c - 5 * s}, ${c} ${c + 12 * s}`;
}

function infinity(c: number, w: number, h: number) {
  const hw = w / 2;
  const hh = h / 2;
  return `M ${c} ${c} C ${c + hw * 0.5} ${c - hh}, ${c + hw} ${c - hh}, ${c + hw} ${c} C ${c + hw} ${c + hh}, ${c + hw * 0.5} ${c + hh}, ${c} ${c} C ${c - hw * 0.5} ${c + hh}, ${c - hw} ${c + hh}, ${c - hw} ${c} C ${c - hw} ${c - hh}, ${c - hw * 0.5} ${c - hh}, ${c} ${c}`;
}

function wave(c: number, w: number, amplitude: number, waves: number) {
  const points: string[] = [];
  const segs = waves * 20;
  const x = (i: number) => fmt(c - w / 2 + (w * i) / segs);
  const y = (i: number, sign: number) =>
    fmt(c + sign * Math.sin((i / segs) * waves * 2 * Math.PI) * amplitude);
  for (let i = 0; i <= segs; i++) points.push(`${i ? "L" : "M"} ${x(i)} ${y(i, 1)}`);
  for (let i = segs; i >= 0; i--) points.push(`L ${x(i)} ${y(i, -1)}`);
  return `${points.join(" ")} Z`;
}

/** SVG `d` for the current shape (before rotation, which is applied as a transform) */
export function buildOrbitPath(s: OrbitImagesSettings): string {
  const c = s.baseWidth / 2;
  switch (s.shape) {
    case "circle":
      return ellipse(c, s.radius, s.radius);
    case "square":
      return rectangle(c, s.radius * 2, s.radius * 2);
    case "rectangle":
      return rectangle(c, s.radiusX * 2, s.radiusY * 2);
    case "triangle":
      return triangle(c, s.radius * 2);
    case "star":
      return polar(c, s.starPoints * 2, (_, i) => (i % 2 ? s.radius * s.starInnerRatio : s.radius));
    case "heart":
      return heart(c, s.radius * 2);
    case "infinity":
      return infinity(c, s.radiusX * 2, s.radiusY * 2);
    case "wave":
      return wave(c, s.radiusX * 2, s.radiusY, s.waveCount);
    case "polygon":
      return polar(c, s.sides, () => s.radius);
    case "flower":
      return polar(
        c,
        360,
        (angle) => s.radius * (0.78 + 0.22 * Math.cos(s.petals * (angle + Math.PI / 2))),
      );
    case "custom":
      return s.customPath || ellipse(c, s.radius, s.radius);
    default:
      return ellipse(c, s.radiusX, s.radiusY);
  }
}

// ---------- Engine ----------

export function createOrbitEngine(root: HTMLElement, initial: OrbitImagesSettings): OrbitEngine {
  const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  let settings = initial;
  const st = {
    lut: null as Float32Array | null,
    length: 0,
    front: 0,
    yMid: 0,
    yHalf: 1,
    bbox: [0, 0, 1, 1] as [number, number, number, number],
    width: 0,
    height: 0,
    scale: 0,
    size: 0,
    items: [] as ItemState[],
    strokes: [] as SVGPathElement[],
    lap: 0,
    manual: 0,
    glide: 0,
    speed: 1,
    drag: null as Drag | null,
    seek: null as Seek | null,
    hovered: false,
    held: false,
    hoverIndex: -1,
    active: -1,
    tilt: { x: 0, y: 0, tx: 0, ty: 0, css: "" },
    scrollY: window.scrollY,
    suppressUntil: 0,
    introStart: -1,
    introDone: !initial.intro,
    visible: typeof IntersectionObserver === "undefined",
    reduced: !!motionQuery?.matches,
    raf: 0,
    last: 0,
    key: "",
    destroyed: false,
  };
  st.speed = st.reduced || settings.paused ? 0 : 1;

  const stage = () => root.querySelector<HTMLElement>("[data-orbit-stage]");

  const collect = () => {
    st.items = Array.from(root.querySelectorAll<HTMLElement>("[data-orbit-item]")).map((el) => ({
      el,
      t: "",
      o: "",
      z: "",
      f: "",
    }));
    st.strokes = Array.from(root.querySelectorAll<SVGPathElement>("[data-orbit-stroke]"));
  };

  /** Samples the rendered path (with rotation) into a lookup table */
  const build = () => {
    const path = root.querySelector<SVGPathElement>("[data-orbit-path]");
    let length = 0;
    try {
      length = path ? path.getTotalLength() : 0;
    } catch {
      length = 0;
    }
    if (!path || !length || !Number.isFinite(length)) {
      st.lut = null;
      return;
    }
    const lut = new Float32Array(SAMPLES * 2);
    const angle = (settings.rotation * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const origin = settings.baseWidth / 2;
    let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
    let front = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const point = path.getPointAtLength((i / SAMPLES) * length);
      const dx = point.x - origin;
      const dy = point.y - origin;
      const x = origin + dx * cos - dy * sin;
      const y = origin + dx * sin + dy * cos;
      lut[i * 2] = x;
      lut[i * 2 + 1] = y;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
      if (y > lut[front * 2 + 1] + 1e-6) front = i;
    }
    st.lut = lut;
    st.length = length;
    st.front = front / SAMPLES;
    st.yMid = (y0 + y1) / 2;
    st.yHalf = Math.max(1e-3, (y1 - y0) / 2);
    const margin =
      (settings.itemSize / 2) *
        (1 + settings.depth * settings.frontGrow) *
        Math.max(1, settings.hoverScale) +
      2;
    st.bbox = [x0 - margin, y0 - margin, x1 + margin, y1 + margin];
    root.style.setProperty(
      "--ux-orbit-images-aspect",
      String((x1 - x0 + margin * 2) / (y1 - y0 + margin * 2)),
    );
  };

  const applyDash = (reveal: number) => {
    const dash = settings.pathDash > 0 && st.scale ? settings.pathDash / st.scale : 0;
    for (const stroke of st.strokes) {
      if (reveal < 1 && !dash) {
        stroke.style.strokeDasharray = `${st.length} ${st.length}`;
        stroke.style.strokeDashoffset = String(st.length * (1 - reveal));
        stroke.style.opacity = "";
      } else {
        stroke.style.strokeDasharray = dash ? `${dash} ${dash * 1.6}` : "";
        stroke.style.strokeDashoffset = "";
        stroke.style.opacity = reveal < 1 ? String(reveal) : "";
      }
    }
  };

  /** Fits the bounding box into the root and sizes items / SVG viewBoxes */
  const layout = () => {
    st.width = root.clientWidth;
    st.height = root.clientHeight;
    if (!st.lut) return;
    const [bx0, by0, bx1, by1] = st.bbox;
    const scale = Math.min(st.width / (bx1 - bx0), st.height / (by1 - by0));
    st.scale = scale > 0 && Number.isFinite(scale) ? scale : 0;
    st.size = settings.itemSize * st.scale;
    root.style.setProperty("--ux-orbit-images-item-size", `${st.size}px`);
    for (const it of st.items) {
      it.el.style.width = `${st.size}px`;
      it.el.style.height = `${st.size}px`;
    }
    if (!st.scale) return;
    const vw = st.width / st.scale;
    const vh = st.height / st.scale;
    const cx = (bx0 + bx1) / 2;
    const cy = (by0 + by1) / 2;
    root.querySelectorAll("[data-orbit-svg]").forEach((svg) => {
      svg.setAttribute("viewBox", `${cx - vw / 2} ${cy - vh / 2} ${vw} ${vh}`);
    });
    const clip = root.querySelector("[data-orbit-clip]");
    if (clip) {
      clip.setAttribute("x", String(cx - vw));
      clip.setAttribute("y", String(st.yMid));
      clip.setAttribute("width", String(vw * 2));
      clip.setAttribute("height", String(vh * 2));
    }
    for (const stroke of st.strokes)
      stroke.style.strokeWidth = String(settings.pathWidth / st.scale);
    applyDash(1);
  };

  const sample = (u: number): [number, number] => {
    const f = (((u % 1) + 1) % 1) * SAMPLES;
    const i0 = Math.floor(f) % SAMPLES;
    const i1 = (i0 + 1) % SAMPLES;
    const t = f - Math.floor(f);
    const lut = st.lut as Float32Array;
    return [
      lut[i0 * 2] + (lut[i1 * 2] - lut[i0 * 2]) * t,
      lut[i0 * 2 + 1] + (lut[i1 * 2 + 1] - lut[i0 * 2 + 1]) * t,
    ];
  };

  const heading = (u: number) => {
    const a = sample(u - 2 / SAMPLES);
    const b = sample(u + 2 / SAMPLES);
    return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  };

  const progress = () => {
    const whole = Math.floor(st.lap);
    const eased = whole + EASINGS[settings.easing](st.lap - whole);
    return eased * (settings.direction === "reverse" ? -1 : 1) + st.manual + settings.startOffset;
  };

  const offsetOf = (index: number, count: number) =>
    settings.fill
      ? index / Math.max(1, count)
      : (-index * settings.itemSize * settings.gap) / Math.max(1, st.length);

  const write = (
    it: ItemState,
    key: "t" | "o" | "z" | "f",
    prop: "transform" | "opacity" | "zIndex" | "filter",
    value: string,
  ) => {
    if (it[key] === value) return;
    it[key] = value;
    it.el.style[prop] = value;
  };

  /** Index of the image closest to the front of the path */
  const activeIndex = () => {
    const p = progress();
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < st.items.length; i++) {
      const dist = Math.abs(wrapSigned(p + offsetOf(i, st.items.length) - st.front));
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    return best;
  };

  const updateActive = () => {
    const index = activeIndex();
    if (index === st.active) return;
    st.items[st.active]?.el.removeAttribute("data-front");
    st.items[index]?.el.setAttribute("data-front", "");
    st.active = index;
    if (index >= 0) settings.onActiveChange?.(index);
  };

  const render = (now: number) => {
    if (!st.lut || !st.scale) return;
    const p = progress();
    const count = st.items.length;
    const { depth, frontGrow, backShrink, backDim, spotlight, backBlur } = settings;
    const [bx0, by0, bx1, by1] = st.bbox;
    const cx = (bx0 + bx1) / 2;
    const cy = (by0 + by1) / 2;
    const half = st.size / 2;
    const introRunning = st.introStart >= 0;
    const elapsed = introRunning ? (now - st.introStart) / 1000 : 0;
    const spread = introRunning ? easeOutQuint(clamp(elapsed / INTRO_SPREAD, 0, 1)) : 1;
    const appear = introRunning ? clamp(elapsed / INTRO_FADE, 0, 1) : 1;
    for (let i = 0; i < count; i++) {
      const it = st.items[i];
      let u = p + offsetOf(i, count);
      if (introRunning) u = st.front + wrapSigned(u - st.front) * spread;
      const [x, y] = sample(u);
      const d = clamp((y - st.yMid) / st.yHalf, -1, 1);
      const w = (d + 1) / 2;
      let scale = 1 + depth * (frontGrow * w - backShrink * (1 - w));
      let opacity = 1 - depth * backDim * (1 - w);
      if (introRunning) {
        scale *= 0.7 + 0.3 * appear;
        opacity *= appear * appear * (3 - 2 * appear);
      }
      const sx = (x - cx) * st.scale + st.width / 2 - half;
      const sy = (y - cy) * st.scale + st.height / 2 - half;
      const rot = settings.alignToPath ? heading(u) : 0;
      let z = depth > 0 ? (d <= 0 ? 10 + Math.round((d + 1) * 80) : 110 + Math.round(d * 80)) : 1;
      if (i === st.hoverIndex) z += 200;
      write(
        it,
        "t",
        "transform",
        `translate3d(${sx.toFixed(2)}px, ${sy.toFixed(2)}px, 0px)${rot ? ` rotate(${rot.toFixed(2)}deg)` : ""} scale(${scale.toFixed(4)})`,
      );
      write(it, "o", "opacity", opacity > 0.999 ? "" : opacity.toFixed(3));
      write(it, "z", "zIndex", String(z));
      // Spotlight: grayscale by distance from the front; blur by depth
      const far = Math.min(1, Math.abs(wrapSigned(u - st.front)) * 2);
      const gray = spotlight * far;
      const blur = backBlur * depth * (1 - w);
      const filter =
        `${gray > 0.01 ? `grayscale(${gray.toFixed(2)})` : ""}${blur > 0.05 ? ` blur(${blur.toFixed(1)}px)` : ""}`.trim();
      write(it, "f", "filter", filter);
    }
    if (introRunning) applyDash(easeOutQuint(clamp(elapsed / INTRO_SPREAD, 0, 1)));
    updateActive();
  };

  /** Smooths the 3D tilt toward its target; returns true while moving */
  const stepTilt = (dt: number) => {
    const t = st.tilt;
    const k = 1 - Math.exp(-dt / 0.18);
    t.x += (t.tx - t.x) * k;
    t.y += (t.ty - t.y) * k;
    const moving = Math.abs(t.tx - t.x) > 0.01 || Math.abs(t.ty - t.y) > 0.01;
    if (!moving) [t.x, t.y] = [t.tx, t.ty];
    const css = t.x || t.y ? `rotateX(${t.y.toFixed(2)}deg) rotateY(${t.x.toFixed(2)}deg)` : "";
    const el = stage();
    if (el && css !== t.css) el.style.transform = css;
    t.css = css;
    return moving;
  };

  const frame = (now: number) => {
    st.raf = 0;
    if (st.destroyed) return;
    const dt = st.last ? clamp((now - st.last) / 1000, 0, 0.1) : 0;
    st.last = now;
    let busy = false;
    if (st.lut && st.scale && st.introStart === -1 && !st.introDone && st.visible) {
      if (settings.intro && !st.reduced) st.introStart = now;
      else st.introDone = true;
      root.removeAttribute("data-intro");
    }
    if (st.introStart >= 0) {
      if ((now - st.introStart) / 1000 >= INTRO_SPREAD) {
        st.introStart = -2;
        st.introDone = true;
        applyDash(1);
      } else busy = true;
    }
    const hovered = st.hovered || st.held;
    const want = settings.paused || st.reduced ? 0 : hovered ? settings.hoverSpeed : 1;
    if (st.speed !== want) {
      st.speed += (want - st.speed) * (1 - Math.exp(-dt / 0.35));
      if (Math.abs(st.speed - want) < 0.002) st.speed = want;
      busy = true;
    }
    if (st.speed > 0 && settings.duration > 0) {
      st.lap += (dt * st.speed) / settings.duration;
      busy = true;
    }
    if (st.drag?.active) busy = true;
    else if (st.seek) {
      st.seek.t = Math.min(1, st.seek.t + dt / st.seek.dur);
      const e = st.seek.t < 0.5 ? 4 * st.seek.t ** 3 : 1 - Math.pow(-2 * st.seek.t + 2, 3) / 2;
      st.manual = st.seek.from + st.seek.delta * e;
      if (st.seek.t >= 1) st.seek = null;
      busy = true;
    } else if (st.glide) {
      st.manual += st.glide * dt;
      st.glide *= Math.exp(-dt / 0.7);
      if (Math.abs(st.glide) < 0.0004) st.glide = 0;
      busy = true;
    }
    if (stepTilt(dt)) busy = true;
    render(now);
    const whole = Math.floor(st.lap);
    if (whole) st.lap -= whole;
    if (!st.drag && !st.seek) st.manual -= Math.floor(st.manual);
    if (busy && st.visible && !st.destroyed) st.raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (st.raf || st.destroyed || !st.visible) return;
    st.last = 0;
    st.raf = requestAnimationFrame(frame);
  };

  const local = (e: PointerEvent): [number, number] => {
    const r = root.getBoundingClientRect();
    const k = root.offsetWidth ? r.width / root.offsetWidth || 1 : 1;
    return [(e.clientX - r.left) / k, (e.clientY - r.top) / k];
  };

  /** Screen px per lap at the front of the path (sign = travel direction) */
  const dragRate = () => {
    if (!st.lut || !st.scale) return 0;
    const a = sample(st.front - 3 / SAMPLES);
    const b = sample(st.front + 3 / SAMPLES);
    const along = ((b[0] - a[0]) / (6 / SAMPLES)) * st.scale;
    const floor = st.length * st.scale * 0.35;
    return Math.abs(along) < floor ? Math.sign(along || 1) * floor : along;
  };

  const itemIndex = (target: EventTarget | null) => {
    const el = target instanceof Element ? target.closest("[data-orbit-item]") : null;
    return el && root.contains(el) ? Number(el.getAttribute("data-orbit-item")) : -1;
  };

  const goTo = (index: number) => {
    if (!st.lut || index < 0 || index >= st.items.length) return;
    const u = progress() + offsetOf(index, st.items.length);
    const delta = wrapSigned(st.front - u);
    st.glide = 0;
    st.seek = { from: st.manual, delta, t: 0, dur: 0.45 + Math.abs(delta) * 1.4 };
    wake();
  };

  const step = (by: number) => {
    const count = st.items.length;
    if (!count) return;
    const current = st.seek ? st.active : activeIndex();
    goTo((((current + by) % count) + count) % count);
  };

  // ---------- Pointer: hover, touch hold, drag/fling, tilt ----------

  const onEnter = (e: PointerEvent) => {
    if (e.pointerType === "touch" && !settings.touchHold) return;
    st.hovered = true;
    wake();
  };

  const onLeave = () => {
    st.hovered = false;
    st.hoverIndex = -1;
    st.tilt.tx = 0;
    st.tilt.ty = 0;
    wake();
  };

  const onOver = (e: PointerEvent) => {
    const index = itemIndex(e.target);
    if (index === st.hoverIndex) return;
    st.hoverIndex = index;
    if (st.lut) render(performance.now());
  };

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "touch" && settings.touchHold) {
      st.held = true;
      wake();
    }
    if (!settings.draggable || (e.pointerType === "mouse" && e.button !== 0)) return;
    if (e.target instanceof Element && e.target.closest("[data-orbit-center]")) return;
    const [x, y] = local(e);
    st.drag = {
      id: e.pointerId,
      x,
      y,
      active: false,
      samples: [],
      rate: dragRate(),
      anchor: 0,
      manual: 0,
    };
  };

  const trackTilt = (e: PointerEvent) => {
    if (!settings.tilt || st.reduced || st.drag?.active) return;
    const [x, y] = local(e);
    const nx = clamp((x / Math.max(1, root.offsetWidth)) * 2 - 1, -1, 1);
    const ny = clamp((y / Math.max(1, root.offsetHeight)) * 2 - 1, -1, 1);
    st.tilt.tx = nx * settings.tilt;
    st.tilt.ty = -ny * settings.tilt;
    wake();
  };

  const onMove = (e: PointerEvent) => {
    trackTilt(e);
    const d = st.drag;
    if (!d || e.pointerId !== d.id) return;
    const [x, y] = local(e);
    const along = x - d.x;
    if (!d.active) {
      if (Math.abs(along) < DRAG_THRESHOLD) return;
      // A mostly vertical gesture is a page scroll, not a spin
      if (Math.abs(y - d.y) > Math.abs(along)) {
        st.drag = null;
        return;
      }
      d.active = true;
      d.anchor = along;
      d.manual = st.manual;
      st.seek = null;
      st.glide = 0;
      try {
        root.setPointerCapture(e.pointerId);
      } catch {
        // Capture is optional
      }
      root.setAttribute("data-dragging", "");
    }
    if (d.rate) st.manual = d.manual + (along - d.anchor) / d.rate;
    const now = performance.now();
    d.samples.push([now, along]);
    while (d.samples.length > 2 && now - d.samples[0][0] > 100) d.samples.shift();
    wake();
  };

  const endDrag = (e: PointerEvent, cancelled: boolean) => {
    if (e.pointerType === "touch") {
      st.held = false;
      wake();
    }
    const d = st.drag;
    if (!d || e.pointerId !== d.id) return;
    st.drag = null;
    if (!d.active) return;
    root.removeAttribute("data-dragging");
    try {
      root.releasePointerCapture(e.pointerId);
    } catch {
      // Already released
    }
    const now = performance.now();
    st.suppressUntil = now + 400;
    const s = d.samples;
    if (!cancelled && s.length > 1 && d.rate) {
      const [t0, a0] = s[0];
      const [t1, a1] = s[s.length - 1];
      if (t1 > t0 && now - t1 < 80)
        st.glide = clamp((((a1 - a0) / (t1 - t0)) * 1000) / d.rate, -MAX_GLIDE, MAX_GLIDE);
    }
    wake();
  };

  const onUp = (e: PointerEvent) => endDrag(e, false);
  const onCancel = (e: PointerEvent) => endDrag(e, true);

  // ---------- Click, keyboard, focus ----------

  const activate = (index: number) => {
    if (index < 0) return;
    if (settings.clickToFront) goTo(index);
    settings.onItemClick?.(index, settings.items[index]?.src ?? "");
  };

  const onClick = (e: MouseEvent) => {
    if (performance.now() < st.suppressUntil) {
      e.preventDefault();
      e.stopPropagation();
      st.suppressUntil = 0;
      return;
    }
    activate(itemIndex(e.target));
  };

  const onKey = (e: KeyboardEvent) => {
    if (settings.keyboard && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      step(e.key === "ArrowRight" ? 1 : -1);
      return;
    }
    if (e.key !== "Enter" && e.key !== " ") return;
    const index = itemIndex(e.target);
    if (index < 0) return;
    e.preventDefault();
    activate(index);
  };

  const onFocus = (e: FocusEvent) => {
    const index = itemIndex(e.target);
    if (
      index >= 0 &&
      settings.clickToFront &&
      e.target instanceof Element &&
      e.target.matches(":focus-visible")
    )
      goTo(index);
  };

  // ---------- Mouse wheel and page scroll ----------

  const onWheel = (e: WheelEvent) => {
    if (settings.wheel === "off" || !settings.wheelSpeed || !st.lut) return;
    if (settings.wheel === "focus" && !root.matches(":focus-within")) return;
    const unit = e.deltaMode === 1 ? WHEEL_LINE : e.deltaMode === 2 ? st.height || 400 : 1;
    const delta = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * unit;
    const rate = dragRate();
    if (!delta || !rate) return;
    e.preventDefault();
    st.seek = null;
    st.glide = clamp(
      st.glide - (delta / rate) * settings.wheelSpeed * WHEEL_IMPULSE,
      -MAX_GLIDE,
      MAX_GLIDE,
    );
    wake();
  };

  const onScroll = () => {
    const dy = window.scrollY - st.scrollY;
    st.scrollY = window.scrollY;
    if (!settings.scrollLink || !dy) return;
    st.manual += (dy / Math.max(1, window.innerHeight)) * settings.scrollSpeed;
    if (st.lut) render(performance.now());
    wake();
  };

  const onMotion = () => {
    st.reduced = !!motionQuery?.matches;
    wake();
  };

  /** Root focusability: needed for arrow keys and the wheel "focus" mode */
  const applyRootAttributes = () => {
    const focusable = settings.keyboard || settings.wheel === "focus";
    if (focusable) root.tabIndex = 0;
    else root.removeAttribute("tabindex");
  };

  root.addEventListener("pointerenter", onEnter);
  root.addEventListener("pointerleave", onLeave);
  root.addEventListener("pointerover", onOver);
  root.addEventListener("pointerdown", onDown);
  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerup", onUp);
  root.addEventListener("pointercancel", onCancel);
  root.addEventListener("lostpointercapture", onCancel);
  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKey);
  root.addEventListener("focusin", onFocus);
  root.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("scroll", onScroll, { passive: true });
  motionQuery?.addEventListener?.("change", onMotion);

  const resizeObserver =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
          layout();
          render(performance.now());
          wake();
        });
  resizeObserver?.observe(root);

  const intersection =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(
          (entries) => {
            st.visible = entries[entries.length - 1].isIntersecting;
            if (st.visible) wake();
          },
          { threshold: 0.05 },
        );
  intersection?.observe(root);

  const onVisibility = () => {
    if (!document.hidden) wake();
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("resize", wake);

  /** Everything that requires re-measuring the path or re-collecting items */
  const layoutKey = (s: OrbitImagesSettings) =>
    [
      buildOrbitPath(s),
      s.rotation,
      s.baseWidth,
      s.itemSize,
      s.depth,
      s.frontGrow,
      s.hoverScale,
      s.items.length,
      s.showPath,
      s.pathWidth,
      s.pathDash,
      s.height,
      s.width,
      s.variant,
    ].join("|");

  const refresh = () => {
    collect();
    st.active = -1;
    build();
    layout();
    render(performance.now());
    wake();
  };

  applyRootAttributes();

  return {
    update(next) {
      settings = next;
      applyRootAttributes();
      const key = layoutKey(next);
      if (key !== st.key) {
        st.key = key;
        refresh();
        return;
      }
      if (st.lut) render(performance.now());
      wake();
    },
    next: () => step(1),
    prev: () => step(-1),
    goTo,
    destroy() {
      st.destroyed = true;
      if (st.raf) cancelAnimationFrame(st.raf);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerover", onOver);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onCancel);
      root.removeEventListener("lostpointercapture", onCancel);
      root.removeEventListener("click", onClick);
      root.removeEventListener("keydown", onKey);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      motionQuery?.removeEventListener?.("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", wake);
      resizeObserver?.disconnect();
      intersection?.disconnect();
    },
  };
}
