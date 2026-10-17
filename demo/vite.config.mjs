import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { optimizedImages } from "./scripts/optimized-images.mjs";
import { readFileSync } from "node:fs";

const ossImages = JSON.parse(readFileSync(new URL('./oss-images.json', import.meta.url), 'utf8'));
const remoteImages = Object.fromEntries(ossImages.images.map(image => [image.sourcePath, `${ossImages.origin}/${image.objectKey}`]));

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), optimizedImages({ remoteImages })],
});
