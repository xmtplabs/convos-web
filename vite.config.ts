import { readFileSync, writeFileSync } from "node:fs";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, type Plugin } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

// inject a build timestamp into sw.js so the browser detects new deploys
function swVersionPlugin(): Plugin {
  return {
    name: "sw-version",
    closeBundle() {
      try {
        const p = ".output/public/sw.js";
        const content = readFileSync(p, "utf-8");
        if (!content.startsWith("// build:")) {
          writeFileSync(p, `// build: ${Date.now()}\n${content}`);
        }
      } catch {
        // sw.js not written yet
      }
    },
  };
}

const config = defineConfig({
  worker: {
    plugins: () => [viteTsConfigPaths({ projects: ["./tsconfig.json"] })],
  },
  optimizeDeps: {
    exclude: ["@xmtp/browser-sdk"],
  },
  plugins: [
    devtools(),
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackStart(),
    nitro(),
    react(),
    swVersionPlugin(),
  ],
});

export default config;
