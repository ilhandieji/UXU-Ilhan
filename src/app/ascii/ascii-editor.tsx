"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ColorPicker } from "@/components/color-picker";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isFontReady, loadFont, renderText } from "@/lib/ascii/fonts";
import {
  BLANK,
  cellAt,
  commit,
  createGrid,
  floodFill,
  fromLines,
  historyOf,
  linePoints,
  rectPoints,
  redo,
  resizeGrid,
  setCells,
  toLines,
  undo,
  writeText,
  type Cell,
  type Grid,
  type History,
} from "@/lib/ascii/grid";
import { download, toGif } from "@/lib/ascii/export";
import { convertImage, type ImageOptions } from "@/lib/ascii/image";
import { qrGrid } from "@/lib/ascii/qr";
import { saveBannerAnimation, saveBannerArt } from "@/lib/ascii/terminal-banner";
import { replaceQuery } from "@/lib/url-state";
import { AnimatePanel } from "./animate-panel";
import { AsciiCanvas } from "./ascii-canvas";
import { DrawPanel, TOOL_KEYS, type Brush, type Tool } from "./draw-panel";
import {
  decodeSettings,
  DEFAULT_DRAWING,
  encodeSettings,
  loadAnimation,
  loadDrawing,
  MAX_FRAMES,
  saveAnimation,
  saveDrawing,
  type Animation,
  type EditorSettings,
  type EditorTab,
} from "./editor-state";
import { ExportBar } from "./export-bar";
import { ImagePanel, type ImageSource } from "./image-panel";
import { TextPanel } from "./text-panel";

const URL_DEBOUNCE_MS = 200;
/** Live camera conversion rate */
const LIVE_FRAME_MS = 90;
const EMPTY_IMAGE = fromLines([
  "",
  "  No image yet.",
  "",
  "  Drop, paste, choose a file",
  "  or open the camera →",
]);

type Stroke = { base: Grid; start: [number, number]; last: [number, number]; cell: Cell };
type Caret = { x: number; y: number; startX: number };

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export function AsciiEditor() {
  const router = useRouter();
  const params = useSearchParams();
  const [settings, setSettings] = useState<EditorSettings>(() =>
    decodeSettings(new URLSearchParams(params.toString())),
  );
  const update = (patch: Partial<EditorSettings>) => setSettings((s) => ({ ...s, ...patch }));
  const updateImage = (patch: Partial<ImageOptions>) =>
    setSettings((s) => ({ ...s, image: { ...s.image, ...patch } }));

  useEffect(() => {
    const timer = setTimeout(() => replaceQuery(encodeSettings(settings)), URL_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [settings]);

  // ---------- Text ----------
  const [fontTick, setFontTick] = useState(0);
  useEffect(() => {
    if (isFontReady(settings.font)) return;
    let alive = true;
    void loadFont(settings.font).then(() => alive && setFontTick((t) => t + 1));
    return () => {
      alive = false;
    };
  }, [settings.font]);

  const textGrid = useMemo(
    () =>
      settings.textMode === "qr"
        ? (qrGrid(
            settings.text,
            { level: settings.qrLevel, invert: settings.qrInvert, margin: 2 },
            settings.textColor || undefined,
          ) ?? fromLines(["", "  Text is too long for a QR code at this level."]))
        : fromLines(
            renderText(settings.text, {
              font: settings.font,
              layout: settings.layout,
              align: settings.align,
              width: settings.wrap,
            }),
            settings.textColor || undefined,
          ),
    // fontTick re-renders once an on-demand font has loaded
    [
      settings.textMode,
      settings.qrLevel,
      settings.qrInvert,
      settings.text,
      settings.font,
      settings.layout,
      settings.align,
      settings.wrap,
      settings.textColor,
      fontTick,
    ],
  );

  // ---------- Image ----------
  const [source, setSource] = useState<ImageSource | null>(null);
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!source?.live) return;
    const timer = setInterval(() => setFrame((f) => f + 1), LIVE_FRAME_MS);
    return () => clearInterval(timer);
  }, [source]);

  const imageGrid = useMemo(() => {
    if (!source) return EMPTY_IMAGE;
    const el = source.el;
    const width = el instanceof HTMLVideoElement ? el.videoWidth || source.width : source.width;
    const height = el instanceof HTMLVideoElement ? el.videoHeight || source.height : source.height;
    return convertImage(el, width, height, settings.image);
    // frame re-converts the live camera image
  }, [source, settings.image, frame]);

  // ---------- Drawing ----------
  // This component only renders on the client (useSearchParams inside Suspense), so localStorage is safe here
  const [drawHistory, setDrawHistory] = useState<History>(() =>
    historyOf(
      typeof window === "undefined"
        ? createGrid(DEFAULT_DRAWING.width, DEFAULT_DRAWING.height)
        : loadDrawing(),
    ),
  );
  useEffect(() => saveDrawing(drawHistory.present), [drawHistory.present]);

  // ---------- Animation ----------
  // Each frame is edited with the drawing tools; its own undo history restarts when switching frames
  const [anim, setAnim] = useState<Animation>(() => loadAnimation());
  const [frameIndex, setFrameIndex] = useState(0);
  const [animHistory, setAnimHistory] = useState<History>(() => historyOf(anim.frames[0]));
  const [playing, setPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [onion, setOnion] = useState(true);
  useEffect(() => saveAnimation(anim), [anim]);
  useEffect(() => {
    setAnim((a) =>
      a.frames[frameIndex] === animHistory.present
        ? a
        : { ...a, frames: a.frames.map((f, i) => (i === frameIndex ? animHistory.present : f)) },
    );
  }, [animHistory.present, frameIndex]);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () => setPlayIndex((i) => (i + 1) % anim.frames.length),
      1000 / anim.fps,
    );
    return () => clearInterval(timer);
  }, [playing, anim.fps, anim.frames.length]);

  /** Frames with the frame being edited written back (the sync effect may not have run yet) */
  const syncedFrames = () =>
    anim.frames.map((f, i) => (i === frameIndex ? animHistory.present : f));
  const selectFrame = (i: number, frames = syncedFrames()) => {
    setAnim({ ...anim, frames });
    setFrameIndex(i);
    setAnimHistory(historyOf(frames[i]));
  };
  const insertFrame = (frame: Grid) => {
    if (anim.frames.length >= MAX_FRAMES) return;
    const frames = syncedFrames();
    frames.splice(frameIndex + 1, 0, frame);
    selectFrame(frameIndex + 1, frames);
  };
  const deleteFrame = () => {
    if (anim.frames.length <= 1) return;
    const frames = anim.frames.filter((_, i) => i !== frameIndex);
    selectFrame(Math.max(0, frameIndex - 1), frames);
  };
  const moveFrame = (delta: -1 | 1) => {
    const to = frameIndex + delta;
    if (to < 0 || to >= anim.frames.length) return;
    const frames = syncedFrames();
    [frames[frameIndex], frames[to]] = [frames[to], frames[frameIndex]];
    setAnim({ ...anim, frames });
    setFrameIndex(to);
  };

  const isAnimate = settings.tab === "animate";
  const isEditing = settings.tab === "draw" || isAnimate;
  const history = isAnimate ? animHistory : drawHistory;
  const setHistory = isAnimate ? setAnimHistory : setDrawHistory;

  const [tool, setTool] = useState<Tool>("pencil");
  const [brush, setBrushState] = useState<Brush>({
    ch: "█",
    fg: "#22c55e",
    bg: "#1e3a8a",
    useFg: true,
    useBg: false,
    filledRect: false,
  });
  const setBrush = (patch: Partial<Brush>) => setBrushState((b) => ({ ...b, ...patch }));
  const [draft, setDraftState] = useState<Grid | null>(null);
  const draftRef = useRef<Grid | null>(null);
  const setDraft = (g: Grid | null) => {
    draftRef.current = g;
    setDraftState(g);
  };
  const stroke = useRef<Stroke | null>(null);
  const [caret, setCaret] = useState<Caret | null>(null);

  const brushCell = (): Cell => ({
    ch: brush.ch,
    ...(brush.useFg ? { fg: brush.fg } : {}),
    ...(brush.useBg ? { bg: brush.bg } : {}),
  });

  const onCellDown = (x: number, y: number) => {
    const base = history.present;
    const cell = tool === "eraser" ? BLANK : brushCell();
    if (tool !== "text") setCaret(null);
    switch (tool) {
      case "pencil":
      case "eraser":
        stroke.current = { base, start: [x, y], last: [x, y], cell };
        setDraft(setCells(base, [[x, y]], cell));
        return;
      case "line":
      case "rect":
        stroke.current = { base, start: [x, y], last: [x, y], cell };
        setDraft(setCells(base, [[x, y]], cell));
        return;
      case "fill":
        setHistory((h) => commit(h, floodFill(h.present, x, y, cell)));
        return;
      case "text":
        setCaret({ x, y, startX: x });
        return;
      case "picker": {
        const c = cellAt(base, x, y);
        setBrush({
          ch: c.ch === " " ? brush.ch : c.ch,
          useFg: !!c.fg,
          fg: c.fg ?? brush.fg,
          useBg: !!c.bg,
          bg: c.bg ?? brush.bg,
        });
        setTool("pencil");
      }
    }
  };

  const onCellMove = (x: number, y: number) => {
    const s = stroke.current;
    if (!s) return;
    const [sx, sy] = s.start;
    if (tool === "line") setDraft(setCells(s.base, linePoints(sx, sy, x, y), s.cell));
    else if (tool === "rect")
      setDraft(setCells(s.base, rectPoints(sx, sy, x, y, brush.filledRect), s.cell));
    else {
      const [lx, ly] = s.last;
      setDraft(setCells(draftRef.current ?? s.base, linePoints(lx, ly, x, y), s.cell));
    }
    s.last = [x, y];
  };

  const onCellUp = (x: number, y: number) => {
    // The release point always completes the stroke, even if no move event reached it
    if (stroke.current) onCellMove(x, y);
    const finished = draftRef.current;
    stroke.current = null;
    setDraft(null);
    if (finished) setHistory((h) => commit(h, finished));
  };

  // Keyboard: undo/redo, text typing, tool shortcuts (only on the Draw tab and outside form fields)
  useEffect(() => {
    if (!isEditing) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        setHistory((h) => (e.shiftKey ? redo(h) : undo(h)));
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        setHistory(redo);
        return;
      }
      if (caret) {
        const style = {
          ...(brush.useFg ? { fg: brush.fg } : {}),
          ...(brush.useBg ? { bg: brush.bg } : {}),
        };
        const move = (dx: number, dy: number) =>
          setCaret({ ...caret, x: caret.x + dx, y: caret.y + dy });
        if (e.key === "Escape") setCaret(null);
        else if (e.key === "Enter") setCaret({ ...caret, x: caret.startX, y: caret.y + 1 });
        else if (e.key === "ArrowLeft") move(-1, 0);
        else if (e.key === "ArrowRight") move(1, 0);
        else if (e.key === "ArrowUp") move(0, -1);
        else if (e.key === "ArrowDown") move(0, 1);
        else if (e.key === "Backspace") {
          const x = Math.max(0, caret.x - 1);
          setHistory((h) => commit(h, setCells(h.present, [[x, caret.y]], BLANK)));
          setCaret({ ...caret, x });
        } else if (e.key.length === 1 && !mod) {
          setHistory((h) => commit(h, writeText(h.present, caret.x, caret.y, e.key, style)));
          setCaret({ ...caret, x: caret.x + 1 });
        } else return;
        e.preventDefault();
        return;
      }
      const next = !mod && TOOL_KEYS[e.key.toLowerCase()];
      if (next) setTool(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ---------- Active result ----------
  const activeGrid =
    settings.tab === "text"
      ? textGrid
      : settings.tab === "image"
        ? imageGrid
        : isAnimate && playing
          ? (anim.frames[playIndex] ?? history.present)
          : (draft ?? history.present);
  const onionGrid =
    isAnimate && onion && !playing && frameIndex > 0 ? anim.frames[frameIndex - 1] : null;

  const editInDraw = () => {
    setDrawHistory((h) => commit(h, activeGrid));
    setCaret(null);
    update({ tab: "draw" });
  };

  const exportGif = () => {
    try {
      download(
        "ascii-animation.gif",
        toGif(syncedFrames(), {
          fps: anim.fps,
          background: settings.background,
          foreground: settings.foreground,
        }),
      );
    } catch {
      toast.error("GIF export failed");
    }
  };

  const copyFrames = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(syncedFrames().map(toLines), null, 2));
      toast.success("JSON frames copied");
    } catch {
      toast.error("Clipboard is not available");
    }
  };

  const sendAnimation = () => {
    saveBannerAnimation({ frames: syncedFrames().map(toLines), fps: anim.fps });
    router.push("/components/terminal?animation=editor");
  };

  const sendToTerminal = () => {
    saveBannerArt(toLines(activeGrid));
    router.push("/components/terminal?bannerMode=art");
  };

  const drawPanel = (
    <DrawPanel
      key={`${history.present.width}x${history.present.height}`}
      tool={tool}
      setTool={setTool}
      brush={brush}
      setBrush={setBrush}
      width={history.present.width}
      height={history.present.height}
      onResize={(w, h) => setHistory((hist) => commit(hist, resizeGrid(hist.present, w, h)))}
      onClear={() => setHistory((h) => commit(h, createGrid(h.present.width, h.present.height)))}
      canUndo={history.past.length > 0}
      canRedo={history.future.length > 0}
      onUndo={() => setHistory(undo)}
      onRedo={() => setHistory(redo)}
    />
  );

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="min-w-0 space-y-3">
        <div
          className="max-h-[70vh] overflow-auto rounded-lg border p-4"
          style={{ background: settings.background }}
        >
          <AsciiCanvas
            grid={activeGrid}
            fontSize={settings.zoom}
            foreground={settings.foreground}
            background={settings.background}
            label={`ASCII ${settings.tab} preview`}
            showGrid={isEditing && !playing}
            caret={isEditing ? caret : null}
            onion={onionGrid}
            {...(isEditing && !playing ? { onCellDown, onCellMove, onCellUp } : {})}
          />
        </div>
        <ExportBar
          grid={activeGrid}
          foreground={settings.foreground}
          background={settings.background}
          onEditInDraw={settings.tab === "draw" ? undefined : editInDraw}
          onAddFrame={
            isAnimate
              ? undefined
              : () => {
                  insertFrame(activeGrid);
                  update({ tab: "animate" });
                }
          }
          onSendToTerminal={sendToTerminal}
        />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border bg-card px-4 py-3">
          <div className="flex min-w-48 flex-1 items-center gap-3">
            <Label
              htmlFor="ascii-zoom"
              className="shrink-0 text-xs font-normal text-muted-foreground"
            >
              Zoom
            </Label>
            <Slider
              id="ascii-zoom"
              min={6}
              max={32}
              step={1}
              value={[settings.zoom]}
              onValueChange={([zoom]) => update({ zoom })}
            />
            <span className="w-10 font-mono text-xs text-muted-foreground">{settings.zoom}px</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Text</span>
            <ColorPicker
              label="Default text color"
              value={settings.foreground}
              onChange={(foreground) => update({ foreground })}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Background</span>
            <ColorPicker
              label="Background color"
              value={settings.background}
              onChange={(background) => update({ background })}
            />
          </div>
        </div>
      </section>

      <aside className="rounded-lg border bg-card xl:sticky xl:top-20 xl:max-h-[calc(100svh-6rem)] xl:overflow-y-auto">
        <Tabs
          value={settings.tab}
          onValueChange={(tab) => update({ tab: tab as EditorTab })}
          className="p-4"
        >
          <TabsList className="w-full">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="draw">Draw</TabsTrigger>
            <TabsTrigger value="animate">Animate</TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="mt-4">
            <TextPanel settings={settings} update={update} />
          </TabsContent>
          <TabsContent value="image" className="mt-4">
            <ImagePanel
              image={settings.image}
              updateImage={updateImage}
              source={source}
              setSource={setSource}
            />
          </TabsContent>
          <TabsContent value="draw" className="mt-4">
            {drawPanel}
          </TabsContent>
          <TabsContent value="animate" className="mt-4">
            <AnimatePanel
              count={anim.frames.length}
              index={frameIndex}
              onSelect={(i) => selectFrame(i)}
              onAdd={() => insertFrame(createGrid(history.present.width, history.present.height))}
              onDuplicate={() => insertFrame(history.present)}
              onDelete={deleteFrame}
              onMove={moveFrame}
              fps={anim.fps}
              onFps={(fps) => setAnim((a) => ({ ...a, fps }))}
              onion={onion}
              onOnion={setOnion}
              playing={playing}
              onPlay={() => {
                setPlayIndex(frameIndex);
                setPlaying((p) => !p);
              }}
              onExportGif={exportGif}
              onCopyJson={copyFrames}
              onSendToTerminal={sendAnimation}
            >
              {isAnimate ? drawPanel : null}
            </AnimatePanel>
          </TabsContent>
        </Tabs>
      </aside>
    </div>
  );
}
