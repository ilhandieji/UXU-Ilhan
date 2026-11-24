// "Open in StackBlitz": builds a minimal Vite + Tailwind v4 project from the copied files and posts it
// to stackblitz.com/run (a plain form POST — no SDK needed).
import type { Framework } from "@/registry/types";

type File = { name: string; code: string };

const VERSIONS = {
  vite: "^7.0.0",
  "@vitejs/plugin-react": "^5.0.0",
  tailwindcss: "^4.3.5",
  "@tailwindcss/vite": "^4.3.5",
  typescript: "~6.0.3",
  react: "^19.3.1",
  "react-dom": "^19.3.1",
  "@types/react": "^19.3.0",
  "@types/react-dom": "^19.3.0",
};

function packageJson(title: string, framework: Framework): string {
  const pick = (keys: (keyof typeof VERSIONS)[]) =>
    Object.fromEntries(keys.map((key) => [key, VERSIONS[key]]));
  const react = framework === "react";
  return JSON.stringify(
    {
      name: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      private: true,
      type: "module",
      scripts: { dev: "vite", build: "vite build" },
      dependencies: react ? pick(["react", "react-dom"]) : {},
      devDependencies: pick([
        "vite",
        "tailwindcss",
        "@tailwindcss/vite",
        "typescript",
        ...(react ? (["@vitejs/plugin-react", "@types/react", "@types/react-dom"] as const) : []),
      ]),
    },
    null,
    2,
  );
}

const viteConfig = (framework: Framework) =>
  framework === "react"
    ? `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({ plugins: [react(), tailwindcss()] });
`
    : `import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({ plugins: [tailwindcss()] });
`;

/** Element ids the vanilla usage expects, e.g. querySelector("#terminal") */
const mountIds = (usage: string) =>
  [...usage.matchAll(/querySelector\(["']#([\w-]+)["']\)/g)].map((match) => match[1]);

function indexHtml(title: string, framework: Framework, usage: string): string {
  const body =
    framework === "react"
      ? `<div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>`
      : `${mountIds(usage)
          .map((id) => `<div id="${id}" class="min-h-96"></div>`)
          .join("\n    ")}\n    <script type="module" src="/src/main.ts"></script>`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body class="min-h-screen bg-neutral-950 p-8 text-neutral-200">
    ${body}
  </body>
</html>
`;
}

const REACT_MAIN = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;

const TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "bundler",
      jsx: "react-jsx",
      strict: true,
      skipLibCheck: true,
      lib: ["ES2022", "DOM", "DOM.Iterable"],
    },
    include: ["src"],
  },
  null,
  2,
);

export function stackblitzFiles(
  title: string,
  framework: Framework,
  files: File[],
  usage: string,
): Record<string, string> {
  const out: Record<string, string> = {
    "package.json": packageJson(title, framework),
    "vite.config.ts": viteConfig(framework),
    "tsconfig.json": TSCONFIG,
    "index.html": indexHtml(title, framework, usage),
    "src/index.css": `@import "tailwindcss";\n`,
  };
  for (const file of files) out[`src/${file.name}`] = file.code;
  if (framework === "react") {
    out["src/main.tsx"] = REACT_MAIN;
    out["src/App.tsx"] = usage;
  } else {
    out["src/main.ts"] = `import "./index.css";\n${usage}\n`;
  }
  return out;
}

/** Opens the project in a new tab */
export function openInStackBlitz(
  title: string,
  framework: Framework,
  files: File[],
  usage: string,
) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://stackblitz.com/run?file=src%2F" + encodeURIComponent(files[0]?.name ?? "");
  form.target = "_blank";
  const field = (name: string, value: string) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.append(input);
  };
  field("project[title]", `${title} (${framework}) · UXU-Ilhan`);
  field("project[description]", `${title} copied from the UXU-Ilhan playground`);
  field("project[template]", "node");
  for (const [path, code] of Object.entries(stackblitzFiles(title, framework, files, usage)))
    field(`project[files][${path}]`, code);
  document.body.append(form);
  form.submit();
  form.remove();
}
