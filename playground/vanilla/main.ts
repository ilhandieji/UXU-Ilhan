import "./index.css";
import { demos } from "./demos";

const names = Object.keys(demos);
const current = new URLSearchParams(location.search).get("c") ?? names[0];

const nav = document.createElement("nav");
nav.className = "flex gap-4 border-b border-neutral-800 px-6 py-3 text-sm";
for (const name of names) {
  const link = document.createElement("a");
  link.href = `?c=${name}`;
  link.textContent = name;
  link.className = name === current ? "font-semibold underline" : "opacity-60 hover:opacity-100";
  nav.append(link);
}

const stage = document.createElement("main");
stage.className = "p-6";
document.querySelector("#app")!.append(nav, stage);
demos[current]?.(stage);
