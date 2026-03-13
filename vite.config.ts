import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
  define: {
    __SW_VERSION__: JSON.stringify(Date.now().toString(36)),
  },
  optimizeDeps: {
    exclude: ["@xmtp/browser-sdk"],
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [devtools(), tanstackStart(), nitro(), react()],
});

export default config;
