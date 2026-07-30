import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// Served at https://cinnamennen.github.io/amigurumi-tracker/ until a custom
// domain is set up (ami-fcq.16) — base must match the repo name in prod.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/amigurumi-tracker/" : "/",
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
}));
