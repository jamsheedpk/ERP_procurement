import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";

// Host (shell) — consumes the domain remotes at runtime via Module Federation.
// Remote URLs point at each remote's `vite preview` server (or a deployed origin).
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "shell",
      remotes: {
        procurement: "http://localhost:5101/assets/remoteEntry.js",
        hr:          "http://localhost:5102/assets/remoteEntry.js",
        finance:     "http://localhost:5103/assets/remoteEntry.js",
        projects:    "http://localhost:5104/assets/remoteEntry.js",
      },
      shared: ["react", "react-dom", "react-router-dom"],
    }),
  ],
  server: { port: 5100, strictPort: true },
  preview: { port: 5100, strictPort: true },
  build: { target: "esnext", minify: false, cssCodeSplit: false },
});
