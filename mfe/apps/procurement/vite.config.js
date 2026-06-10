import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "procurement",
      filename: "remoteEntry.js",
      exposes: { "./App": "./src/App.jsx" },
      shared: ["react", "react-dom"],
    }),
  ],
  server: { port: 5101, strictPort: true },
  preview: { port: 5101, strictPort: true },
  build: { target: "esnext", minify: false, cssCodeSplit: false },
});
