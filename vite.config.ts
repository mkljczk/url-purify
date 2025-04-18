import { resolve } from "path";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [dts({ include: ["lib"], insertTypesEntry: true })],
  build: {
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, "lib/main.ts"),
      fileName: (format) => `main.${format}.js`,
      formats: ["es"],
      name: "@mkljczk/clearurls",
    },
    target: "esnext",
    sourcemap: true,
  },
});
