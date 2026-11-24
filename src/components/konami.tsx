"use client";

import { useEffect, useState } from "react";
import { MatrixRain } from "@lib/matrix-rain/react/MatrixRain";

const SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];
const DURATION_MS = 7000;

/** Easter egg: the classic cheat code turns the whole site into falling code for a few seconds */
export function Konami() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let progress = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return setActive(false);
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      progress = key === SEQUENCE[progress] ? progress + 1 : key === SEQUENCE[0] ? 1 : 0;
      if (progress < SEQUENCE.length) return;
      progress = 0;
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) setActive(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setActive(false), DURATION_MS);
    return () => clearTimeout(timer);
  }, [active]);

  return active ? (
    <MatrixRain variant="fullscreen" theme="matrix" bg="rgb(0 0 0 / 0.55)" zIndex={100} />
  ) : null;
}
