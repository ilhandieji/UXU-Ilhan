// GlowCursor engine — framework-free WebGL2 fluid light simulation (identical in React and Vanilla).
// Ported from React Bits "Glow Cursor" (David Haz) and extended with idle path, color modes,
// configurable burst/flow, CSS-variable colors, runtime mode/reduced-motion and an imperative API.
import {
  resolveTokens,
  type GlowCursorQuality,
  type GlowCursorSettings,
} from "./glow-cursor.config";

export interface GlowCursorEngine {
  update(settings: GlowCursorSettings): void;
  /** Burst at (x, y) in px relative to the canvas; defaults to the center */
  burst(x?: number, y?: number): void;
  clear(): void;
  destroy(): void;
}

type Target = {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texel: [number, number];
};

type Pair = {
  readonly read: Target;
  readonly write: Target;
  swap: () => void;
  targets: () => Target[];
};

type Targets = {
  velocity: Pair;
  dye: Pair;
  forward: Target;
  back: Target;
  pressure: Pair;
  divergence: Target;
  bloom: Target[];
};

type Pass = {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
};

type Uniforms = Record<string, WebGLUniformLocation | null>;

const VERTEX = `#version 300 es
in vec2 aPosition;
uniform vec2 uTexel;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(uTexel.x, 0.0);
  vR = vUv + vec2(uTexel.x, 0.0);
  vT = vUv + vec2(0.0, uTexel.y);
  vB = vUv - vec2(0.0, uTexel.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const HEADER = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 outColor;
`;

const SPLAT = `${HEADER}
uniform sampler2D uTarget;
uniform float uAspect;
uniform vec2 uA;
uniform vec2 uB;
uniform float uRadius;
uniform float uWide;
uniform vec3 uValue;
uniform float uMode;
uniform float uStrength;
float erf(float x) {
  float x2 = x * x;
  float a = 0.147;
  return sign(x) * sqrt(1.0 - exp(-x2 * (1.2732395 + a * x2) / (1.0 + a * x2)));
}
float sweep(float along, float length, float across, float radius) {
  return exp(-across * across / (radius * radius)) * 0.5 * (erf(along / radius) - erf((along - length) / radius));
}
void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  vec2 a = vec2(uA.x * uAspect, uA.y);
  vec2 ab = vec2(uB.x * uAspect, uB.y) - a;
  float len = length(ab);
  vec2 dir = len > 1e-6 ? ab / len : vec2(1.0, 0.0);
  vec2 ap = p - a;
  vec3 base = texture(uTarget, vUv).xyz;
  if (uMode > 1.5) {
    float along = dot(ap, dir);
    float across = dot(ap, vec2(-dir.y, dir.x));
    if (uMode > 2.5) {
      outColor = vec4(mix(base, uValue, sweep(along, len, across, uRadius) * uStrength), 1.0);
      return;
    }
    vec3 add = vec3(uValue.xy * sweep(along, len, across, uRadius), uValue.z * sweep(along, len, across, uWide));
    outColor = vec4(base + add, 1.0);
    return;
  }
  float h = clamp(dot(ap, ab) / max(dot(ab, ab), 1e-9), 0.0, 1.0);
  vec2 d = ap - ab * h;
  float r2 = dot(d, d);
  float falloff = exp(-r2 / (uRadius * uRadius));
  float wide = exp(-r2 / (uWide * uWide));
  vec3 result = uMode > 0.5 ? mix(base, uValue, falloff * uStrength) : base + vec3(uValue.xy * falloff, uValue.z * wide);
  outColor = vec4(result, 1.0);
}`;

const ADVECT = `${HEADER}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uVelocityTexel;
uniform float uDt;
uniform vec4 uDecay;
void main() {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uVelocityTexel;
  outColor = texture(uSource, coord) * uDecay;
}`;

const MACCORMACK = `${HEADER}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform sampler2D uForward;
uniform sampler2D uBack;
uniform vec2 uVelocityTexel;
uniform vec2 uSourceTexel;
uniform float uDt;
uniform vec4 uDecay;
void main() {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uVelocityTexel;
  vec4 forward = texture(uForward, vUv);
  vec4 corrected = forward + 0.5 * (texture(uSource, vUv) - texture(uBack, vUv));
  vec2 base = (floor(coord / uSourceTexel - 0.5) + 0.5) * uSourceTexel;
  vec4 a = texture(uSource, base);
  vec4 b = texture(uSource, base + vec2(uSourceTexel.x, 0.0));
  vec4 c = texture(uSource, base + vec2(0.0, uSourceTexel.y));
  vec4 d = texture(uSource, base + uSourceTexel);
  vec4 low = min(min(a, b), min(c, d));
  vec4 high = max(max(a, b), max(c, d));
  outColor = clamp(corrected, low, high) * uDecay;
}`;

const DIVERGENCE = `${HEADER}
uniform sampler2D uVelocity;
void main() {
  float left = texture(uVelocity, vL).x;
  float right = texture(uVelocity, vR).x;
  float top = texture(uVelocity, vT).y;
  float bottom = texture(uVelocity, vB).y;
  vec2 center = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) left = -center.x;
  if (vR.x > 1.0) right = -center.x;
  if (vT.y > 1.0) top = -center.y;
  if (vB.y < 0.0) bottom = -center.y;
  outColor = vec4(0.5 * (right - left + top - bottom), 0.0, 0.0, 1.0);
}`;

const SCALE = `${HEADER}
uniform sampler2D uSource;
uniform float uValue;
void main() {
  outColor = texture(uSource, vUv) * uValue;
}`;

const PRESSURE = `${HEADER}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float left = texture(uPressure, vL).x;
  float right = texture(uPressure, vR).x;
  float top = texture(uPressure, vT).x;
  float bottom = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  outColor = vec4((left + right + bottom + top - divergence) * 0.25, 0.0, 0.0, 1.0);
}`;

const GRADIENT = `${HEADER}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float left = texture(uPressure, vL).x;
  float right = texture(uPressure, vR).x;
  float top = texture(uPressure, vT).x;
  float bottom = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy - vec2(right - left, top - bottom);
  outColor = vec4(velocity, 0.0, 1.0);
}`;

const SHADE = `
uniform vec3 uColor;
uniform vec3 uSecondary;
uniform float uIntensity;
uniform float uHotspot;
vec3 shade(vec3 dye) {
  float energy = max(dye.x, 0.0);
  float heat = clamp(dye.y, 0.0, energy);
  float gas = max(dye.z, 0.0);
  float fresh = heat / max(energy, 0.0001);
  vec3 tint = mix(uSecondary, uColor, fresh);
  return (tint * energy + uSecondary * gas + vec3(heat * heat * 0.3 * uHotspot)) * uIntensity;
}
`;

const PREFILTER = `${HEADER}${SHADE}
uniform sampler2D uDye;
uniform vec2 uDyeTexel;
void main() {
  vec2 o = uDyeTexel * 0.5;
  vec3 light = shade(texture(uDye, vUv + vec2(-o.x, -o.y)).xyz);
  light += shade(texture(uDye, vUv + vec2(o.x, -o.y)).xyz);
  light += shade(texture(uDye, vUv + vec2(-o.x, o.y)).xyz);
  light += shade(texture(uDye, vUv + vec2(o.x, o.y)).xyz);
  outColor = vec4(light * 0.25, 1.0);
}`;

const DOWN = `${HEADER}
uniform sampler2D uSource;
uniform vec2 uSourceTexel;
void main() {
  vec2 o = uSourceTexel;
  vec3 color = texture(uSource, vUv).rgb * 4.0;
  color += texture(uSource, vUv + vec2(-o.x, -o.y)).rgb;
  color += texture(uSource, vUv + vec2(o.x, -o.y)).rgb;
  color += texture(uSource, vUv + vec2(-o.x, o.y)).rgb;
  color += texture(uSource, vUv + vec2(o.x, o.y)).rgb;
  outColor = vec4(color / 8.0, 1.0);
}`;

const UP = `${HEADER}
uniform sampler2D uSource;
uniform vec2 uSourceTexel;
void main() {
  vec2 o = uSourceTexel;
  vec3 color = texture(uSource, vUv + vec2(-o.x * 2.0, 0.0)).rgb;
  color += texture(uSource, vUv + vec2(o.x * 2.0, 0.0)).rgb;
  color += texture(uSource, vUv + vec2(0.0, -o.y * 2.0)).rgb;
  color += texture(uSource, vUv + vec2(0.0, o.y * 2.0)).rgb;
  color += texture(uSource, vUv + vec2(-o.x, -o.y)).rgb * 2.0;
  color += texture(uSource, vUv + vec2(o.x, -o.y)).rgb * 2.0;
  color += texture(uSource, vUv + vec2(-o.x, o.y)).rgb * 2.0;
  color += texture(uSource, vUv + vec2(o.x, o.y)).rgb * 2.0;
  outColor = vec4(color / 12.0, 1.0);
}`;

const DISPLAY = `${HEADER}${SHADE}
uniform sampler2D uDye;
uniform sampler2D uBloom;
uniform float uGlow;
uniform float uGrain;
uniform float uTime;
uniform float uLight;
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
void main() {
  vec3 dye = texture(uDye, vUv).xyz;
  vec3 light = shade(dye);
  vec3 bloom = texture(uBloom, vUv).rgb * uGlow;
  float edge = smoothstep(0.0, 0.02, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
  float grain = 1.0 + (hash(gl_FragCoord.xy + fract(uTime * 13.7) * 97.0) - 0.5) * uGrain * 2.0;
  if (uLight > 0.5) {
    float energy = max(dye.x, 0.0);
    float heat = clamp(dye.y, 0.0, energy);
    float gas = max(dye.z, 0.0);
    float fresh = heat / max(energy, 0.0001);
    vec3 tint = mix(uSecondary, uColor, fresh);
    float halo = dot(bloom, vec3(0.2126, 0.7152, 0.0722));
    float density = 1.0 - exp(-((energy * 1.1 + gas * 0.8) * uIntensity + halo * 0.25));
    float tone = dot(tint, vec3(0.2126, 0.7152, 0.0722));
    vec3 ink = tint * min(1.0, 0.5 / max(tone, 0.001)) * mix(0.95, 0.72, smoothstep(0.5, 3.0, energy));
    ink = mix(ink, vec3(1.0), clamp(heat * heat * 0.05 * uHotspot, 0.0, 0.45));
    density = clamp(density * grain, 0.0, 1.0) * edge;
    outColor = vec4(ink * density, density);
  } else {
    vec3 color = 1.0 - exp(-(light + bloom) * grain);
    color *= edge;
    outColor = vec4(color, max(color.r, max(color.g, color.b)));
  }
}`;

const QUALITY: Record<GlowCursorQuality, { sim: number; dye: number }> = {
  low: { sim: 96, dye: 384 },
  medium: { sim: 128, dye: 576 },
  high: { sim: 160, dye: 768 },
};

const PRESSURE_STEPS = 20;
const BLOOM_LEVELS = 5;
const FALLBACK_COLOR = [0.37, 0.55, 1];
const VELOCITY_HUE_SPEED = 1500;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function toHsv([r, g, b]: number[]): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta > 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  return [(hue * 60 + 360) % 360, max > 0 ? delta / max : 0, max];
}

function fromHsv(hue: number, saturation: number, value: number): number[] {
  const h = (((hue % 360) + 360) % 360) / 60;
  const c = value * saturation;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = value - c;
  const [r, g, b] =
    h < 1
      ? [c, x, 0]
      : h < 2
        ? [x, c, 0]
        : h < 3
          ? [0, c, x]
          : h < 4
            ? [0, x, c]
            : h < 5
              ? [x, 0, c]
              : [c, 0, x];
  return [r + m, g + m, b + m];
}

const shiftHue = (rgb: number[], degrees: number) => {
  const [h, s, v] = toHsv(rgb);
  return fromHsv(h + degrees, s, v);
};

/** Returns null when WebGL2 or float render targets are unavailable */
export function createGlowCursorEngine(
  canvas: HTMLCanvasElement,
  initial: GlowCursorSettings,
): GlowCursorEngine | null {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl || !gl.getExtension("EXT_color_buffer_float")) return null;

  const vertexShader = compile(gl, gl.VERTEX_SHADER, VERTEX);
  if (!vertexShader) return null;

  const build = (source: string): Pass | null => {
    const fragment = compile(gl, gl.FRAGMENT_SHADER, source);
    const program = gl.createProgram();
    if (!fragment || !program) return null;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, "aPosition");
    gl.linkProgram(program);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }
    const uniforms: Uniforms = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    return { program, uniforms };
  };

  const built = {
    splat: build(SPLAT),
    advect: build(ADVECT),
    maccormack: build(MACCORMACK),
    divergence: build(DIVERGENCE),
    scale: build(SCALE),
    pressure: build(PRESSURE),
    gradient: build(GRADIENT),
    prefilter: build(PREFILTER),
    down: build(DOWN),
    up: build(UP),
    display: build(DISPLAY),
  };
  if (Object.values(built).some((item) => !item)) {
    Object.values(built).forEach((item) => item && gl.deleteProgram(item.program));
    gl.deleteShader(vertexShader);
    return null;
  }
  const pass = built as Record<keyof typeof built, Pass>;

  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const probeContext = probe.getContext("2d", { willReadFrequently: true });
  const reducedQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const lightQuery = window.matchMedia?.("(prefers-color-scheme: light)");

  let settings = initial;
  const state = {
    width: 1,
    height: 1,
    ratio: 1,
    colorKey: "",
    color: FALLBACK_COLOR,
    secondary: [0.25, 0.3, 1],
    pointer: { x: 0, y: 0, inside: false, moved: -Infinity },
    emitter: { x: 0, y: 0, vx: 0, vy: 0, px: 0, py: 0 },
    ready: false,
    bursts: [] as [number, number][],
    active: -Infinity,
    time: 0,
    allocated: "",
    tokens: "",
    targets: null as Targets | null,
  };
  let raf = 0;
  let last = 0;
  let alive = true;
  let visible = true;

  const reduced = () => settings.respectReducedMotion && (reducedQuery?.matches ?? false);
  const isLight = () =>
    settings.mode === "light" || (settings.mode === "auto" && (lightQuery?.matches ?? false));

  /** Resolves `var(--name, fallback)` against the canvas so theme variables work as colors */
  const resolveCss = (value: string): string => {
    const match = /^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/.exec(value.trim());
    if (!match) return value;
    const resolved = getComputedStyle(canvas).getPropertyValue(match[1]).trim();
    return resolved ? resolveCss(resolved) : (match[2] ?? "");
  };

  const toRgb = (value: string, fallback: number[]): number[] => {
    if (!probeContext || !value) return fallback;
    const raw = resolveCss(value);
    if (!raw) return fallback;
    const css = /^[0-9a-f]{3,8}$/i.test(raw) ? `#${raw}` : raw;
    probeContext.clearRect(0, 0, 1, 1);
    probeContext.fillStyle = "#000000";
    probeContext.fillStyle = css;
    probeContext.fillRect(0, 0, 1, 1);
    const [r, g, b] = probeContext.getImageData(0, 0, 1, 1).data;
    return [r / 255, g / 255, b / 255];
  };

  const resolveColors = () => {
    const key = `${settings.color}|${settings.secondaryColor}`;
    if (key === state.colorKey) return;
    state.colorKey = key;
    state.color = toRgb(settings.color, FALLBACK_COLOR);
    if (settings.secondaryColor) {
      state.secondary = toRgb(settings.secondaryColor, state.color);
    } else {
      const [hue, saturation, value] = toHsv(state.color);
      state.secondary = fromHsv(hue + 8, Math.min(1, saturation * 1.1 + 0.05), value);
    }
  };

  /** Hue offset for the current frame (rainbow / velocity color modes) */
  const hueOffset = () => {
    if (settings.colorMode === "rainbow") return state.time * settings.hueSpeed;
    if (settings.colorMode === "velocity") {
      const speed = Math.hypot(state.emitter.vx, state.emitter.vy);
      return Math.min(1, speed / VELOCITY_HUE_SPEED) * settings.hueSpeed * 3;
    }
    return 0;
  };

  const applyTokens = () => {
    const tokens = resolveTokens(settings, isLight());
    const key = JSON.stringify(tokens);
    if (key === state.tokens) return;
    state.tokens = key;
    for (const [name, value] of Object.entries(tokens)) canvas.style.setProperty(name, value);
  };

  const createTarget = (
    width: number,
    height: number,
    internalFormat: number,
    format: number,
    filter: number,
  ): Target => {
    const texture = gl.createTexture() as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer() as WebGLFramebuffer;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture, fbo, width, height, texel: [1 / width, 1 / height] };
  };

  const createPair = (
    width: number,
    height: number,
    internalFormat: number,
    format: number,
    filter: number,
  ): Pair => {
    let read = createTarget(width, height, internalFormat, format, filter);
    let write = createTarget(width, height, internalFormat, format, filter);
    return {
      get read() {
        return read;
      },
      get write() {
        return write;
      },
      swap() {
        const next = read;
        read = write;
        write = next;
      },
      targets() {
        return [read, write];
      },
    };
  };

  const release = () => {
    const t = state.targets;
    if (!t) return;
    [
      ...t.velocity.targets(),
      ...t.dye.targets(),
      ...t.pressure.targets(),
      t.divergence,
      t.forward,
      t.back,
      ...t.bloom,
    ].forEach((target) => {
      gl.deleteTexture(target.texture);
      gl.deleteFramebuffer(target.fbo);
    });
    state.targets = null;
  };

  const clearTargets = () => {
    const t = state.targets;
    if (!t) return;
    gl.clearColor(0, 0, 0, 0);
    [...t.velocity.targets(), ...t.dye.targets(), ...t.pressure.targets()].forEach((target) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.clear(gl.COLOR_BUFFER_BIT);
    });
  };

  const allocate = () => {
    const key = `${settings.quality}|${state.width}|${state.height}|${canvas.width}|${canvas.height}`;
    if (key === state.allocated && state.targets) return;
    release();
    state.allocated = key;
    const preset = QUALITY[settings.quality];
    const aspect = state.width / state.height;
    const dims = (base: number) =>
      aspect >= 1 ? [Math.round(base * aspect), base] : [base, Math.round(base / aspect)];
    const [simW, simH] = dims(preset.sim);
    let [dyeW, dyeH] = dims(preset.dye);
    const shrink = Math.min(1, canvas.width / dyeW, canvas.height / dyeH);
    dyeW = Math.max(2, Math.round(dyeW * shrink));
    dyeH = Math.max(2, Math.round(dyeH * shrink));
    const bloom: Target[] = [];
    let bloomW = dyeW >> 1;
    let bloomH = dyeH >> 1;
    for (let i = 0; i < BLOOM_LEVELS; i++) {
      bloom.push(
        createTarget(Math.max(1, bloomW), Math.max(1, bloomH), gl.RGBA16F, gl.RGBA, gl.LINEAR),
      );
      bloomW >>= 1;
      bloomH >>= 1;
    }
    state.targets = {
      velocity: createPair(simW, simH, gl.RG16F, gl.RG, gl.LINEAR),
      dye: createPair(dyeW, dyeH, gl.RGBA16F, gl.RGBA, gl.LINEAR),
      forward: createTarget(dyeW, dyeH, gl.RGBA16F, gl.RGBA, gl.LINEAR),
      back: createTarget(dyeW, dyeH, gl.RGBA16F, gl.RGBA, gl.LINEAR),
      pressure: createPair(simW, simH, gl.R16F, gl.RED, gl.NEAREST),
      divergence: createTarget(simW, simH, gl.R16F, gl.RED, gl.NEAREST),
      bloom,
    };
  };

  const pixelRatio = () => Math.min(window.devicePixelRatio || 1, settings.maxDevicePixelRatio);

  let resizePending = false;
  const applyResize = () => {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    const ratio = pixelRatio();
    const pixelWidth = Math.max(1, Math.round(width * ratio));
    const pixelHeight = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    state.width = width;
    state.height = height;
    state.ratio = ratio;
    allocate();
  };

  const draw = (target: Target | null) => {
    if (target) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, target.width, target.height);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const use = (item: Pass, texel: number[]) => {
    gl.useProgram(item.program);
    if (item.uniforms.uTexel) gl.uniform2f(item.uniforms.uTexel, texel[0], texel[1]);
    return item.uniforms;
  };

  const bind = (unit: number, target: Target) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    return unit;
  };

  /** mode 0 = additive point, 1 = mix point, 2 = additive sweep, 3 = mix sweep */
  const splat = (
    pair: Pair,
    line: [number, number, number, number],
    radius: number,
    value: number[],
    shape: { mode: number; strength: number; wide?: number },
  ) => {
    const [ax, ay, bx, by] = line;
    const u = use(pass.splat, pair.read.texel);
    gl.uniform1i(u.uTarget, bind(0, pair.read));
    gl.uniform1f(u.uAspect, state.width / state.height);
    gl.uniform2f(u.uA, ax / state.width, 1 - ay / state.height);
    gl.uniform2f(u.uB, bx / state.width, 1 - by / state.height);
    gl.uniform1f(u.uRadius, radius / state.height);
    gl.uniform1f(u.uWide, (shape.wide ?? radius) / state.height);
    gl.uniform3f(u.uValue, value[0], value[1], value[2]);
    gl.uniform1f(u.uMode, shape.mode);
    gl.uniform1f(u.uStrength, shape.strength);
    draw(pair.write);
    pair.swap();
  };

  const toGrid = (vx: number, vy: number) => {
    const { velocity } = state.targets as Targets;
    return [(vx * velocity.read.width) / state.width, (-vy * velocity.read.height) / state.height];
  };

  const lightRadius = () =>
    Math.max(
      settings.trailWidth * settings.scale * 0.5,
      (state.height / (state.targets as Targets).dye.read.height) * 0.9,
    );

  /** Lissajous path through the area, used while idle */
  const idlePoint = () => [
    state.width * (0.5 + 0.32 * Math.sin(state.time * 0.9)),
    state.height * (0.5 + 0.28 * Math.sin(state.time * 1.3 + 0.5)),
  ];

  const isIdle = (now: number) =>
    settings.idle &&
    settings.enabled &&
    (!state.pointer.inside || now - state.pointer.moved > settings.idleDelay * 1000);

  const placeEmitter = (x: number, y: number) => {
    Object.assign(state.emitter, { x, y, px: x, py: y, vx: 0, vy: 0 });
  };

  const emit = (dt: number, now: number) => {
    const idle = isIdle(now);
    if (idle && !state.ready) {
      const [x, y] = idlePoint();
      placeEmitter(x, y);
      state.ready = true;
    }
    if (!state.ready) return;
    const [tx, ty] = idle ? idlePoint() : [state.pointer.x, state.pointer.y];
    const { emitter } = state;
    const { velocity, dye } = state.targets as Targets;
    const still = reduced();
    emitter.px = emitter.x;
    emitter.py = emitter.y;
    if (still || settings.followSpeed >= 1) {
      emitter.vx = (tx - emitter.x) / Math.max(dt, 1e-3);
      emitter.vy = (ty - emitter.y) / Math.max(dt, 1e-3);
      emitter.x = tx;
      emitter.y = ty;
    } else {
      // Critically damped spring, sub-stepped for stability
      const omega = 10 + settings.followSpeed * 50;
      const steps = Math.max(1, Math.ceil(dt / 0.004));
      const h = dt / steps;
      for (let k = 0; k < steps; k++) {
        emitter.vx += (omega * omega * (tx - emitter.x) - 2 * omega * emitter.vx) * h;
        emitter.vy += (omega * omega * (ty - emitter.y) - 2 * omega * emitter.vy) * h;
        emitter.x += emitter.vx * h;
        emitter.y += emitter.vy * h;
      }
    }
    const dx = emitter.x - emitter.px;
    const dy = emitter.y - emitter.py;
    if (Math.hypot(dx, dy) < 0.05 || !settings.enabled) return;
    const line: [number, number, number, number] = [emitter.px, emitter.py, emitter.x, emitter.y];
    const radius = lightRadius();
    if (!still && settings.flow > 0) {
      const target = toGrid(dx / Math.max(dt, 1e-3), dy / Math.max(dt, 1e-3));
      splat(velocity, line, radius * 4 + 18, [target[0], target[1], 0], {
        mode: 3,
        strength: settings.flow * 0.6,
      });
    }
    splat(dye, line, radius, [5.6, 5.6, 0.7], { mode: 2, strength: 1, wide: radius * 5 + 6 });
    state.active = now;
  };

  const burst = (x: number, y: number, now: number) => {
    const { velocity, dye } = state.targets as Targets;
    const radius = lightRadius();
    const size = settings.burstSize * settings.scale;
    const jets = settings.burstJets;
    const base = Math.random() * Math.PI * 2;
    const still = reduced();
    for (let k = 0; k < jets; k++) {
      const angle = base + (k / jets) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const cx = Math.cos(angle);
      const cy = Math.sin(angle);
      const reach = (20 + Math.random() * 14) * size;
      const line: [number, number, number, number] = [
        x + cx * 3,
        y + cy * 3,
        x + cx * reach,
        y + cy * reach,
      ];
      if (!still) {
        const force = 760 * Math.sqrt(size);
        const target = toGrid(Math.cos(angle + 0.6) * force, Math.sin(angle + 0.6) * force);
        splat(velocity, line, 18 * size, [target[0], target[1], 0], { mode: 1, strength: 0.9 });
      }
      splat(dye, line, radius * 1.1, [2.4, 2.4, 0.3], {
        mode: 0,
        strength: 1,
        wide: radius * 5 + 6,
      });
    }
    splat(dye, [x, y, x + 0.01, y], radius * 2.2 * Math.sqrt(size), [1.8, 1.8, 0.4], {
      mode: 0,
      strength: 1,
      wide: radius * 7 + 10,
    });
    state.active = now;
    settings.onBurst?.(x, y);
  };

  const step = (dt: number) => {
    const { velocity, dye, pressure, divergence, forward, back } = state.targets as Targets;
    const still = reduced();
    if (!still) {
      let u = use(pass.divergence, velocity.read.texel);
      gl.uniform1i(u.uVelocity, bind(0, velocity.read));
      draw(divergence);

      u = use(pass.scale, pressure.read.texel);
      gl.uniform1i(u.uSource, bind(0, pressure.read));
      gl.uniform1f(u.uValue, 0.8);
      draw(pressure.write);
      pressure.swap();

      u = use(pass.pressure, pressure.read.texel);
      gl.uniform1i(u.uDivergence, bind(1, divergence));
      for (let i = 0; i < PRESSURE_STEPS; i++) {
        gl.uniform1i(u.uPressure, bind(0, pressure.read));
        draw(pressure.write);
        pressure.swap();
      }

      u = use(pass.gradient, velocity.read.texel);
      gl.uniform1i(u.uPressure, bind(0, pressure.read));
      gl.uniform1i(u.uVelocity, bind(1, velocity.read));
      draw(velocity.write);
      velocity.swap();

      u = use(pass.advect, velocity.read.texel);
      gl.uniform2f(u.uVelocityTexel, velocity.read.texel[0], velocity.read.texel[1]);
      gl.uniform1i(u.uVelocity, bind(0, velocity.read));
      gl.uniform1i(u.uSource, bind(0, velocity.read));
      gl.uniform1f(u.uDt, dt);
      const calm = Math.exp(-dt * 1.2);
      gl.uniform4f(u.uDecay, calm, calm, 1, 1);
      draw(velocity.write);
      velocity.swap();
    }

    const { linger } = settings;
    const decay = [
      Math.exp((-dt * 4.6) / (linger * 0.8)),
      Math.exp((-dt * 4.6) / (linger * 0.2)),
      Math.exp((-dt * 4.6) / (linger * 1.2)),
      1,
    ];
    let u = use(pass.advect, dye.read.texel);
    gl.uniform2f(u.uVelocityTexel, velocity.read.texel[0], velocity.read.texel[1]);
    gl.uniform1i(u.uVelocity, bind(0, velocity.read));
    gl.uniform1i(u.uSource, bind(1, dye.read));
    if (still) {
      gl.uniform1f(u.uDt, 0);
      gl.uniform4f(u.uDecay, decay[0], decay[1], decay[2], decay[3]);
      draw(dye.write);
      dye.swap();
      return;
    }
    gl.uniform1f(u.uDt, dt);
    gl.uniform4f(u.uDecay, 1, 1, 1, 1);
    draw(forward);
    gl.uniform1i(u.uSource, bind(1, forward));
    gl.uniform1f(u.uDt, -dt);
    draw(back);
    u = use(pass.maccormack, dye.read.texel);
    gl.uniform2f(u.uVelocityTexel, velocity.read.texel[0], velocity.read.texel[1]);
    gl.uniform2f(u.uSourceTexel, dye.read.texel[0], dye.read.texel[1]);
    gl.uniform1i(u.uVelocity, bind(0, velocity.read));
    gl.uniform1i(u.uSource, bind(1, dye.read));
    gl.uniform1i(u.uForward, bind(2, forward));
    gl.uniform1i(u.uBack, bind(3, back));
    gl.uniform1f(u.uDt, dt);
    gl.uniform4f(u.uDecay, decay[0], decay[1], decay[2], decay[3]);
    draw(dye.write);
    dye.swap();
  };

  const setShade = (u: Uniforms) => {
    const offset = hueOffset();
    const color = offset ? shiftHue(state.color, offset) : state.color;
    const secondary = offset ? shiftHue(state.secondary, offset) : state.secondary;
    gl.uniform3f(u.uColor, color[0], color[1], color[2]);
    gl.uniform3f(u.uSecondary, secondary[0], secondary[1], secondary[2]);
    gl.uniform1f(u.uIntensity, settings.intensity);
    gl.uniform1f(u.uHotspot, settings.hotspot);
  };

  const render = () => {
    const { dye, bloom } = state.targets as Targets;
    if (settings.glow > 0) {
      let u = use(pass.prefilter, bloom[0].texel);
      gl.uniform1i(u.uDye, bind(0, dye.read));
      gl.uniform2f(u.uDyeTexel, dye.read.texel[0], dye.read.texel[1]);
      setShade(u);
      draw(bloom[0]);
      u = use(pass.down, bloom[0].texel);
      for (let i = 1; i < bloom.length; i++) {
        gl.uniform1i(u.uSource, bind(0, bloom[i - 1]));
        gl.uniform2f(u.uSourceTexel, bloom[i - 1].texel[0], bloom[i - 1].texel[1]);
        draw(bloom[i]);
      }
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      u = use(pass.up, bloom[0].texel);
      for (let i = bloom.length - 1; i > 0; i--) {
        gl.uniform1i(u.uSource, bind(0, bloom[i]));
        gl.uniform2f(u.uSourceTexel, bloom[i].texel[0], bloom[i].texel[1]);
        draw(bloom[i - 1]);
      }
      gl.disable(gl.BLEND);
    }
    const u = use(pass.display, [1 / canvas.width, 1 / canvas.height]);
    gl.uniform1i(u.uDye, bind(0, dye.read));
    gl.uniform1i(u.uBloom, bind(1, bloom[0]));
    setShade(u);
    gl.uniform1f(u.uGlow, settings.glow > 0 ? (settings.glow * 1.4) / BLOOM_LEVELS : 0);
    gl.uniform1f(u.uGrain, settings.grain);
    gl.uniform1f(u.uTime, state.time);
    gl.uniform1f(u.uLight, isLight() ? 1 : 0);
    draw(null);
  };

  const blank = () => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  const frame = (now: number) => {
    raf = 0;
    if (resizePending) {
      resizePending = false;
      applyResize();
    }
    if (!alive || !visible || document.hidden || settings.paused) return;
    const dt = last ? Math.min(1 / 30, (now - last) / 1000) : 1 / 60;
    last = now;
    state.time += dt;
    if (Math.abs(pixelRatio() - state.ratio) > 0.01) applyResize();
    allocate();
    resolveColors();
    gl.bindVertexArray(vao);
    gl.disable(gl.BLEND);

    emit(dt, now);
    while (state.bursts.length) {
      const [x, y] = state.bursts.shift() as [number, number];
      burst(x, y, now);
    }
    step(dt);
    render();

    // Sleep once the light has faded and the emitter is at rest
    const quiet = now - state.active > settings.linger * 1200 + 900;
    const resting = Math.hypot(state.emitter.vx, state.emitter.vy) < 1;
    if (quiet && resting && !isIdle(now)) {
      clearTargets();
      blank();
      last = 0;
      return;
    }
    raf = requestAnimationFrame(frame);
  };

  const wake = () => {
    if (!raf && alive && visible && !document.hidden && !settings.paused)
      raf = requestAnimationFrame(frame);
  };

  const local = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return { x, y, inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height };
  };

  const leave = () => {
    state.pointer.inside = false;
    // With the idle path on, the emitter glides from the pointer to the path instead of jumping
    if (!settings.idle) state.ready = false;
    wake();
  };

  const onPointerMove = (event: PointerEvent) => {
    const { x, y, inside } = local(event);
    if (!inside) {
      if (state.pointer.inside) leave();
      return;
    }
    if (!state.ready) {
      placeEmitter(x, y);
      state.ready = true;
    }
    Object.assign(state.pointer, { x, y, inside: true, moved: performance.now() });
    wake();
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!settings.clickBurst || !settings.enabled) return;
    const { x, y, inside } = local(event);
    if (!inside) return;
    state.bursts.push([x, y]);
    wake();
  };

  const onVisibility = () => {
    last = 0;
    wake();
  };

  const onMedia = () => {
    applyTokens();
    wake();
  };

  const resizeObserver = new ResizeObserver(() => {
    resizePending = true;
    wake();
  });
  resizeObserver.observe(canvas);
  const intersection = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) {
      last = 0;
      wake();
    }
  });
  intersection.observe(canvas);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  document.documentElement.addEventListener("pointerleave", leave);
  document.addEventListener("visibilitychange", onVisibility);
  reducedQuery?.addEventListener("change", onMedia);
  lightQuery?.addEventListener("change", onMedia);
  applyTokens();
  applyResize();
  blank();
  wake();

  return {
    update(next) {
      const resumed = settings.paused && !next.paused;
      settings = next;
      applyTokens();
      if (resumed) last = 0;
      resizePending = true;
      wake();
    },
    burst(x, y) {
      state.bursts.push([x ?? state.width / 2, y ?? state.height / 2]);
      wake();
    },
    clear() {
      clearTargets();
      blank();
      state.ready = false;
      state.active = -Infinity;
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", onVisibility);
      reducedQuery?.removeEventListener("change", onMedia);
      lightQuery?.removeEventListener("change", onMedia);
      release();
      Object.values(pass).forEach((item) => gl.deleteProgram(item.program));
      gl.deleteShader(vertexShader);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
    },
  };
}
