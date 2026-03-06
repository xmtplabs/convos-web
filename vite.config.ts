import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
  define: {
    __SW_VERSION__: JSON.stringify(Date.now().toString(36)),
  },
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
  ],
});

export default config;
