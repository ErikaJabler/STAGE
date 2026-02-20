import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/stage/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/stage/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
